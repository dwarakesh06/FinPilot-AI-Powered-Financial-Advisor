const { calculateFinancialHealth } = require('../utils/ruleEngine');
const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const User = require('../models/User');
const Goal = require('../models/Goal');
const GoalContribution = require('../models/GoalContribution');

/**
 * Service to aggregate financial metrics and request advanced AI summaries or local fallbacks
 */
const generateFinancialInsights = async (userId, month) => {
  // 1. Gather User's profile details (for emergency fund settings)
  const user = await User.findById(userId);
  const emergencySavings = user ? (user.emergencySavings || 0) : 0;

  // 2. Gather all transactions for the specified month
  const startDate = new Date(`${month}-01T00:00:00.000Z`);
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + 1);

  const transactions = await Transaction.find({
    userId,
    date: { $gte: startDate, $lt: endDate },
  });

  // Calculate totals
  let income = 0;
  let expense = 0;
  const categoryExpenses = {};

  transactions.forEach((tx) => {
    if (tx.type === 'income') {
      income += tx.amount;
    } else {
      expense += tx.amount;
      if (!categoryExpenses[tx.category]) {
        categoryExpenses[tx.category] = 0;
      }
      categoryExpenses[tx.category] += tx.amount;
    }
  });

  // 3. Gather active budgets for this month
  const budgets = await Budget.find({ userId, month });

  // 4. Fetch historical expenses and incomes (last 3 months prior to this month) to assess consistency
  const historicalExpenses = [];
  const historicalIncomes = [];
  for (let i = 1; i <= 3; i++) {
    const histStart = new Date(startDate);
    histStart.setMonth(histStart.getMonth() - i);
    const histEnd = new Date(histStart);
    histEnd.setMonth(histEnd.getMonth() + 1);

    const histTxs = await Transaction.find({
      userId,
      type: 'expense',
      date: { $gte: histStart, $lt: histEnd },
    });
    
    const totalHistExp = histTxs.reduce((sum, tx) => sum + tx.amount, 0);
    if (totalHistExp > 0) {
      historicalExpenses.push(totalHistExp);
    }
    
    // Also fetch historical incomes for income consistency
    const histIncTxs = await Transaction.find({
      userId,
      type: 'income',
      date: { $gte: histStart, $lt: histEnd },
    });
    const totalHistInc = histIncTxs.reduce((sum, tx) => sum + tx.amount, 0);
    if (totalHistInc > 0) {
      historicalIncomes.push(totalHistInc);
    }
  }

  // 5. Fetch user savings goals and contributions
  const goals = await Goal.find({ userId });
  const contributions = await GoalContribution.find({ userId });

  // 6. Calculate exact, deterministic metrics using the local rule engine first
  const ruleResults = calculateFinancialHealth(
    income,
    expense,
    budgets,
    categoryExpenses,
    historicalExpenses,
    goals,
    emergencySavings,
    historicalIncomes
  );

  // 7. If OpenAI API Key is missing or invalid, immediately return the mathematical rule-based analysis
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.trim() === '') {
    return {
      month,
      ...ruleResults,
      income,
      expenses: expense,
      savings: income - expense,
      engine: 'Rule-Based Engine (Fallback)',
    };
  }

  // 8. Otherwise, use OpenAI to generate high-quality personalized coaching summary
  try {
    const prompt = `
You are FinPilot, a premium, analytical, and encouraging Certified Financial Planner (CFP) AI.
Analyze the user's financial dashboard statistics for ${month} across 9 dimensions, and generate high-value, actionable money coaching insights.

FACTUAL 9-DIMENSIONAL FINTECH ANALYTICS:
1. Total Income: $${income}
2. Total Expenses: $${expense}
3. Net Monthly Savings: $${income - expense}
4. Savings Rate: ${ruleResults.savingsRate}%
5. Budget Usage (Set Budgets vs Actual Category Expenditures):
   ${budgets.length > 0 ? budgets.map(b => `- ${b.category}: Limit $${b.amount}, Spent $${categoryExpenses[b.category] || 0}`).join('\n') : 'No category budgets configured.'}
6. Goal Progress & Achievements:
   ${goals.length > 0 ? goals.map(g => `- ${g.title}: Target $${g.targetAmount}, Current $${g.currentAmount} (Status: ${g.status})`).join('\n') : 'No active savings goals defined.'}
7. Spending Trends (Historical Average Expenses - prior months): $${historicalExpenses.length > 0 ? (historicalExpenses.reduce((a, b) => a+b, 0)/historicalExpenses.length).toFixed(0) : 'No history'}
8. Recurring/Top Expenses (Category spending):
   ${Object.entries(categoryExpenses).map(([cat, amt]) => `- ${cat}: $${amt}`).join('\n')}
9. Calculated Financial Health Score: ${ruleResults.healthScore}/100
   - Savings Performance Score (25% weight): ${ruleResults.scoreBreakdown.savingsScore}/100
   - Budget Discipline Score (20% weight): ${ruleResults.scoreBreakdown.budgetScore}/100
   - Spending Stability Score (15% weight): ${ruleResults.scoreBreakdown.consistencyScore}/100
   - Cash Flow Health Score (15% weight): ${ruleResults.scoreBreakdown.emergencyScore}/100
   - Goal Achievement Score (15% weight): ${ruleResults.scoreBreakdown.goalScore}/100
   - Debt Management Score (10% weight): ${ruleResults.scoreBreakdown.debtScore}/100

Emergency Savings Balance Set: $${emergencySavings}

INSTRUCTIONS:
1. Provide a comprehensive summary of their financial health this month (3-4 sentences). Critically analyze the 5 weighted score components (e.g. identify if savings rate, budget discipline, stability, cash flow, or goal progress is the weakest link).
2. Provide exactly 3-4 highly tailored, practical, step-by-step suggestions to cut spending, increase their health score, and grow savings.
3. Be professional, direct, encouraging, yet analytical. Use actual numbers in your suggestions.

You must respond in VALID JSON format with EXACTLY the following keys:
{
  "summary": "Your detailed coaching summary string here",
  "suggestions": ["Suggestion 1", "Suggestion 2", "Suggestion 3"]
}
Do not return any markdown code blocks (e.g. \`\`\`json), just raw JSON string.
`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo', // Or 'gpt-4o-mini'
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API responded with status ${response.status}`);
    }

    const data = await response.json();
    let resultText = data.choices[0].message.content.trim();
    
    // Parse result
    // Strip markdown formatting if the model still outputs them
    if (resultText.startsWith('```')) {
      resultText = resultText.replace(/^```json/, '').replace(/```$/, '').trim();
    }

    const aiParsed = JSON.parse(resultText);

    return {
      month,
      healthScore: ruleResults.healthScore,
      savingsRate: ruleResults.savingsRate,
      overspentCategories: ruleResults.overspentCategories,
      summary: aiParsed.summary || ruleResults.summary,
      suggestions: aiParsed.suggestions && aiParsed.suggestions.length > 0 ? aiParsed.suggestions : ruleResults.suggestions,
      scoreBreakdown: ruleResults.scoreBreakdown,
      income,
      expenses: expense,
      savings: income - expense,
      engine: 'OpenAI GPT-3.5 Engine',
    };

  } catch (error) {
    console.error('AI Insights Generation Error (Falling back to local rules):', error.message);
    return {
      month,
      healthScore: ruleResults.healthScore,
      savingsRate: ruleResults.savingsRate,
      overspentCategories: ruleResults.overspentCategories,
      summary: ruleResults.summary,
      suggestions: ruleResults.suggestions,
      scoreBreakdown: ruleResults.scoreBreakdown,
      income,
      expenses: expense,
      savings: income - expense,
      engine: 'Rule-Based Engine (Fallback due to OpenAI Error)',
    };
  }
};

module.exports = {
  generateFinancialInsights,
};
