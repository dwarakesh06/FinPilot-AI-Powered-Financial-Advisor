const Transaction = require('../models/Transaction');

/**
 * Service to predict next month's expenditures and savings capacity
 */
const generateForecast = async (userId) => {
  // Fetch all transactions for this user, sorted by date ascending
  const transactions = await Transaction.find({ userId }).sort({ date: 1 });

  if (transactions.length === 0) {
    return {
      predictedTotal: 0,
      predictedSavingsPotential: 0,
      categoryForecasts: [],
      message: 'No transaction history available to perform forecasting.',
      hasHistoricalData: false,
    };
  }

  // Group transactions by month (YYYY-MM)
  const monthlyData = {};
  transactions.forEach((tx) => {
    const month = tx.date.toISOString().slice(0, 7); // 'YYYY-MM'
    if (!monthlyData[month]) {
      monthlyData[month] = { income: 0, expense: 0, categories: {} };
    }

    if (tx.type === 'income') {
      monthlyData[month].income += tx.amount;
    } else {
      monthlyData[month].expense += tx.amount;
      if (!monthlyData[month].categories[tx.category]) {
        monthlyData[month].categories[tx.category] = 0;
      }
      monthlyData[month].categories[tx.category] += tx.amount;
    }
  });

  const months = Object.keys(monthlyData).sort();
  const numMonths = months.length;

  if (numMonths <= 1) {
    const currentMonth = months[0];
    const data = monthlyData[currentMonth];
    
    const categoryForecasts = Object.keys(data.categories).map((cat) => ({
      category: cat,
      forecastedAmount: Math.round(data.categories[cat] * 1.05 * 100) / 100, // 5% buffer projection
    }));

    return {
      predictedTotal: Math.round(data.expense * 1.03 * 100) / 100,
      predictedSavingsPotential: Math.max(0, Math.round((data.income - data.expense) * 100) / 100),
      categoryForecasts,
      message: 'Projections are based on your first month of financial data with standard multipliers.',
      hasHistoricalData: true,
    };
  }

  // Calculate Exponential Moving Average (EMA) with category-level seasonality
  const alpha = 0.5; // Heavier weight on recent months
  
  let emaExpense = monthlyData[months[0]].expense;
  let emaIncome = monthlyData[months[0]].income;

  for (let i = 1; i < numMonths; i++) {
    const exp = monthlyData[months[i]].expense;
    const inc = monthlyData[months[i]].income;
    emaExpense = exp * alpha + emaExpense * (1 - alpha);
    emaIncome = inc * alpha + emaIncome * (1 - alpha);
  }

  const allCategories = new Set();
  months.forEach((m) => {
    Object.keys(monthlyData[m].categories).forEach((c) => allCategories.add(c));
  });

  const categoryForecasts = [];
  let predictedTotal = 0;

  allCategories.forEach((cat) => {
    const history = months.map((m) => monthlyData[m].categories[cat] || 0);
    
    // Calculate category EMA
    let emaCat = history[0];
    for (let i = 1; i < numMonths; i++) {
      emaCat = history[i] * alpha + emaCat * (1 - alpha);
    }
    
    // Seasonal Trend Analysis: If the last month was significantly higher than the EMA,
    // apply a seasonal upward momentum weight, assuming a seasonal spike (e.g., Holidays)
    const lastMonthSpend = history[numMonths - 1];
    let seasonalWeight = 1.0;
    
    if (lastMonthSpend > 0 && emaCat > 0) {
      const spikeRatio = lastMonthSpend / emaCat;
      if (spikeRatio > 1.2) {
        // High spike detected, apply momentum weighting
        seasonalWeight = Math.min(1.3, spikeRatio * 0.8);
      } else if (spikeRatio < 0.8) {
        // Sudden drop detected
        seasonalWeight = Math.max(0.8, spikeRatio * 1.1);
      }
    }
    
    const forecastedAmount = Math.round(emaCat * seasonalWeight * 100) / 100;
    predictedTotal += forecastedAmount;
    
    if (forecastedAmount > 0) {
      categoryForecasts.push({
        category: cat,
        forecastedAmount,
      });
    }
  });

  // Predicted Income is smoothed
  const predictedIncome = Math.round(emaIncome * 100) / 100;
  const predictedSavingsPotential = Math.max(0, Math.round((predictedIncome - predictedTotal) * 100) / 100);

  // Growth Factor analysis for recommendations
  const firstHalfAvg = months.slice(0, Math.ceil(numMonths/2)).reduce((sum, m) => sum + monthlyData[m].expense, 0) / Math.ceil(numMonths/2);
  const secondHalfAvg = months.slice(Math.floor(numMonths/2)).reduce((sum, m) => sum + monthlyData[m].expense, 0) / Math.ceil(numMonths/2);
  const growthFactor = firstHalfAvg > 0 ? secondHalfAvg / firstHalfAvg : 1.0;

  let message = 'Your expense pattern shows steady control. Maintaining current patterns is recommended.';
  if (growthFactor > 1.08) {
    message = `Warning: Expenses are trending upwards by roughly ${Math.round((growthFactor - 1) * 100)}%. We recommend setting strict category budgets to control spending.`;
  } else if (growthFactor < 0.92) {
    message = `Excellent! Your monthly expenses are down by roughly ${Math.round((1 - growthFactor) * 100)}% compared to earlier months. You have room to allocate more to savings goals.`;
  }

  return {
    predictedTotal: Math.round(predictedTotal * 100) / 100,
    predictedSavingsPotential,
    categoryForecasts: categoryForecasts.sort((a, b) => b.forecastedAmount - a.forecastedAmount),
    message,
    hasHistoricalData: true,
  };
};

module.exports = {
  generateForecast,
};
