const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Please add a savings goal title'],
      trim: true,
    },
    targetAmount: {
      type: Number,
      required: [true, 'Please add a target savings amount'],
    },
    currentAmount: {
      type: Number,
      default: 0,
    },
    deadline: {
      type: Date,
      required: [true, 'Please set a goal deadline'],
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'expired'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Goal', goalSchema);
