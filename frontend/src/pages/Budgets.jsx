import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { formatCurrency } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';
import { 
  Plus, 
  Trash2, 
  AlertTriangle, 
  PiggyBank, 
  ChevronLeft, 
  ChevronRight, 
  X,
  Loader,
  TrendingUp,
  Sparkles
} from 'lucide-react';

const Budgets = () => {
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [budgetsSummary, setBudgetsSummary] = useState([]);
  const [showUpsertModal, setShowUpsertModal] = useState(false);

  // Month selector (defaults to current month YYYY-MM)
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));

  const [formData, setFormData] = useState({
    category: 'Food & Dining',
    amount: '',
    month: month,
  });

  const categories = [
    'Salary',
    'Food & Dining',
    'Groceries',
    'Housing & Utilities',
    'Transportation',
    'Entertainment & Subscriptions',
    'Shopping',
    'Healthcare',
    'Miscellaneous'
  ];

  const fetchBudgetsSummary = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/budgets/summary?month=${month}`);
      if (res.data.success) {
        setBudgetsSummary(res.data.summary);
      }
    } catch (err) {
      console.error('Failed to load budgets summary:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgetsSummary();
    setFormData(prev => ({ ...prev, month: month }));
  }, [month]);

  const handleUpsertSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        amount: parseFloat(formData.amount)
      };

      const res = await api.post('/api/budgets', payload);
      if (res.data.success) {
        setShowUpsertModal(false);
        setFormData(prev => ({ ...prev, amount: '' }));
        fetchBudgetsSummary();
      }
    } catch (err) {
      alert(err.message || 'Failed to register budget limit');
    }
  };

  const handleDeleteBudget = async (id) => {
    if (!id) return;
    if (!window.confirm('Delete this budget limit allocation?')) return;
    try {
      const res = await api.delete(`/api/budgets/${id}`);
      if (res.data.success) {
        fetchBudgetsSummary();
      }
    } catch (err) {
      alert(err.message || 'Failed to remove budget');
    }
  };

  // Adjust month navigation
  const handlePrevMonth = () => {
    const d = new Date(month + '-02');
    d.setMonth(d.getMonth() - 1);
    setMonth(d.toISOString().slice(0, 7));
  };

  const handleNextMonth = () => {
    const d = new Date(month + '-02');
    d.setMonth(d.getMonth() + 1);
    setMonth(d.toISOString().slice(0, 7));
  };

  return (
    <div className="space-y-6">
      {/* Header with Month Selector */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Category Budgets</h2>
          <p className="text-[11px] text-slate-500 font-semibold mt-0.5">Control expenditures by establishing monthly category budget caps</p>
        </div>

        {/* Month Pagination Control */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-bold">
            <button onClick={handlePrevMonth} className="p-1 text-slate-400 hover:text-white transition-colors cursor-pointer">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-slate-200 uppercase min-w-[75px] text-center">
              {new Date(month + '-02').toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
            </span>
            <button onClick={handleNextMonth} className="p-1 text-slate-400 hover:text-white transition-colors cursor-pointer">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <button
            onClick={() => setShowUpsertModal(true)}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 hover:brightness-110 text-slate-950 font-bold px-4.5 py-3 text-xs shadow-md glow-cyan/10"
          >
            <Plus className="h-4 w-4 text-slate-950" /> Configure Cap
          </button>
        </div>
      </div>

      {/* Main Budgets Performance layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full flex h-60 items-center justify-center">
            <Loader className="h-8 w-8 animate-spin text-cyan-500" />
          </div>
        ) : budgetsSummary.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-dashed border-slate-800 p-12 text-center">
            <PiggyBank className="h-10 w-10 text-slate-600 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-300">No active budgets set for this month</h3>
            <p className="text-[10px] text-slate-500 mt-1 font-semibold max-w-sm mx-auto">
              Setting custom caps helps you cut discretionary spends and improve your financial health score!
            </p>
            <button
              onClick={() => setShowUpsertModal(true)}
              className="mt-4 inline-flex items-center gap-1 text-[11px] font-bold text-cyan-400 hover:text-cyan-300 uppercase tracking-wider"
            >
              Configure Your First Cap <ChevronRight className="h-3 w-3" />
            </button>
          </div>
        ) : (
          (() => {
            const activeBudgets = budgetsSummary.filter(item => item.limit > 0);
            if (activeBudgets.length === 0) {
              return (
                <div className="col-span-full rounded-2xl border border-dashed border-slate-800 p-12 text-center">
                  <PiggyBank className="h-10 w-10 text-slate-600 mx-auto mb-3" />
                  <h3 className="text-sm font-bold text-slate-300">No active budgets set for this month</h3>
                  <p className="text-[10px] text-slate-500 mt-1 font-semibold max-w-sm mx-auto">
                    Setting custom caps helps you cut discretionary spends and improve your financial health score!
                  </p>
                  <button
                    onClick={() => setShowUpsertModal(true)}
                    className="mt-4 inline-flex items-center gap-1 text-[11px] font-bold text-cyan-400 hover:text-cyan-300 uppercase tracking-wider"
                  >
                    Configure Your First Cap <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
              );
            }

            return activeBudgets.map((item) => {
              const hasLimit = item.limit > 0;
              
              return (
                <div key={item.category} className={`
                  rounded-2xl border bg-slate-900/40 p-5 space-y-4 flex flex-col justify-between relative overflow-hidden transition-all duration-200
                  ${item.isOverLimit ? 'border-rose-500/30 shadow-md shadow-rose-950/20' : 'border-slate-800/60'}
                `}>
                  {item.isOverLimit && (
                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-rose-500 to-pink-500" />
                  )}

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-bold text-slate-200">{item.category}</h3>
                      {item.budgetId && (
                        <button
                          onClick={() => handleDeleteBudget(item.budgetId)}
                          className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-850 transition-colors cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 font-semibold">Monthly Category Cap Summary</p>
                  </div>

                  {/* Progress Ring / Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-end text-xs font-bold">
                      <span className="text-slate-400">Spent: {formatCurrency(item.spent, user?.currency)}</span>
                      <span className={item.isOverLimit ? "text-rose-400" : "text-slate-300"}>
                        {hasLimit ? formatCurrency(item.limit, user?.currency) : 'No Cap'}
                      </span>
                    </div>

                    <div className="w-full bg-slate-950 rounded-full h-2.5 border border-slate-800/60">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          item.isOverLimit ? 'bg-gradient-to-r from-rose-500 to-pink-500 shadow-md shadow-rose-500/20' : 'bg-gradient-to-r from-cyan-500 to-indigo-500'
                        }`}
                        style={{ width: `${hasLimit ? item.progressPercent : 0}%` }}
                      />
                    </div>

                    <div className="flex justify-between items-center text-[10px] font-bold">
                      {hasLimit ? (
                        item.isOverLimit ? (
                          <span className="text-rose-400 flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" /> Over budget by {formatCurrency(Math.abs(item.remaining), user?.currency)}
                          </span>
                        ) : (
                          <span className="text-emerald-400">
                            Remaining: {formatCurrency(item.remaining, user?.currency)}
                          </span>
                        )
                      ) : (
                        <span className="text-slate-500 flex items-center gap-0.5">
                          <TrendingUp className="h-3 w-3" /> Encourage adding custom caps
                        </span>
                      )}

                      {hasLimit && (
                        <span className={item.isOverLimit ? "text-rose-400" : "text-slate-400"}>
                          {item.progressPercent}% Spent
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            });
          })()
        )}
      </div>

      {/* ======================================================== */}
      {/* BUDGET UPSERT CONFIGURATION SLIDER MODAL */}
      {/* ======================================================== */}
      {showUpsertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-sm font-extrabold uppercase tracking-widest text-slate-200">
                Configure Budget Cap
              </h3>
              <button 
                onClick={() => { setShowUpsertModal(false); setFormData(prev => ({ ...prev, amount: '' })); }}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpsertSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 pl-0.5">Select Category Folder</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-xs text-slate-200 focus:outline-none appearance-none cursor-pointer"
                >
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 pl-0.5">Monthly Spend Limit ({user?.currency || 'USD'})</label>
                <input
                  type="number"
                  required
                  placeholder="600.00"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-xs text-slate-200 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 pl-0.5">Target Month</label>
                <input
                  type="month"
                  required
                  value={formData.month}
                  onChange={(e) => setFormData(prev => ({ ...prev, month: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-xs text-slate-200 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 text-xs font-bold text-white shadow-md glow-cyan/15 hover:brightness-110 transition-all uppercase tracking-wider mt-2"
              >
                Register Category Cap
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Budgets;
