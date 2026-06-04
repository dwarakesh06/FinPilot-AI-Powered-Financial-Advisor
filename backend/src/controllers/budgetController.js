const { z } = require('zod');
const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction');

const budgetCreateSchema = z.object({
  category: z.string().min(1, 'Category is required'),
  amount: z.number().positive('Budget limit must be greater than zero'),
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Month must be in YYYY-MM format'),
});

/**
 * @desc    Get all budgets or budgets filtered by month
 * @route   GET /api/budgets
 * @access  Private
 */
const getBudgets = async (req, res, next) => {
  try {
    const { month } = req.query;
    const query = { userId: req.user.id };

    if (month) {
      query.month = month;
    }

    const budgets = await Budget.find(query).sort({ category: 1 });

    res.json({ success: true, count: budgets.length, budgets });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create or update a monthly category budget limit
 * @route   POST /api/budgets
 * @access  Private
 */
const upsertBudget = async (req, res, next) => {
  try {
    const validatedData = budgetCreateSchema.parse(req.body);
    const { category, amount, month } = validatedData;

    // Search if a budget already exists for this month + category
    let budget = await Budget.findOne({
      userId: req.user.id,
      category,
      month,
    });

    if (budget) {
      // Update
      budget.amount = amount;
      await budget.save();
    } else {
      // Create new
      budget = await Budget.create({
        userId: req.user.id,
        category,
        amount,
        month,
      });
    }

    res.status(200).json({ success: true, budget });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400);
      return next(new Error(error.errors.map(e => e.message).join(', ')));
    }
    next(error);
  }
};

/**
 * @desc    Delete a budget limit
 * @route   DELETE /api/budgets/:id
 * @access  Private
 */
const deleteBudget = async (req, res, next) => {
  try {
    const budget = await Budget.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!budget) {
      res.status(404);
      return next(new Error('Budget limit not found'));
    }
    res.json({ success: true, message: 'Budget limit removed successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get detailed comparison of monthly budget limits vs actual spending
 * @route   GET /api/budgets/summary
 * @access  Private
 */
const getBudgetSummary = async (req, res, next) => {
  try {
    const month = req.query.month || new Date().toISOString().slice(0, 7); // Default to current month

    const startDate = new Date(`${month}-01T00:00:00.000Z`);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);

    // 1. Fetch budgets set for this month
    const budgets = await Budget.find({ userId: req.user.id, month });

    // 2. Fetch expenses incurred this month
    const expenses = await Transaction.find({
      userId: req.user.id,
      type: 'expense',
      date: { $gte: startDate, $lt: endDate },
    });

    // Sum actual spending per category
    const actualSpend = {};
    expenses.forEach((tx) => {
      if (!actualSpend[tx.category]) {
        actualSpend[tx.category] = 0;
      }
      actualSpend[tx.category] += tx.amount;
    });

    // 3. Compile compared list
    const summary = [];
    const budgetedCategories = new Set(budgets.map(b => b.category));
    const allCategories = new Set([...budgetedCategories, ...Object.keys(actualSpend)]);

    allCategories.forEach((cat) => {
      const budgetObj = budgets.find(b => b.category === cat);
      const limit = budgetObj ? budgetObj.amount : 0;
      const spent = actualSpend[cat] || 0;
      const remaining = limit - spent;
      const overLimit = spent > limit;

      summary.push({
        budgetId: budgetObj ? budgetObj._id : null,
        category: cat,
        limit,
        spent: Math.round(spent * 100) / 100,
        remaining: Math.round(remaining * 100) / 100,
        isOverLimit: limit > 0 && overLimit,
        progressPercent: limit > 0 ? Math.min(100, Math.round((spent / limit) * 100)) : 0,
      });
    });

    res.json({
      success: true,
      month,
      summary: summary.sort((a, b) => b.spent - a.spent),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getBudgets,
  upsertBudget,
  deleteBudget,
  getBudgetSummary,
};
