const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    category: {
      type: String,
      required: [true, 'Please add a budget category'],
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, 'Please add a budget limit amount'],
    },
    month: {
      type: String,
      required: [true, 'Please add a budget month in YYYY-MM format'],
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Create compound index for unique monthly category budget per user
budgetSchema.index({ userId: 1, category: 1, month: 1 }, { unique: true });

module.exports = mongoose.model('Budget', budgetSchema);
