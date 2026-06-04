const mongoose = require('mongoose');

const reminderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Please add a reminder title'],
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, 'Please specify the bill amount'],
    },
    dueDate: {
      type: Date,
      required: [true, 'Please specify the bill due date'],
    },
    frequency: {
      type: String,
      enum: ['once', 'weekly', 'monthly', 'yearly'],
      default: 'monthly',
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
    lastNotified: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Reminder', reminderSchema);
