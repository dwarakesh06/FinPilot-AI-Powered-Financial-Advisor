const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { validateRequest } = require('../middleware/validateRequest');
const { createGoalSchema } = require('../validations');
const {
  getGoals,
  createGoal,
  updateGoal,
  deleteGoal,
  addContribution,
  getContributions,
} = require('../controllers/goalController');

router.use(protect); // Secure all savings goals endpoints

router.route('/')
  .get(getGoals)
  .post(validateRequest(createGoalSchema), createGoal);

router.route('/:id')
  .put(updateGoal)
  .delete(deleteGoal);

router.route('/:id/contributions')
  .get(getContributions)
  .post(addContribution);

module.exports = router;
