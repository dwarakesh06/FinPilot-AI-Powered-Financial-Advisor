const mongoose = require('mongoose');

const insightSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    month: {
      type: String,
      required: [true, 'Please add a month for the insight in YYYY-MM format'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['processing', 'completed', 'failed'],
      default: 'completed'
    },
    summary: {
      type: String,
    },
    suggestions: [
      {
        type: String,
      },
    ],
    overspentCategories: [
      {
        type: String,
      },
    ],
    savingsRate: {
      type: Number,
      default: 0,
    },
    healthScore: {
      type: Number,
      default: 0,
    },
    scoreBreakdown: {
      savingsScore: { type: Number, default: 0 },
      budgetScore: { type: Number, default: 0 },
      consistencyScore: { type: Number, default: 0 },
      emergencyScore: { type: Number, default: 0 },
      goalScore: { type: Number, default: 0 },
    },
    income: {
      type: Number,
      default: 0,
    },
    expenses: {
      type: Number,
      default: 0,
    },
    savings: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Create compound index for single insight per user per month
insightSchema.index({ userId: 1, month: 1 }, { unique: true });

module.exports = mongoose.model('Insight', insightSchema);
