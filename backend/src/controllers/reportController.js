const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const Insight = require('../models/Insight');
const { generateMonthlyPDFReport } = require('../services/pdfService');

/**
 * @desc    Export transactions as CSV sheet download
 * @route   GET /api/reports/csv
 * @access  Private
 */
const exportCSV = async (req, res, next) => {
  try {
    const transactions = await Transaction.find({ userId: req.user.id }).sort({ date: -1 });

    // Set headers for download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="transactions_export.csv"');

    // Create CSV content
    let csv = 'Date,Title,Amount,Type,Category,Description,Imported\n';
    
    transactions.forEach((tx) => {
      const dateStr = tx.date.toISOString().slice(0, 10);
      const titleClean = tx.title.replace(/"/g, '""');
      const descClean = (tx.description || '').replace(/"/g, '""');
      
      csv += `"${dateStr}","${titleClean}",${tx.amount},"${tx.type}","${tx.category}","${descClean}",${tx.imported}\n`;
    });

    res.status(200).send(csv);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Generate printable PDF balance sheet statement for download
 * @route   GET /api/reports/pdf
 * @access  Private
 */
const exportPDF = async (req, res, next) => {
  try {
    const month = req.query.month || new Date().toISOString().slice(0, 7); // Default to current month

    const startDate = new Date(`${month}-01T00:00:00.000Z`);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);

    // 1. Fetch transactions for that month
    const transactions = await Transaction.find({
      userId: req.user.id,
      date: { $gte: startDate, $lt: endDate },
    }).sort({ date: -1 });

    // 2. Fetch budgets set for that month
    const budgets = await Budget.find({ userId: req.user.id, month });

    // 3. Fetch insights cached for that month (fallback to general calculation info if missing)
    let insights = await Insight.findOne({ userId: req.user.id, month });
    
    if (!insights) {
      // Calculate local rule-based insights if not cached yet
      const { generateFinancialInsights } = require('../services/aiService');
      const calculatedInsights = await generateFinancialInsights(req.user.id, month);
      
      insights = await Insight.create({
        userId: req.user.id,
        month,
        summary: calculatedInsights.summary,
        suggestions: calculatedInsights.suggestions,
        overspentCategories: calculatedInsights.overspentCategories,
        savingsRate: calculatedInsights.savingsRate,
        healthScore: calculatedInsights.healthScore,
      });
    }

    // Set headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="financial_statement_${month}.pdf"`);

    // Stream PDF directly to client response
    generateMonthlyPDFReport(res, {
      user: req.user,
      month,
      transactions,
      budgets,
      insights,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  exportCSV,
  exportPDF,
};
