const mongoose = require('mongoose');

const goalContributionSchema = new mongoose.Schema(
  {
    goalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Goal',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amount: {
      type: Number,
      required: [true, 'Please add a contribution amount'],
    },
    date: {
      type: Date,
      default: Date.now,
    },
    note: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index on goalId and userId for fast lookups and aggregation
goalContributionSchema.index({ goalId: 1 });
goalContributionSchema.index({ userId: 1 });

module.exports = mongoose.model('GoalContribution', goalContributionSchema);
