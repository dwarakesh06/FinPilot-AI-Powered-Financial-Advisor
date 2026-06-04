const Transaction = require('../models/Transaction');

/**
 * @desc    Get monthly aggregated income/expense totals for dashboard
 * @route   GET /api/dashboard/summary
 * @access  Private
 * @query   months=6 (optional, defaults to 6)
 */
const getDashboardSummary = async (req, res, next) => {
  try {
    const monthsBack = parseInt(req.query.months) || 6;
    const userId = req.user.id;

    // Build date range
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - (monthsBack - 1), 1);

    // MongoDB aggregation pipeline: group by year-month and type
    const pipeline = [
      {
        $match: {
          userId: require('mongoose').Types.ObjectId.createFromHexString(userId),
          date: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
            type: '$type',
          },
          total: { $sum: '$amount' },
        },
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 },
      },
    ];

    const results = await Transaction.aggregate(pipeline);

    // Build a map: "YYYY-MM" -> { income, expense }
    const monthMap = {};
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Pre-populate all months in range with zero values
    for (let i = 0; i < monthsBack; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - (monthsBack - 1) + i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthMap[key] = {
        name: monthNames[d.getMonth()],
        year: d.getFullYear(),
        month: d.getMonth() + 1,
        Income: 0,
        Expense: 0,
      };
    }

    // Fill in actual data
    for (const row of results) {
      const key = `${row._id.year}-${String(row._id.month).padStart(2, '0')}`;
      if (monthMap[key]) {
        if (row._id.type === 'income') {
          monthMap[key].Income = row.total;
        } else if (row._id.type === 'expense') {
          monthMap[key].Expense = row.total;
        }
      }
    }

    const chartData = Object.values(monthMap);

    // Calculate current and previous month totals for percentage change
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthKey = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;

    const currentMonth = monthMap[currentMonthKey] || { Income: 0, Expense: 0 };
    const prevMonth = monthMap[prevMonthKey] || { Income: 0, Expense: 0 };

    const incomeChange = prevMonth.Income > 0
      ? (((currentMonth.Income - prevMonth.Income) / prevMonth.Income) * 100).toFixed(1)
      : null;

    const expenseChange = prevMonth.Expense > 0
      ? (((currentMonth.Expense - prevMonth.Expense) / prevMonth.Expense) * 100).toFixed(1)
      : null;

    res.json({
      success: true,
      chartData,
      currentMonth: {
        totalIncome: currentMonth.Income,
        totalExpense: currentMonth.Expense,
        netSavings: currentMonth.Income - currentMonth.Expense,
      },
      percentageChanges: {
        income: incomeChange,
        expense: expenseChange,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDashboardSummary };
