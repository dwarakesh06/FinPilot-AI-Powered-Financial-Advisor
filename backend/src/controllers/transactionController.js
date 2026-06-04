const { z } = require('zod');
const Transaction = require('../models/Transaction');
const Insight = require('../models/Insight');
const { parseCSVTransactions } = require('../utils/csvParser');

// Zod Validation Schemas
const transactionCreateSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  amount: z.number().positive('Amount must be greater than zero'),
  type: z.enum(['income', 'expense']),
  category: z.string().min(1, 'Category is required'),
  date: z.string().or(z.date()).optional(),
  description: z.string().optional(),
});

// Helper function to invalidate/delete the cached insight for a specific transaction date
const invalidateInsightCache = async (userId, dateInput) => {
  try {
    const date = new Date(dateInput || Date.now());
    if (isNaN(date.getTime())) return;
    const monthStr = date.toISOString().slice(0, 7); // Format: "YYYY-MM"
    await Insight.findOneAndDelete({ userId, month: monthStr });
  } catch (err) {
    console.error('Failed to invalidate insight cache:', err);
  }
};

/**
 * @desc    Get all transactions with filters, search, and pagination
 * @route   GET /api/transactions
 * @access  Private
 */
const getTransactions = async (req, res, next) => {
  try {
    const { category, type, startDate, endDate, search, page = 1, limit = 10 } = req.query;

    const query = { userId: req.user.id };

    // Apply Filters
    if (category) {
      query.category = category;
    }
    if (type) {
      query.type = type;
    }
    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        query.date.$gte = new Date(startDate);
      }
      if (endDate) {
        query.date.$lte = new Date(endDate);
      }
    }
    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Execute queries in parallel
    const [transactions, total] = await Promise.all([
      Transaction.find(query)
        .sort({ date: -1, createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Transaction.countDocuments(query),
    ]);

    res.json({
      success: true,
      count: transactions.length,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
        totalItems: total,
      },
      transactions,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single transaction details
 * @route   GET /api/transactions/:id
 * @access  Private
 */
const getTransactionById = async (req, res, next) => {
  try {
    const transaction = await Transaction.findOne({ _id: req.params.id, userId: req.user.id });
    if (!transaction) {
      res.status(404);
      return next(new Error('Transaction not found'));
    }
    res.json({ success: true, transaction });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new transaction (income/expense)
 * @route   POST /api/transactions
 * @access  Private
 */
const createTransaction = async (req, res, next) => {
  try {
    const validatedData = transactionCreateSchema.parse(req.body);
    const { title, amount, type, category, date, description } = validatedData;

    const transaction = await Transaction.create({
      userId: req.user.id,
      title,
      amount,
      type,
      category,
      date: date ? new Date(date) : undefined,
      description,
    });

    // Invalidate cached insight
    await invalidateInsightCache(req.user.id, transaction.date);

    res.status(201).json({ success: true, transaction });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400);
      return next(new Error(error.errors.map(e => e.message).join(', ')));
    }
    next(error);
  }
};

/**
 * @desc    Update a transaction
 * @route   PUT /api/transactions/:id
 * @access  Private
 */
const updateTransaction = async (req, res, next) => {
  try {
    const validatedData = transactionCreateSchema.partial().parse(req.body);
    
    let transaction = await Transaction.findOne({ _id: req.params.id, userId: req.user.id });
    if (!transaction) {
      res.status(404);
      return next(new Error('Transaction not found'));
    }

    const oldDate = transaction.date;

    // Perform update
    Object.keys(validatedData).forEach((key) => {
      if (validatedData[key] !== undefined) {
        transaction[key] = validatedData[key];
      }
    });

    await transaction.save();

    // Invalidate cached insights for both old and new dates if they are in different months
    await invalidateInsightCache(req.user.id, transaction.date);
    if (oldDate && oldDate.toISOString().slice(0, 7) !== new Date(transaction.date).toISOString().slice(0, 7)) {
      await invalidateInsightCache(req.user.id, oldDate);
    }

    res.json({ success: true, transaction });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400);
      return next(new Error(error.errors.map(e => e.message).join(', ')));
    }
    next(error);
  }
};

/**
 * @desc    Delete a transaction
 * @route   DELETE /api/transactions/:id
 * @access  Private
 */
const deleteTransaction = async (req, res, next) => {
  try {
    const transaction = await Transaction.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!transaction) {
      res.status(404);
      return next(new Error('Transaction not found'));
    }

    // Invalidate cached insight
    await invalidateInsightCache(req.user.id, transaction.date);

    res.json({ success: true, message: 'Transaction deleted successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Import bank statement from CSV and auto-categorize
 * @route   POST /api/transactions/import
 * @access  Private
 */
const importTransactionsCSV = async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400);
      return next(new Error('Please upload a valid CSV bank statement file'));
    }

    const csvContent = req.file.buffer.toString('utf-8');
    const parsedTransactions = parseCSVTransactions(csvContent);

    // Map userId to all parsed items
    const transactionsToInsert = parsedTransactions.map(tx => ({
      ...tx,
      userId: req.user.id,
    }));

    if (transactionsToInsert.length === 0) {
      return res.json({
        success: true,
        message: 'No transactions found inside the CSV to import.',
        count: 0,
      });
    }

    // Save in bulk
    const importedItems = await Transaction.insertMany(transactionsToInsert);

    // Invalidate cached insights for all unique months found in imported transactions
    const uniqueMonths = [...new Set(importedItems.map(tx => {
      const d = new Date(tx.date);
      return isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 7);
    }))].filter(Boolean);

    for (const monthStr of uniqueMonths) {
      await Insight.findOneAndDelete({ userId: req.user.id, month: monthStr });
    }

    res.status(201).json({
      success: true,
      message: `Successfully imported and auto-categorized ${importedItems.length} transactions!`,
      count: importedItems.length,
      transactions: importedItems.slice(0, 5), // Return first 5 as a sample preview
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  importTransactionsCSV,
};
