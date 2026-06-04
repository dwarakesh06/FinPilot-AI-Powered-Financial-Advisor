const { z } = require('zod');

// Auth Schemas
const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    currency: z.string().length(3).optional(),
  })
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  })
});

const updateSettingsSchema = z.object({
  body: z.object({
    currency: z.string().length(3, 'Currency must be 3 characters'),
  })
});

// Transaction Schemas
const createTransactionSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required'),
    amount: z.number().positive('Amount must be positive'),
    type: z.enum(['income', 'expense']),
    category: z.string().min(1, 'Category is required'),
    date: z.string().datetime({ message: "Invalid date format, must be ISO 8601 string" }).optional().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)),
    description: z.string().optional(),
  })
});

const updateTransactionSchema = z.object({
  params: z.object({ id: z.string() }),
  body: z.object({
    title: z.string().optional(),
    amount: z.number().positive().optional(),
    type: z.enum(['income', 'expense']).optional(),
    category: z.string().optional(),
    date: z.string().optional(),
    description: z.string().optional(),
  })
});

// Budget Schemas
const createBudgetSchema = z.object({
  body: z.object({
    category: z.string().min(1, 'Category is required'),
    amount: z.number().positive('Amount must be positive'),
    month: z.string().regex(/^\d{4}-\d{2}$/, 'Month must be in YYYY-MM format'),
  })
});

// Goal Schemas
const createGoalSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required'),
    targetAmount: z.number().positive('Target must be positive'),
    currentAmount: z.number().min(0).optional(),
    deadline: z.string().optional(),
  })
});

// Reminder Schemas
const createReminderSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required'),
    amount: z.number().positive('Amount must be positive'),
    dueDate: z.string().min(1, 'Due date is required'),
    frequency: z.enum(['once', 'weekly', 'monthly', 'yearly']).optional(),
  })
});

const markReminderPaidSchema = z.object({
  params: z.object({ id: z.string() }),
  body: z.object({
    isPaid: z.boolean(),
  })
});

// Query Params Schema
const queryParamsSchema = z.object({
  query: z.object({
    month: z.string().optional(),
    limit: z.string().or(z.number()).optional(),
    page: z.string().or(z.number()).optional(),
    type: z.string().optional(),
    category: z.string().optional(),
    search: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  })
});

module.exports = {
  registerSchema,
  loginSchema,
  updateSettingsSchema,
  createTransactionSchema,
  updateTransactionSchema,
  createBudgetSchema,
  createGoalSchema,
  createReminderSchema,
  markReminderPaidSchema,
  queryParamsSchema,
};
