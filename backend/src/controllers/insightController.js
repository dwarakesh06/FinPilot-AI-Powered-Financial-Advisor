const { generateFinancialInsights } = require('../services/aiService');
const { generateForecast } = require('../services/forecastService');
const Insight = require('../models/Insight');

/**
 * @desc    Get monthly financial insights (AI or rule fallback)
 * @route   GET /api/insights
 * @access  Private
 */
const getMonthlyInsights = async (req, res, next) => {
  try {
    const month = req.query.month || new Date().toISOString().slice(0, 7); // Default to current month
    const forceRefresh = req.query.refresh === 'true';

    // 1. Check if we have cached insights for this month (only if not force refreshing)
    if (!forceRefresh) {
      const cachedInsight = await Insight.findOne({ userId: req.user.id, month });
      if (cachedInsight) {
        if (cachedInsight.status === 'processing') {
          return res.status(202).json({
            success: true,
            processing: true,
            message: 'Financial insights are currently being generated.',
            insight: cachedInsight
          });
        }
        return res.json({
          success: true,
          insight: cachedInsight,
          cached: true,
        });
      }
    }

    // 2. Insert a 'processing' placeholder so subsequent requests don't duplicate the job
    const processingRecord = await Insight.findOneAndUpdate(
      { userId: req.user.id, month },
      { status: 'processing', summary: 'Generating insights...' },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // 3. Fire the background generation task (do not await it)
    generateFinancialInsights(req.user.id, month).then(async (insightData) => {
      await Insight.findOneAndUpdate(
        { userId: req.user.id, month },
        {
          status: 'completed',
          summary: insightData.summary,
          suggestions: insightData.suggestions,
          overspentCategories: insightData.overspentCategories,
          savingsRate: insightData.savingsRate,
          healthScore: insightData.healthScore,
          scoreBreakdown: insightData.scoreBreakdown,
          income: insightData.income || 0,
          expenses: insightData.expenses || 0,
          savings: insightData.savings || 0,
        }
      );
    }).catch(async (err) => {
      console.error('[Background AI] Generation failed:', err);
      await Insight.findOneAndUpdate(
        { userId: req.user.id, month },
        { status: 'failed', summary: 'Failed to generate insights.' }
      );
    });

    // 4. Return 202 Accepted immediately to the frontend
    res.status(202).json({
      success: true,
      processing: true,
      message: 'Financial insights generation started in the background.',
      insight: processingRecord
    });

    // (Remaining block replaced by above background logic)
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get next month's statistical expense predictions and savings potentials
 * @route   GET /api/insights/forecast
 * @access  Private
 */
const getExpenseForecast = async (req, res, next) => {
  try {
    const forecast = await generateForecast(req.user.id);
    res.json({
      success: true,
      forecast,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMonthlyInsights,
  getExpenseForecast,
};
