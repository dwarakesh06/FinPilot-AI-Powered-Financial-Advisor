const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { validateRequest } = require('../middleware/validateRequest');
const { createReminderSchema, markReminderPaidSchema } = require('../validations');
const {
  getReminders,
  createReminder,
  updateReminder,
  togglePayReminder,
  deleteReminder,
} = require('../controllers/reminderController');

router.use(protect); // Secure all bill reminder endpoints

router.route('/')
  .get(getReminders)
  .post(validateRequest(createReminderSchema), createReminder);

router.route('/:id')
  .put(updateReminder)
  .delete(deleteReminder);

router.patch('/:id/pay', togglePayReminder);

module.exports = router;
