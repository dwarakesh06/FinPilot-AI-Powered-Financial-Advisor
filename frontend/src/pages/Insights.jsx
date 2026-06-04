import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { formatCurrency } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';
import { 
  BrainCircuit, 
  Sparkles, 
  RotateCw, 
  CheckCircle2, 
  AlertCircle, 
  TrendingUp, 
  HelpCircle,
  Loader,
  Lightbulb,
  Cpu,
  ShieldCheck,
  TrendingDown,
  Layers
} from 'lucide-react';

const Insights = () => {
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [insight, setInsight] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [engine, setEngine] = useState('');

  const currentMonthStr = new Date().toISOString().slice(0, 7);

  const fetchInsightsData = async (forceRefresh = false) => {
    try {
      if (forceRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const insightUrl = `/api/insights?month=${currentMonthStr}${forceRefresh ? '&refresh=true' : ''}`;
      const [insightRes, forecastRes] = await Promise.all([
        api.get(insightUrl),
        api.get('/api/insights/forecast')
      ]);

      if (insightRes.data.success) {
        setInsight(insightRes.data.insight);
        setEngine(insightRes.data.engine || 'Cached Engine');
      }

      if (forecastRes.data.success) {
        setForecast(forecastRes.data.forecast);
      }

    } catch (err) {
      console.error('Failed to load insights datasets:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchInsightsData();
  }, []);

  const handleManualRefresh = () => {
    fetchInsightsData(true);
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader className="h-10 w-10 animate-spin text-cyan-500" />
      </div>
    );
  }

  const healthScore = insight ? insight.healthScore : 0;
  
  // Health score rating status definitions
  let scoreColor = 'text-slate-500';
  let scoreBg = 'bg-slate-950';
  let scoreBorder = 'border-slate-800';
  let scoreText = 'No Data';
  let ratingExplanation = 'Please record income and expense transactions to calculate financial scores!';

  if (insight) {
    if (healthScore >= 85) {
      scoreColor = 'text-emerald-400';
      scoreBg = 'bg-emerald-950/20';
      scoreBorder = 'border-emerald-900/30';
      scoreText = 'Excellent Standing';
      ratingExplanation = 'You maintain remarkable savings margins, high budget compliance, and exceptional month-over-month stability. Keep up the flawless work!';
    } else if (healthScore >= 70) {
      scoreColor = 'text-cyan-400';
      scoreBg = 'bg-cyan-950/20';
      scoreBorder = 'border-cyan-900/30';
      scoreText = 'Good Standing';
      ratingExplanation = 'Your financial habits are solid and highly solvent. Restricting minor budget excesses in entertainment or shopping could easily push you to excellent levels!';
    } else if (healthScore >= 50) {
      scoreColor = 'text-amber-400';
      scoreBg = 'bg-amber-950/20';
      scoreBorder = 'border-amber-900/30';
      scoreText = 'Fair Standing';
      ratingExplanation = 'Your savings rate is positive, but over-budget spending spikes are draining capital buffer. Establishing category budgets and adhering to them is highly recommended.';
    } else {
      scoreColor = 'text-rose-400';
      scoreBg = 'bg-rose-950/20';
      scoreBorder = 'border-rose-900/30';
      scoreText = 'Critical Standing';
      ratingExplanation = 'High expense ratios or monthly deficits are putting you at risk. We recommend immediately auditing fixed subscriptions and trimming dining out costs.';
    }
  }

  // Parse 5-component scores from backend
  const scoreBreakdown = insight?.scoreBreakdown || {
    savingsScore: 0,
    budgetScore: 0,
    consistencyScore: 0,
    emergencyScore: 0,
    goalScore: 0,
    debtScore: 0
  };

  const scoreComponents = [
    {
      name: 'Savings Performance',
      score: scoreBreakdown.savingsScore,
      weight: 25,
      desc: 'Efficiency of income converted to savings rate (Target: ≥25%)',
    },
    {
      name: 'Budget Discipline',
      score: scoreBreakdown.budgetScore,
      weight: 20,
      desc: 'Adherence to monthly category limits (Stay under 100%)',
    },
    {
      name: 'Spending Stability',
      score: scoreBreakdown.consistencyScore,
      weight: 15,
      desc: 'Volatility/variance of spending relative to your historical mean',
    },
    {
      name: 'Cash Flow Health',
      score: scoreBreakdown.emergencyScore,
      weight: 15,
      desc: 'Surplus cash remaining margin (Target: ≥30% of income)',
    },
    {
      name: 'Goal Achievement',
      score: scoreBreakdown.goalScore,
      weight: 15,
      desc: 'Milestone tracking progress across active savings goals',
    },
    {
      name: 'Debt Management',
      score: scoreBreakdown.debtScore,
      weight: 10,
      desc: 'Debt-to-Income ratio analysis based on liability spending',
    },
  ];

  // Helper to color component bars based on score
  const getComponentColors = (score) => {
    if (score >= 85) return { text: 'text-emerald-400', bar: 'bg-emerald-500', bg: 'bg-emerald-950/20' };
    if (score >= 70) return { text: 'text-cyan-400', bar: 'bg-cyan-500', bg: 'bg-cyan-950/20' };
    if (score >= 50) return { text: 'text-amber-400', bar: 'bg-amber-500', bg: 'bg-amber-950/20' };
    return { text: 'text-rose-400', bar: 'bg-rose-500', bg: 'bg-rose-950/20' };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">AI Wealth Advisor</h2>
          <p className="text-[11px] text-slate-500 font-semibold mt-0.5">Context-aware financial auditing, health metrics, and statistical forecasting</p>
        </div>

        <button
          onClick={handleManualRefresh}
          disabled={refreshing}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900 px-4.5 py-3 text-xs font-bold text-slate-300 hover:text-white transition-colors cursor-pointer disabled:opacity-50 shrink-0"
        >
          <RotateCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} /> 
          {refreshing ? 'Re-analyzing Dashboard...' : 'Refresh AI Analysis'}
        </button>
      </div>

      {/* Main Core Insights Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Health Score Summary Box (Left) */}
        <div className={`rounded-2xl border p-6 flex flex-col justify-between ${scoreBorder} ${scoreBg}`}>
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold text-slate-500 tracking-wider uppercase">Financial Score Profile</span>
              <span className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-widest ${scoreBg} ${scoreColor}`}>
                {scoreText}
              </span>
            </div>
            
            <div className="flex items-baseline gap-1.5">
              <h3 className={`text-6xl font-black ${scoreColor}`}>{insight ? healthScore : '--'}</h3>
              <span className="text-xs font-bold text-slate-500">/ 100</span>
            </div>

            <p className="text-xs text-slate-300 font-semibold leading-relaxed">
              {ratingExplanation}
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800/60 flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            <Cpu className="h-4 w-4 text-cyan-400" />
            <span>AI Model: <b className="text-slate-300">{engine || 'Local Rules Engine'}</b></span>
          </div>
        </div>

        {/* AI Qualitative Coaching Summary (Right/Center) */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-800/60 bg-slate-900/40 p-6 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-xs font-extrabold tracking-widest text-slate-500 uppercase flex items-center gap-2">
              <BrainCircuit className="h-4 w-4 text-cyan-400" /> AI Advisor Qualitative Coaching
            </h3>

            <div className="rounded-2xl bg-slate-950 p-5 border border-slate-850">
              {insight && insight.summary ? (
                <p className="text-xs text-slate-300 font-medium leading-relaxed">
                  {insight.summary}
                </p>
              ) : (
                <p className="text-xs text-slate-500 font-medium leading-relaxed py-3 text-center">
                  No transaction data loaded to generate custom statements yet. Add transactions to start!
                </p>
              )}
            </div>
          </div>

          {insight?.overspentCategories?.length > 0 && (
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-rose-950/20 border border-rose-900/30 p-3 text-[11px] text-rose-400 font-bold uppercase tracking-wider pl-4">
              <AlertCircle className="h-4 w-4" /> 
              <span>Flagged Overspent Folders: [ {insight.overspentCategories.join(', ')} ]</span>
            </div>
          )}
        </div>
      </div>

      {/* 5-Component Score Breakdown Display */}
      <div className="rounded-2xl border border-slate-800/60 bg-slate-900/40 p-6">
        <h3 className="text-xs font-extrabold tracking-widest text-slate-500 uppercase flex items-center gap-2 mb-6">
          <Layers className="h-4 w-4 text-cyan-400" /> Financial Score Breakdown (6-Component System)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {scoreComponents.map((comp) => {
            const colors = getComponentColors(comp.score);
            const contributionPoints = ((comp.score * comp.weight) / 100).toFixed(1);

            return (
              <div key={comp.name} className="rounded-2xl bg-slate-950 p-5 border border-slate-850 flex flex-col justify-between space-y-4 hover:border-slate-800 transition-colors">
                <div className="space-y-1">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">{comp.name}</span>
                    <span className="text-[9px] font-bold text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded">{comp.weight}% Weight</span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-snug">{comp.desc}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-baseline">
                    <span className={`text-2xl font-black ${colors.text}`}>{insight ? comp.score : '--'}</span>
                    <span className="text-[9px] text-slate-500 font-semibold">contrib: <b className="text-slate-300">+{insight ? contributionPoints : '--'} pts</b></span>
                  </div>

                  <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${colors.bar}`}
                      style={{ width: `${insight ? comp.score : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. TAILORED money-saving tips */}
      <div className="rounded-2xl border border-slate-800/60 bg-slate-900/40 p-6">
        <h3 className="text-xs font-extrabold tracking-widest text-slate-500 uppercase flex items-center gap-2 mb-6">
          <Lightbulb className="h-4 w-4 text-cyan-400" /> Personal Money-Saving Recommendations
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {!insight || !insight.suggestions || insight.suggestions.length === 0 ? (
            <div className="col-span-full py-6 text-center text-xs text-slate-500">
              No recommendations formulated yet. Populate transactions to calculate custom saving tips instantly!
            </div>
          ) : (
            insight.suggestions.slice(0, 3).map((tip, idx) => (
              <div key={idx} className="rounded-2xl bg-slate-950 p-5 border border-slate-850 flex gap-4 relative overflow-hidden group">
                <div className="absolute top-0 right-0 h-12 w-12 bg-gradient-to-br from-cyan-500/10 to-indigo-500/10 rounded-bl-full pointer-events-none" />
                
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-950 text-xs font-extrabold text-cyan-400 border border-cyan-900/30 shrink-0">
                  #{idx + 1}
                </div>
                
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-slate-200">Action Plan #{idx + 1}</h4>
                  <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">
                    {tip}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 3. DETAILED EXPENSE FORECASTING CATEGORIES SPLIT */}
      <div className="rounded-2xl border border-slate-800/60 bg-slate-900/40 p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xs font-extrabold tracking-widest text-slate-500 uppercase flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-cyan-400" /> Predictive Category Spend Models
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Statistical forecast of category spending for next month based on historical data</p>
          </div>
          <span className="text-[10px] font-bold text-cyan-400 bg-cyan-950/40 px-2.5 py-0.5 rounded border border-cyan-800/40 uppercase">
            AI Analytics Mode
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800/60 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                <th className="pb-3 pl-1">Category</th>
                <th className="pb-3 text-right">Historical Average Spend</th>
                <th className="pb-3 text-right">Predicted Next Month Spend</th>
                <th className="pb-3 text-center pr-1">Forecast Analysis</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40 text-xs font-semibold">
              {!forecast || !forecast.categoryForecasts || forecast.categoryForecasts.length === 0 ? (
                <tr>
                  <td colSpan="4" className="py-6 text-center text-slate-500">
                    No forecast history loaded. Add multi-month transactions to configure model metrics.
                  </td>
                </tr>
              ) : (
                forecast.categoryForecasts.map((cf) => {
                  const forecastedVal = cf.forecastedAmount;
                  
                  return (
                    <tr key={cf.category} className="hover:bg-slate-800/20 transition-colors">
                      <td className="py-3.5 pl-1 text-slate-200">{cf.category}</td>
                      <td className="py-3.5 text-right text-slate-400">
                        {formatCurrency(forecastedVal * 0.95, user?.currency)}
                      </td>
                      <td className="py-3.5 text-right font-black text-cyan-400">
                        {formatCurrency(forecastedVal, user?.currency)}
                      </td>
                      <td className="py-3.5 text-center pr-1">
                        <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-cyan-400 px-2 py-0.5 rounded bg-cyan-950/30 border border-cyan-900/30">
                          <CheckCircle2 className="h-3 w-3" /> Statistically Stable
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Insights;
