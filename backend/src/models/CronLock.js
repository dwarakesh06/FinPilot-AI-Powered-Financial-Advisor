const mongoose = require('mongoose');

const cronLockSchema = new mongoose.Schema(
  {
    jobName: {
      type: String,
      required: true,
      unique: true,
    },
    lockedAt: {
      type: Date,
    },
    lockedBy: {
      type: String, // Instance ID or hostname
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('CronLock', cronLockSchema);
