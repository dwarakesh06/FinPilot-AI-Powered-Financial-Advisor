/**
 * FinPilot Financial Health Score and Insights Rule Engine
 * 
 * Implements a production-grade 6-component scoring system (0-100 normalized):
 * 1. Savings Performance (25%) - Savings rate from transaction cashflow
 * 2. Budget Discipline (20%) - Adherence to monthly category limits
 * 3. Spending Stability (15%) - Variance-based consistency metric
 * 4. Cash Flow Health (15%) - Surplus cash remaining ratio & Income consistency
 * 5. Goal Achievement (15%) - Milestone tracker toward active savings goals
 * 6. Debt Management (10%) - Debt-to-Income impact tracking
 */

const calculateFinancialHealth = (
  income = 0,
  expense = 0,
  budgets = [],
  categoryExpenses = {},
  historicalExpenses = [],
  goals = [],
  emergencySavings = 0,
  historicalIncomes = [] // New addition for income consistency
) => {
  if (income === 0 && expense === 0) {
    return {
      healthScore: 0,
      savingsRate: 0,
      overspentCategories: [],
      summary: 'No financial activity recorded for this month.',
      suggestions: [
        'Set up monthly category budgets in the Budgets tab to design a target limit plan.',
        'Create a savings goal in the Goals tab to track your wealth milestones.'
      ],
      scoreBreakdown: {
        savingsScore: 0,
        budgetScore: 0,
        consistencyScore: 0,
        emergencyScore: 0,
        goalScore: 0,
        debtScore: 0
      }
    };
  }

  // Component Scores
  let savingsScore = 0;      
  let budgetScore = 0;       
  let consistencyScore = 0;  
  let emergencyScore = 0;    
  let goalScore = 0;         
  let debtScore = 100; // Default to perfect if no debt is found

  const suggestions = [];
  const overspentCategories = [];

  // 1. Savings Performance (Weight: 25%)
  const savings = income - expense;
  const savingsRate = income > 0 ? (savings / income) * 100 : 0;

  if (savingsRate >= 25) {
    savingsScore = 100;
  } else if (savingsRate > 0) {
    savingsScore = (savingsRate / 25) * 100;
  } else {
    savingsScore = 0;
  }

  if (savingsRate < 10) {
    suggestions.push('Your savings rate is below 10%. Try identifying non-essential expenses to allocate at least 20% to savings.');
  }

  // 2. Budget Discipline (Weight: 20%)
  if (budgets.length === 0) {
    budgetScore = 80;
    suggestions.push('No category budgets are set up yet. Establish monthly spending limits in the Budgets tab to improve discipline.');
  } else {
    let totalAdherence = 0;
    budgets.forEach(b => {
      const spent = categoryExpenses[b.category] || 0;
      if (spent <= b.amount) {
        totalAdherence += 100;
      } else {
        overspentCategories.push(b.category);
        const overrunRatio = (spent - b.amount) / b.amount;
        const catScore = Math.max(0, 100 - (overrunRatio * 100));
        totalAdherence += catScore;
      }
    });
    budgetScore = totalAdherence / budgets.length;

    if (overspentCategories.length > 0) {
      suggestions.push(`You exceeded your budget in: ${overspentCategories.join(', ')}. Review these categories to avoid leaks.`);
    }
  }

  // 3. Spending Stability (Weight: 15%)
  if (historicalExpenses.length > 0) {
    const expensesList = [...historicalExpenses, expense];
    const mean = expensesList.reduce((a, b) => a + b, 0) / expensesList.length;

    if (mean > 0) {
      const variance = expensesList.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / expensesList.length;
      const cv = Math.sqrt(variance) / mean;
      consistencyScore = Math.max(0, Math.min(100, 100 - ((cv - 0.10) / 0.50) * 100));
      if (cv > 0.40) {
        suggestions.push('Your monthly spending exhibits high volatility. Try smoothing out major non-essential outlays over time.');
      }
    } else {
      consistencyScore = 100;
    }
  } else {
    consistencyScore = 100;
  }

  // 4. Cash Flow & Income Consistency Health (Weight: 15%)
  const cashFlowRatio = income > 0 ? (savings / income) * 100 : 0;
  let baseEmergencyScore = 0;
  if (cashFlowRatio >= 30) {
    baseEmergencyScore = 100;
  } else if (cashFlowRatio > 0) {
    baseEmergencyScore = (cashFlowRatio / 30) * 100;
  }

  // Income Consistency Factor
  if (historicalIncomes && historicalIncomes.length > 0) {
    const incomesList = [...historicalIncomes, income];
    const meanInc = incomesList.reduce((a,b) => a+b, 0) / incomesList.length;
    if (meanInc > 0) {
      const incVariance = incomesList.reduce((a,b) => a + Math.pow(b - meanInc, 2), 0) / incomesList.length;
      const incCv = Math.sqrt(incVariance) / meanInc;
      // High income volatility penalizes emergency score (need bigger buffer)
      if (incCv > 0.20) {
        baseEmergencyScore = Math.max(0, baseEmergencyScore - (incCv * 50));
        suggestions.push('Your income varies significantly month-to-month. Build a larger emergency fund to buffer against low-income months.');
      }
    }
  }
  emergencyScore = baseEmergencyScore;

  if (cashFlowRatio < 10) {
    suggestions.push('Your remaining cash flow surplus is very narrow. Minimize credit usage and secure extra reserves.');
  }

  const emergencyTarget = expense * 3;
  if (emergencyTarget > 0 && emergencySavings < emergencyTarget) {
    suggestions.push(`Build up your emergency fund. Your current fund is ${Math.round((emergencySavings/emergencyTarget)*100)}% of the 3-month expense buffer target.`);
  }

  // 5. Goal Achievement (Weight: 15%)
  const activeGoals = goals.filter(g => g.status === 'active');
  if (activeGoals.length > 0) {
    let totalProgress = 0;
    activeGoals.forEach(g => {
      const progress = g.targetAmount > 0 ? (g.currentAmount / g.targetAmount) * 100 : 0;
      totalProgress += Math.min(100, Math.max(0, progress));
    });
    goalScore = totalProgress / activeGoals.length;

    const nearCompletion = activeGoals.filter(g => (g.currentAmount / g.targetAmount) >= 0.8 && (g.currentAmount / g.targetAmount) < 1);
    if (nearCompletion.length > 0) {
      suggestions.push(`You are close to completing your goal "${nearCompletion[0].title}". Keep contributing to cross the finish line!`);
    }
  } else {
    goalScore = 50; 
    suggestions.push('Establish a specific savings goal (e.g., emergency fund, major purchase) in the Goals page to drive motivation.');
  }

  // 6. Debt Management (Weight: 10%)
  // Calculate how much was spent on Debt or Loans
  const debtCategories = ['Debt', 'Loan', 'Credit Card', 'Mortgage', 'Repayment'];
  let totalDebtPayments = 0;
  Object.keys(categoryExpenses).forEach(cat => {
    if (debtCategories.some(d => cat.toLowerCase().includes(d.toLowerCase()))) {
      totalDebtPayments += categoryExpenses[cat];
    }
  });

  if (income > 0) {
    const debtToIncomeRatio = totalDebtPayments / income;
    if (debtToIncomeRatio > 0) {
      // Over 36% DTI is usually considered risky. 0% is 100 score, 36% drops score to 0.
      debtScore = Math.max(0, 100 - ((debtToIncomeRatio / 0.36) * 100));
      
      if (debtToIncomeRatio > 0.36) {
        suggestions.push(`Your debt-to-income ratio is high (${Math.round(debtToIncomeRatio*100)}%). Prioritize paying down high-interest debt aggressively.`);
      } else if (debtToIncomeRatio > 0.20) {
        suggestions.push(`Consider strategies to reduce your debt footprint. You are allocating ${Math.round(debtToIncomeRatio*100)}% of your income to debt.`);
      }
    }
  } else if (totalDebtPayments > 0) {
    debtScore = 0; // Debt with no income is critical
  }

  // Final Weighted Score
  const finalScore = 
    (savingsScore * 0.25) + 
    (budgetScore * 0.20) + 
    (consistencyScore * 0.15) + 
    (emergencyScore * 0.15) + 
    (goalScore * 0.15) + 
    (debtScore * 0.10);

  const healthScore = Math.round(Math.max(0, Math.min(100, finalScore)));

  let summary = '';
  if (healthScore >= 80) {
    summary = `Excellent financial status! A score of ${healthScore} indicates robust budget adherence, excellent saving margins, and disciplined goal progression.`;
  } else if (healthScore >= 60) {
    summary = `Healthy financial habits with minor vulnerabilities. Your score of ${healthScore} shows steady cash flow but indicates potential spending leaks or low saving margins.`;
  } else if (healthScore >= 40) {
    summary = `Moderate financial standing. A score of ${healthScore} suggests budget overruns or a narrow savings cushion. Implementing tighter spending boundaries is highly recommended.`;
  } else {
    summary = `Critical financial health check needed. Your score of ${healthScore} indicates severe budget overruns, negative saving rates, or lacking emergency reserves. Take quick corrective action.`;
  }

  return {
    healthScore,
    savingsRate: Math.round(savingsRate * 10) / 10,
    overspentCategories,
    summary,
    suggestions: [...new Set(suggestions)].slice(0, 5),
    scoreBreakdown: {
      savingsScore: Math.round(savingsScore),
      budgetScore: Math.round(budgetScore),
      consistencyScore: Math.round(consistencyScore),
      emergencyScore: Math.round(emergencyScore),
      goalScore: Math.round(goalScore),
      debtScore: Math.round(debtScore)
    }
  };
};

module.exports = {
  calculateFinancialHealth,
};
