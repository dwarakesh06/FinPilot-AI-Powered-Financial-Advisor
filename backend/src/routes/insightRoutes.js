const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getMonthlyInsights,
  getExpenseForecast,
} = require('../controllers/insightController');

router.use(protect); // Secure all insights endpoints

router.get('/', getMonthlyInsights);
router.get('/forecast', getExpenseForecast);

module.exports = router;
