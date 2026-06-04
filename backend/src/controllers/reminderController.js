const { z } = require('zod');
const Reminder = require('../models/Reminder');
const Transaction = require('../models/Transaction');

const reminderCreateSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  amount: z.number().positive('Amount must be positive'),
  dueDate: z.string().or(z.date()),
  frequency: z.enum(['once', 'weekly', 'monthly', 'yearly']).optional(),
  isPaid: z.boolean().optional(),
});

/**
 * @desc    Get all bill reminders
 * @route   GET /api/reminders
 * @access  Private
 */
const getReminders = async (req, res, next) => {
  try {
    const reminders = await Reminder.find({ userId: req.user.id }).sort({ dueDate: 1 });
    res.json({ success: true, count: reminders.length, reminders });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new bill reminder
 * @route   POST /api/reminders
 * @access  Private
 */
const createReminder = async (req, res, next) => {
  try {
    const validatedData = reminderCreateSchema.parse(req.body);
    const { title, amount, dueDate, frequency = 'monthly', isPaid = false } = validatedData;

    const reminder = await Reminder.create({
      userId: req.user.id,
      title,
      amount,
      dueDate: new Date(dueDate),
      frequency,
      isPaid,
    });

    res.status(201).json({ success: true, reminder });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400);
      return next(new Error(error.errors.map(e => e.message).join(', ')));
    }
    next(error);
  }
};

/**
 * @desc    Update bill reminder details
 * @route   PUT /api/reminders/:id
 * @access  Private
 */
const updateReminder = async (req, res, next) => {
  try {
    const validatedData = reminderCreateSchema.partial().parse(req.body);
    
    let reminder = await Reminder.findOne({ _id: req.params.id, userId: req.user.id });
    if (!reminder) {
      res.status(404);
      return next(new Error('Bill reminder not found'));
    }

    // Apply updates
    Object.keys(validatedData).forEach((key) => {
      if (validatedData[key] !== undefined) {
        reminder[key] = validatedData[key];
      }
    });

    await reminder.save();

    res.json({ success: true, reminder });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400);
      return next(new Error(error.errors.map(e => e.message).join(', ')));
    }
    next(error);
  }
};

/**
 * @desc    Toggle payment status (and auto-advance recurring dates)
 * @route   PATCH /api/reminders/:id/pay
 * @access  Private
 */
const togglePayReminder = async (req, res, next) => {
  try {
    const reminder = await Reminder.findOne({ _id: req.params.id, userId: req.user.id });
    if (!reminder) {
      res.status(404);
      return next(new Error('Reminder not found'));
    }

    const wasPaid = reminder.isPaid;
    
    if (!wasPaid) {
      // User is marking it as PAID.
      
      // 1. Generate an automatic transaction record so their cash flow is tracked!
      // This is a premium UX touch.
      await Transaction.create({
        userId: req.user.id,
        title: `Bill Paid: ${reminder.title}`,
        amount: reminder.amount,
        type: 'expense',
        category: 'Housing & Utilities', // Standard category for bills
        date: new Date(),
        description: `Automatic expense logged from bill reminder payment cycle.`,
      });

      // 2. If it is a recurring frequency, advance the date to the next cycle and keep it unpaid!
      if (reminder.frequency !== 'once') {
        const nextDue = new Date(reminder.dueDate);
        
        if (reminder.frequency === 'weekly') {
          nextDue.setDate(nextDue.getDate() + 7);
        } else if (reminder.frequency === 'monthly') {
          nextDue.setMonth(nextDue.getMonth() + 1);
        } else if (reminder.frequency === 'yearly') {
          nextDue.setFullYear(nextDue.getFullYear() + 1);
        }

        reminder.dueDate = nextDue;
        reminder.isPaid = false; // Remains active for next period
        await reminder.save();

        return res.json({
          success: true,
          message: `Bill logged in expenses. Reminder advanced to next due date: ${nextDue.toLocaleDateString()}`,
          reminder,
        });
      } else {
        // One-time bill simply marks completed
        reminder.isPaid = true;
      }
    } else {
      // Toggle back to unpaid
      reminder.isPaid = false;
    }

    await reminder.save();
    res.json({ success: true, reminder });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a bill reminder
 * @route   DELETE /api/reminders/:id
 * @access  Private
 */
const deleteReminder = async (req, res, next) => {
  try {
    const reminder = await Reminder.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!reminder) {
      res.status(404);
      return next(new Error('Reminder not found'));
    }
    res.json({ success: true, message: 'Bill reminder deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getReminders,
  createReminder,
  updateReminder,
  togglePayReminder,
  deleteReminder,
};
