const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Please add a transaction title'],
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, 'Please add a transaction amount'],
    },
    type: {
      type: String,
      required: [true, 'Please specify transaction type'],
      enum: ['income', 'expense'],
    },
    category: {
      type: String,
      required: [true, 'Please add a category'],
      trim: true,
    },
    date: {
      type: Date,
      required: [true, 'Please add a date'],
      default: Date.now,
    },
    description: {
      type: String,
      trim: true,
    },
    imported: {
      type: Boolean,
      default: false,
    },
    idempotencyKey: {
      type: String,
      unique: true,
      sparse: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexing for search performance
transactionSchema.index({ userId: 1, date: -1 });
transactionSchema.index({ userId: 1, category: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);
