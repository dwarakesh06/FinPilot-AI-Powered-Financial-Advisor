const cron = require('node-cron');
const Reminder = require('../models/Reminder');
const Transaction = require('../models/Transaction');
const CronLock = require('../models/CronLock');

/**
 * Initialize background cron jobs
 */
const initCronJobs = () => {
  // Run daily at midnight: '0 0 * * *'
  // For easy demonstration, we will run it once every 12 hours
  cron.schedule('0 */12 * * *', async () => {
    console.log('[Cron Service] Attempting to acquire lock for daily auto-pay...');
    try {
      // 1. Acquire distributed lock to prevent multi-instance race conditions
      // Lock is valid for 1 hour
      const lockWindow = new Date(Date.now() - 1000 * 60 * 60); 
      
      let lockAcquired = false;
      try {
        const lock = await CronLock.findOneAndUpdate(
          { 
            jobName: 'daily-auto-pay',
            $or: [
              { lockedAt: null },
              { lockedAt: { $lt: lockWindow } }
            ]
          },
          {
            $set: {
              lockedAt: new Date(),
              lockedBy: `instance-${Math.random().toString(36).substring(7)}`
            }
          },
          { upsert: true, new: true }
        );
        if (lock) lockAcquired = true;
      } catch (err) {
        // If upsert fails with E11000 duplicate key error, another instance holds the lock.
        if (err.code !== 11000) {
          console.error('[Cron Service] Lock acquisition error:', err.message);
        }
      }

      if (!lockAcquired) {
        console.log('[Cron Service] Job locked by another instance. Skipping execution.');
        return;
      }

      console.log('[Cron Service] Lock acquired. Running daily auto-pay and bill scan...');

      const today = new Date();
      // Set to midnight for accurate day comparison
      today.setHours(0, 0, 0, 0);
      
      const threeDaysAhead = new Date(today);
      threeDaysAhead.setDate(today.getDate() + 3);

      // Find active reminders
      const activeReminders = await Reminder.find({
        isPaid: false,
        dueDate: { $lte: threeDaysAhead },
      }).populate('userId');

      let notifiedCount = 0;
      let paidCount = 0;

      for (const rem of activeReminders) {
        const due = new Date(rem.dueDate);
        due.setHours(0, 0, 0, 0);
        const daysRemaining = Math.ceil((due - today) / (1000 * 60 * 60 * 24));

        if (daysRemaining <= 0) {
          // Bill is due today or overdue. Let's Auto-Pay it safely!
          
          // 1. Generate Idempotency Key: reminderId + ISO date (YYYY-MM-DD)
          const dateStr = due.toISOString().split('T')[0];
          const idemKey = `autopay_${rem._id}_${dateStr}`;
          
          // 2. Check if this transaction was already created
          const existingTx = await Transaction.findOne({ idempotencyKey: idemKey });
          
          if (!existingTx) {
            // Safe to process payment
            await Transaction.create({
              userId: rem.userId._id,
              title: `Auto-Paid Bill: ${rem.title}`,
              amount: rem.amount,
              type: 'expense',
              category: 'Housing & Utilities', // Standard category for bills
              date: new Date(),
              description: `Automatic expense logged from bill reminder cron auto-pay.`,
              idempotencyKey: idemKey,
            });
            paidCount++;
            console.log(`[Cron Service] Auto-paid bill "${rem.title}" for $${rem.amount} (Idempotency Key: ${idemKey})`);
          }

          // 3. Advance the due date for recurring bills
          if (rem.frequency !== 'once') {
            const nextDue = new Date(rem.dueDate);
            if (rem.frequency === 'weekly') {
              nextDue.setDate(nextDue.getDate() + 7);
            } else if (rem.frequency === 'monthly') {
              nextDue.setMonth(nextDue.getMonth() + 1);
            } else if (rem.frequency === 'yearly') {
              nextDue.setFullYear(nextDue.getFullYear() + 1);
            }
            rem.dueDate = nextDue;
            rem.isPaid = false; // Keep it active for next cycle
          } else {
            // One-time bills are just marked paid
            rem.isPaid = true;
          }
          
        } else {
          // Just notify for upcoming bills
          console.log(`[ALERT] UPCOMING BILL: User ${rem.userId ? rem.userId.name : 'Unknown'} has bill "${rem.title}" for $${rem.amount} due in ${daysRemaining} day(s)`);
        }

        // Update lastNotified time
        rem.lastNotified = new Date();
        await rem.save();
        notifiedCount++;
      }
      console.log(`[Cron Service] Scanning complete. Auto-paid ${paidCount} bills, processed ${notifiedCount} reminders total.`);
    } catch (error) {
      console.error('[Cron Service] Error scanning bills:', error.message);
    }
  });

  console.log('[Cron Service] Background cron schedulers initialized.');
};

module.exports = {
  initCronJobs,
};
