const { z } = require('zod');
const Goal = require('../models/Goal');
const GoalContribution = require('../models/GoalContribution');

const goalCreateSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  targetAmount: z.number().positive('Target must be greater than zero'),
  currentAmount: z.number().nonnegative().optional(),
  deadline: z.string().or(z.date()),
});

const contributionCreateSchema = z.object({
  amount: z.number().positive('Contribution amount must be greater than zero'),
  date: z.string().or(z.date()).optional(),
  note: z.string().optional(),
});

// Helper function to check and update goal status based on deadline expiration
const checkAndMarkExpiredGoals = async (goals) => {
  const now = new Date();
  for (const goal of goals) {
    if (goal.status === 'active' && new Date(goal.deadline) < now) {
      goal.status = 'expired';
      await goal.save();
    } else if (goal.status === 'expired' && new Date(goal.deadline) >= now) {
      if (goal.currentAmount >= goal.targetAmount) {
        goal.status = 'completed';
      } else {
        goal.status = 'active';
      }
      await goal.save();
    }
  }
};

/**
 * @desc    Get all savings goals
 * @route   GET /api/goals
 * @access  Private
 */
const getGoals = async (req, res, next) => {
  try {
    const goals = await Goal.find({ userId: req.user.id }).sort({ deadline: 1 });
    await checkAndMarkExpiredGoals(goals);
    // Fetch fresh copies after update
    const freshGoals = await Goal.find({ userId: req.user.id }).sort({ deadline: 1 });
    res.json({ success: true, count: freshGoals.length, goals: freshGoals });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new savings goal
 * @route   POST /api/goals
 * @access  Private
 */
const createGoal = async (req, res, next) => {
  try {
    const validatedData = goalCreateSchema.parse(req.body);
    const { title, targetAmount, currentAmount = 0, deadline } = validatedData;

    const goal = await Goal.create({
      userId: req.user.id,
      title,
      targetAmount,
      currentAmount: 0, // Start at 0, initial deposit will trigger contribution
      deadline: new Date(deadline),
      status: 'active',
    });

    // Create an initial baseline contribution if currentAmount > 0
    if (currentAmount > 0) {
      await GoalContribution.create({
        goalId: goal._id,
        userId: req.user.id,
        amount: currentAmount,
        note: 'Initial deposit baseline balance',
      });
      
      goal.currentAmount = currentAmount;
      if (goal.currentAmount >= goal.targetAmount) {
        goal.status = 'completed';
      }
      await goal.save();
    }

    res.status(201).json({ success: true, goal });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400);
      return next(new Error(error.errors.map(e => e.message).join(', ')));
    }
    next(error);
  }
};

/**
 * @desc    Update savings goal details (excluding direct progress amount)
 * @route   PUT /api/goals/:id
 * @access  Private
 */
const updateGoal = async (req, res, next) => {
  try {
    const validatedData = goalCreateSchema.partial().parse(req.body);
    
    let goal = await Goal.findOne({ _id: req.params.id, userId: req.user.id });
    if (!goal) {
      res.status(404);
      return next(new Error('Savings goal not found'));
    }

    // Apply updates (ignoring currentAmount to preserve contribution ledger)
    Object.keys(validatedData).forEach((key) => {
      if (key !== 'currentAmount' && validatedData[key] !== undefined) {
        goal[key] = validatedData[key];
      }
    });

    // Recheck status
    if (goal.currentAmount >= goal.targetAmount) {
      goal.status = 'completed';
    } else {
      const now = new Date();
      if (new Date(goal.deadline) < now) {
        goal.status = 'expired';
      } else {
        goal.status = 'active';
      }
    }

    await goal.save();

    res.json({ success: true, goal });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400);
      return next(new Error(error.errors.map(e => e.message).join(', ')));
    }
    next(error);
  }
};

/**
 * @desc    Delete a savings goal and its contributions
 * @route   DELETE /api/goals/:id
 * @access  Private
 */
const deleteGoal = async (req, res, next) => {
  try {
    const goal = await Goal.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!goal) {
      res.status(404);
      return next(new Error('Goal not found'));
    }

    // Clean up all contributions associated with the goal
    await GoalContribution.deleteMany({ goalId: goal._id });

    res.json({ success: true, message: 'Savings goal and contribution history deleted successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Add a money contribution to a savings goal
 * @route   POST /api/goals/:id/contributions
 * @access  Private
 */
const addContribution = async (req, res, next) => {
  try {
    const validatedData = contributionCreateSchema.parse(req.body);
    const { amount, date, note } = validatedData;

    const goal = await Goal.findOne({ _id: req.params.id, userId: req.user.id });
    if (!goal) {
      res.status(404);
      return next(new Error('Savings goal not found'));
    }

    // Create the contribution
    const contribution = await GoalContribution.create({
      goalId: goal._id,
      userId: req.user.id,
      amount,
      date: date ? new Date(date) : undefined,
      note: note || 'Goal contribution deposit',
    });

    // Recalculate total savings currentAmount from contributions
    const contributions = await GoalContribution.find({ goalId: goal._id });
    const totalAmount = contributions.reduce((sum, c) => sum + c.amount, 0);
    
    goal.currentAmount = totalAmount;

    // Check status
    if (goal.currentAmount >= goal.targetAmount) {
      goal.status = 'completed';
    } else {
      const now = new Date();
      if (new Date(goal.deadline) < now) {
        goal.status = 'expired';
      } else {
        goal.status = 'active';
      }
    }

    await goal.save();

    res.status(201).json({ success: true, contribution, goal });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400);
      return next(new Error(error.errors.map(e => e.message).join(', ')));
    }
    next(error);
  }
};

/**
 * @desc    Get contribution history for a goal
 * @route   GET /api/goals/:id/contributions
 * @access  Private
 */
const getContributions = async (req, res, next) => {
  try {
    const goal = await Goal.findOne({ _id: req.params.id, userId: req.user.id });
    if (!goal) {
      res.status(404);
      return next(new Error('Savings goal not found'));
    }

    const contributions = await GoalContribution.find({ goalId: goal._id }).sort({ date: -1 });
    res.json({ success: true, count: contributions.length, contributions });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getGoals,
  createGoal,
  updateGoal,
  deleteGoal,
  addContribution,
  getContributions,
};
