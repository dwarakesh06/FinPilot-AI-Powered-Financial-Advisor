import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { formatCurrency, formatDate } from '../utils/formatters';
import { 
  TrendingUp, 
  TrendingDown, 
  PiggyBank, 
  Sparkles,
  ArrowRight,
  BrainCircuit,
  CalendarDays,
  Database,
  CalendarClock,
  Loader,
  AlertTriangle
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [insight, setInsight] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [goals, setGoals] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);

  // Selected month YYYY-MM
  const currentMonthStr = new Date().toISOString().slice(0, 7);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch data in parallel
      const [txsRes, insightRes, forecastRes, goalsRes, remindersRes, budgetsRes, summaryRes] = await Promise.all([
        api.get('/api/transactions?limit=5'),
        api.get(`/api/insights?month=${currentMonthStr}`),
        api.get('/api/insights/forecast'),
        api.get('/api/goals'),
        api.get('/api/reminders'),
        api.get('/api/budgets/summary'),
        api.get('/api/dashboard/summary')
      ]);

      if (txsRes.data.success) setTransactions(txsRes.data.transactions);
      if (insightRes.data.success) setInsight(insightRes.data.insight);
      if (forecastRes.data.success) setForecast(forecastRes.data.forecast);
      if (goalsRes.data.success) setGoals(goalsRes.data.goals.slice(0, 3)); // Grab first 3
      if (remindersRes.data.success) setReminders(remindersRes.data.reminders);
      if (budgetsRes.data.success) setBudgets(budgetsRes.data.summary);
      if (summaryRes.data.success) setDashboardData(summaryRes.data);

    } catch (error) {
      console.error('Error fetching dashboard datasets:', error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader className="h-10 w-10 animate-spin text-cyan-500" />
      </div>
    );
  }

  // Calculate high-level financial figures for the current month from dashboard API
  const totalIncome = dashboardData?.currentMonth?.totalIncome || 0;
  const totalExpense = dashboardData?.currentMonth?.totalExpense || 0;
  const totalSavings = dashboardData?.currentMonth?.netSavings || 0;
  const savingsRate = insight ? insight.savingsRate : (totalIncome > 0 ? (totalSavings / totalIncome) * 100 : 0);

  // Month over Month chart data from backend
  const momChartData = dashboardData?.chartData || [];

  // Prepare Pie Chart data from budgets summary
  const pieColors = ['#06b6d4', '#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];
  const pieData = budgets
    .filter(b => b.spent > 0)
    .map((b, idx) => ({
      name: b.category,
      value: b.spent,
      color: pieColors[idx % pieColors.length]
    }));

  // Identify due bills warnings
  const activeAlerts = reminders.filter(
    r => !r.isPaid && new Date(r.dueDate) <= new Date(new Date().setDate(new Date().getDate() + 5))
  );

  // Financial Health Score visual configurations
  const healthScore = insight ? insight.healthScore : 0;
  let healthText = 'Needs Data';
  let healthDesc = 'Record transactions to view score details!';
  let healthStroke = '#64748b'; // Gray

  if (transactions.length > 0) {
    if (healthScore >= 85) {
      healthText = 'Excellent';
      healthDesc = 'Strong savings rate and strict budget limits control!';
      healthStroke = '#10b981'; // Green
    } else if (healthScore >= 70) {
      healthText = 'Good';
      healthDesc = 'Solvent finances. Adjust overruns to boost score.';
      healthStroke = '#06b6d4'; // Cyan
    } else if (healthScore >= 50) {
      healthText = 'Fair';
      healthDesc = 'Some budget leakage is draining savings capacity.';
      healthStroke = '#f59e0b'; // Amber
    } else {
      healthText = 'Critical';
      healthDesc = 'High spending ratio. Comprehensive audit advised!';
      healthStroke = '#ef4444'; // Red
    }
  }

  // Radial progressions
  const strokeDashoffset = 339.29 - (339.29 * healthScore) / 100;

  return (
    <div className="space-y-6">
      {/* 2. HIGH-LEVEL SCORE & STATS MATRIX */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Financial Health Score Circle Gauge */}
        <div className="rounded-2xl border border-slate-800/60 bg-slate-900/40 p-6 flex flex-col items-center justify-center text-center">
          <h3 className="text-xs font-bold tracking-widest text-slate-500 uppercase mb-4">Financial Health Score</h3>
          
          <div className="relative h-32 w-32 mb-4 flex items-center justify-center">
            {/* SVG circle meter */}
            <svg className="absolute inset-0 h-full w-full radial-progress-circle">
              <circle
                className="text-slate-800"
                strokeWidth="10"
                stroke="currentColor"
                fill="transparent"
                r="54"
                cx="64"
                cy="64"
              />
              <circle
                strokeWidth="10"
                strokeDasharray="339.29"
                strokeDashoffset={transactions.length > 0 ? strokeDashoffset : 339.29}
                strokeLinecap="round"
                stroke={healthStroke}
                fill="transparent"
                r="54"
                cx="64"
                cy="64"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="flex flex-col items-center">
              <span className="text-3xl font-extrabold text-white tracking-tight">{transactions.length > 0 ? healthScore : '--'}</span>
              <span className="text-[10px] font-bold text-slate-500">OUT OF 100</span>
            </div>
          </div>

          <span className="inline-flex items-center gap-1 text-sm font-bold uppercase tracking-wider mb-1" style={{ color: healthStroke }}>
            <Sparkles className="h-3.5 w-3.5" /> {healthText}
          </span>
          <p className="text-[11px] text-slate-400 font-semibold max-w-xs">{healthDesc}</p>
        </div>

        {/* 3 Core Pillar Statistics */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Income card */}
          <div className="rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5 space-y-3">
            <div className="flex justify-between items-start">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">Monthly Income</p>
                <h4 className="text-xl sm:text-2xl font-extrabold text-white mt-1 truncate" title={formatCurrency(totalIncome, user?.currency, false, true)}>
                  {formatCurrency(totalIncome, user?.currency)}
                </h4>
              </div>
              <div className="rounded-xl bg-emerald-500/10 p-2.5 text-emerald-400 shrink-0 ml-2">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
            <div className="text-[11px] text-slate-500 font-semibold">
              <span className={dashboardData?.percentageChanges?.income >= 0 ? "text-emerald-400" : "text-rose-400"}>
                {dashboardData?.percentageChanges?.income !== null ? `${dashboardData.percentageChanges.income > 0 ? '+' : ''}${dashboardData.percentageChanges.income}%` : 'N/A'}
              </span> vs prior month
            </div>
          </div>

          {/* Expenses card */}
          <div className="rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5 space-y-3">
            <div className="flex justify-between items-start">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">Monthly Expenses</p>
                <h4 className="text-xl sm:text-2xl font-extrabold text-white mt-1 truncate" title={formatCurrency(totalExpense, user?.currency, false, true)}>
                  {formatCurrency(totalExpense, user?.currency)}
                </h4>
              </div>
              <div className="rounded-xl bg-rose-500/10 p-2.5 text-rose-400 shrink-0 ml-2">
                <TrendingDown className="h-5 w-5" />
              </div>
            </div>
            <div className="text-[11px] text-slate-500 font-semibold">
              <span className={dashboardData?.percentageChanges?.expense > 0 ? "text-rose-400" : "text-emerald-400"}>
                {dashboardData?.percentageChanges?.expense !== null ? `${dashboardData.percentageChanges.expense > 0 ? '+' : ''}${dashboardData.percentageChanges.expense}%` : 'N/A'}
              </span> vs prior month
            </div>
          </div>

          {/* Savings card */}
          <div className="rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5 space-y-3">
            <div className="flex justify-between items-start">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">Net Savings</p>
                <h4 className="text-xl sm:text-2xl font-extrabold mt-1 text-white truncate" title={formatCurrency(totalSavings, user?.currency, false, true)}>
                  {formatCurrency(totalSavings, user?.currency)}
                </h4>
              </div>
              <div className="rounded-xl bg-indigo-500/10 p-2.5 text-indigo-400 shrink-0 ml-2">
                <PiggyBank className="h-5 w-5" />
              </div>
            </div>
            <div className="text-[11px] text-slate-500 font-semibold">
              Current Month Savings Rate: <span className="text-cyan-400 font-extrabold">{savingsRate.toFixed(1)}%</span>
            </div>
          </div>

          {/* Overdue notifications warning */}
          <div className="rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5 flex flex-col justify-center">
            {activeAlerts.length > 0 ? (
              <div className="flex gap-3">
                <div className="rounded-xl bg-rose-500/10 p-2.5 text-rose-400 self-start animate-bounce">
                  <CalendarClock className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-rose-400">Urgent: {activeAlerts.length} Bills Alert!</h4>
                  <p className="text-[11px] text-slate-400 font-semibold">
                    You have active bills due within 3 days or overdue. Check the Reminders panel to mark paid!
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex gap-3 text-slate-500">
                <div className="rounded-xl bg-slate-800 p-2.5">
                  <CalendarDays className="h-5 w-5 text-slate-400" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-slate-300">All Scheduled Bills Safe</h4>
                  <p className="text-[11px] text-slate-500 font-semibold">
                    No outstanding reminders are due within the immediate 5-day cycle window.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. CHARTS PANEL MoM VS PIE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Month over Month Chart (Left/Center) */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-800/60 bg-slate-900/40 p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-xs font-extrabold tracking-widest text-slate-500 uppercase">Cash Flow Trends</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Month-over-month comparison of earnings vs spending</p>
            </div>
            <span className="text-[10px] font-bold text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/40 uppercase">
              Historical Graph
            </span>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            {transactions.length === 0 ? (
              <div className="text-center text-xs text-slate-500 py-12">
                No cash flow trends available. Create transactions to unlock historical analytics graphs!
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={momChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorInc" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.3} />
                  <XAxis dataKey="name" stroke="#475569" fontSize={10} fontWeight="bold" />
                  <YAxis stroke="#475569" fontSize={10} fontWeight="bold" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }}
                    labelStyle={{ color: '#94a3b8', fontWeight: 'bold', fontSize: '11px' }}
                    itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', paddingTop: '10px' }} />
                  <Area type="monotone" dataKey="Income" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorInc)" name="Total Income" />
                  <Area type="monotone" dataKey="Expense" stroke="#ef4444" strokeWidth={2.5} fillOpacity={1} fill="url(#colorExp)" name="Total Expenses" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Category Expense Pie Chart (Right) */}
        <div className="rounded-2xl border border-slate-800/60 bg-slate-900/40 p-6 flex flex-col">
          <h3 className="text-xs font-extrabold tracking-widest text-slate-500 uppercase mb-4">Expenses Category Split</h3>
          
          <div className="flex-1 h-56 flex items-center justify-center">
            {pieData.length === 0 ? (
              <div className="text-center text-xs text-slate-500 py-6">
                No monthly expenditures tagged to categories.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }}
                    itemStyle={{ fontSize: '11px', fontWeight: 'bold', color: '#fff' }}
                    formatter={(val) => [formatCurrency(val, user?.currency), 'Spent']}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          
          {/* Custom Legends list */}
          <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
            {pieData.map((item) => (
              <div key={item.name} className="flex justify-between items-center text-[10px] font-bold">
                <div className="flex items-center gap-2 text-slate-400">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span>{item.name}</span>
                </div>
                <span className="text-slate-200">{formatCurrency(item.value, user?.currency)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. EXPENSE PREDICTION & AI ADVISOR RECOMMENDATION WIDGET */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Forecast Card Widget */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-800/60 bg-gradient-to-tr from-slate-900/60 to-indigo-950/20 p-6 flex flex-col justify-between">
          <div className="space-y-3">
            <h3 className="text-xs font-extrabold tracking-widest text-slate-500 uppercase flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-cyan-400" /> Statistical Spending Forecasts
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-3">
              <div className="rounded-xl bg-slate-950 p-4 border border-slate-800/50">
                <p className="text-[10px] font-bold text-slate-500 uppercase">Predicted Next Month Spendings</p>
                <h4 className="text-xl font-black text-slate-200 mt-1">
                  {forecast && forecast.predictedTotal > 0 
                    ? formatCurrency(forecast.predictedTotal, user?.currency)
                    : formatCurrency(0, user?.currency)}
                </h4>
                <p className="text-[9px] text-slate-500 mt-1 font-semibold">
                  Adjusted Exponential Moving Average projection
                </p>
              </div>

              <div className="rounded-xl bg-slate-950 p-4 border border-slate-800/50">
                <p className="text-[10px] font-bold text-slate-500 uppercase">Next Month Savings Capacity</p>
                <h4 className="text-xl font-black text-cyan-400 mt-1">
                  {forecast && forecast.predictedSavingsPotential > 0
                    ? formatCurrency(forecast.predictedSavingsPotential, user?.currency)
                    : formatCurrency(0, user?.currency)}
                </h4>
                <p className="text-[9px] text-slate-500 mt-1 font-semibold">
                  Estimated buffer based on predicted cash flow
                </p>
              </div>
            </div>

            <div className="flex gap-2.5 rounded-xl border border-slate-800 bg-slate-950/60 p-3.5">
              <BrainCircuit className="h-5 w-5 text-cyan-400 shrink-0 mt-0.5" />
              <p className="text-xs text-slate-400 font-semibold leading-relaxed">
                {forecast ? forecast.message : 'Historical statistics are preparing. Add budget limits to trigger predictions.'}
              </p>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button 
              onClick={() => navigate('/insights')}
              className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
            >
              Analyze Category Predictions <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Savings Goals widget (Right) */}
        <div className="rounded-2xl border border-slate-800/60 bg-slate-900/40 p-6 space-y-4">
          <h3 className="text-xs font-extrabold tracking-widest text-slate-500 uppercase">Savings Target Milestones</h3>
          
          <div className="space-y-4 max-h-[220px] overflow-y-auto pr-1">
            {goals.length === 0 ? (
              <div className="text-center text-xs text-slate-500 py-6">
                No savings goals active. Add one to track milestones!
              </div>
            ) : (
              goals.map((goal) => {
                const percent = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
                
                return (
                  <div key={goal._id} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-300">{goal.title}</span>
                      <span className="text-slate-400">{percent}%</span>
                    </div>
                    
                    {/* Visual Progress Bar */}
                    <div className="w-full bg-slate-950 rounded-full h-2 border border-slate-800/60">
                      <div 
                        className={`h-full rounded-full bg-gradient-to-r ${
                          percent === 100 ? 'from-emerald-500 to-teal-500 shadow-md' : 'from-cyan-500 to-indigo-500'
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    
                    <div className="flex justify-between text-[10px] text-slate-500 font-semibold">
                      <span>Saved: {formatCurrency(goal.currentAmount, user?.currency, true)}</span>
                      <span>Target: {formatCurrency(goal.targetAmount, user?.currency, true)}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          
          <button 
            onClick={() => navigate('/goals')}
            className="w-full py-2.5 mt-2 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-950 text-xs font-bold text-slate-300 hover:text-white transition-colors"
          >
            Create New Savings Target
          </button>
        </div>
      </div>

      {/* 5. RECENT TRANSACTIONS TABLE */}
      <div className="rounded-2xl border border-slate-800/60 bg-slate-900/40 p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xs font-extrabold tracking-widest text-slate-500 uppercase">Recent Transactions</h3>
          <button 
            onClick={() => navigate('/transactions')}
            className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
          >
            All Ledger Records <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800/60 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                <th className="pb-3 pl-1">Date</th>
                <th className="pb-3">Title / Payee</th>
                <th className="pb-3">Category</th>
                <th className="pb-3">Type</th>
                <th className="pb-3 text-right pr-1">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40 text-xs font-semibold">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-6 text-center text-slate-500">
                    No transaction entries recorded.
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx._id} className="hover:bg-slate-800/20 transition-colors">
                    <td className="py-3.5 pl-1 text-slate-400">{formatDate(tx.date)}</td>
                    <td className="py-3.5 text-slate-200">{tx.title}</td>
                    <td className="py-3.5">
                      <span className="rounded bg-slate-850 px-2 py-1 text-[10px] font-bold text-slate-400">
                        {tx.category}
                      </span>
                    </td>
                    <td className="py-3.5">
                      <span className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase ${
                        tx.type === 'income' ? 'bg-emerald-950/40 text-emerald-400' : 'bg-rose-950/40 text-rose-400'
                      }`}>
                        {tx.type}
                      </span>
                    </td>
                    <td className={`py-3.5 text-right pr-1 font-bold ${
                      tx.type === 'income' ? 'text-emerald-400' : 'text-slate-200'
                    }`}>
                      {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount, user?.currency)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
