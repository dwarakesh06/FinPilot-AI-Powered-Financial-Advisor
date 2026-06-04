const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { validateRequest } = require('../middleware/validateRequest');
const { createBudgetSchema, queryParamsSchema } = require('../validations');
const {
  getBudgets,
  upsertBudget,
  deleteBudget,
  getBudgetSummary,
} = require('../controllers/budgetController');

router.route('/')
  .get(protect, validateRequest(queryParamsSchema), getBudgets)
  .post(protect, validateRequest(createBudgetSchema), upsertBudget);

router.route('/summary').get(protect, validateRequest(queryParamsSchema), getBudgetSummary);
router.route('/:id').delete(protect, deleteBudget);

module.exports = router;
