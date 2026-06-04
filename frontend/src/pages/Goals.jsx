import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { formatCurrency, formatDate } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';
import { 
  Plus, 
  Trash2, 
  TrendingUp, 
  ChevronRight, 
  X,
  Loader,
  CalendarDays,
  Target,
  Trophy,
  AlertTriangle,
  Receipt,
  CircleDollarSign
} from 'lucide-react';

const Goals = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [goals, setGoals] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showContributionsModal, setShowContributionsModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);
  
  // Contributions details
  const [contributions, setContributions] = useState([]);
  const [loadingContributions, setLoadingContributions] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    targetAmount: '',
    currentAmount: '0',
    deadline: new Date(new Date().setMonth(new Date().getMonth() + 6)).toISOString().slice(0, 10), // default 6 months ahead
  });

  const [contributionForm, setContributionForm] = useState({
    amount: '',
    note: '',
    date: new Date().toISOString().slice(0, 10),
  });

  const fetchGoals = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/goals');
      if (res.data.success) {
        setGoals(res.data.goals);
      }
    } catch (err) {
      console.error('Failed to load goals:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchContributions = async (goalId) => {
    try {
      setLoadingContributions(true);
      const res = await api.get(`/api/goals/${goalId}/contributions`);
      if (res.data.success) {
        setContributions(res.data.contributions);
      }
    } catch (err) {
      console.error('Failed to load contributions:', err.message);
    } finally {
      setLoadingContributions(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        targetAmount: parseFloat(formData.targetAmount),
        currentAmount: parseFloat(formData.currentAmount)
      };

      const res = await api.post('/api/goals', payload);
      if (res.data.success) {
        setShowAddModal(false);
        resetForm();
        fetchGoals();
      }
    } catch (err) {
      alert(err.message || 'Failed to create savings goal');
    }
  };

  const handleGoalDetailsClick = (goal) => {
    setSelectedGoal(goal);
    setContributionForm({
      amount: '',
      note: '',
      date: new Date().toISOString().slice(0, 10),
    });
    fetchContributions(goal._id);
    setShowContributionsModal(true);
  };

  const handleContributionSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post(`/api/goals/${selectedGoal._id}/contributions`, {
        amount: parseFloat(contributionForm.amount),
        note: contributionForm.note,
        date: contributionForm.date,
      });

      if (res.data.success) {
        // Refresh contributions list
        fetchContributions(selectedGoal._id);
        // Reset adding form
        setContributionForm({
          amount: '',
          note: '',
          date: new Date().toISOString().slice(0, 10),
        });
        // Update the main selected goal card cache locally
        setSelectedGoal(res.data.goal);
        // Refresh main goals list
        fetchGoals();
      }
    } catch (err) {
      alert(err.message || 'Failed to record contribution');
    }
  };

  const handleDeleteGoal = async (id) => {
    if (!window.confirm('Are you absolutely sure you want to remove this savings goal? This will permanently delete its entire contribution ledger!')) return;
    try {
      const res = await api.delete(`/api/goals/${id}`);
      if (res.data.success) {
        fetchGoals();
      }
    } catch (err) {
      alert(err.message || 'Failed to remove goal');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      targetAmount: '',
      currentAmount: '0',
      deadline: new Date(new Date().setMonth(new Date().getMonth() + 6)).toISOString().slice(0, 10),
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Savings Goals</h2>
          <p className="text-[11px] text-slate-500 font-semibold mt-0.5">Establish cash milestones and track timelines to achieve them</p>
        </div>

        <button
          onClick={() => { resetForm(); setShowAddModal(true); }}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 hover:brightness-110 text-slate-950 font-bold px-4.5 py-3 text-xs shadow-md glow-cyan/10"
        >
          <Plus className="h-4 w-4 text-slate-950" /> Add Savings Target
        </button>
      </div>

      {/* Goals Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full flex h-60 items-center justify-center">
            <Loader className="h-8 w-8 animate-spin text-cyan-500" />
          </div>
        ) : goals.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-dashed border-slate-800 p-12 text-center">
            <Target className="h-10 w-10 text-slate-600 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-300">No savings targets created yet</h3>
            <p className="text-[10px] text-slate-500 mt-1 font-semibold max-w-sm mx-auto">
              Creating custom milestones helps you plan major purchases and grow your emergency safety reserves!
            </p>
          </div>
        ) : (
          goals.map((goal) => {
            const percent = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
            const isCompleted = goal.status === 'completed';
            const isExpired = goal.status === 'expired';

            // Visual layout parameters
            let borderStyle = 'border-slate-800/60';
            let badgeStyle = 'bg-cyan-950/40 text-cyan-400 border border-cyan-900/30';
            
            if (isCompleted) {
              borderStyle = 'border-emerald-500/30 shadow-md shadow-emerald-950/20';
              badgeStyle = 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/30';
            } else if (isExpired) {
              borderStyle = 'border-rose-500/30 shadow-md shadow-rose-950/20';
              badgeStyle = 'bg-rose-950/40 text-rose-400 border border-rose-900/30';
            }

            return (
              <div key={goal._id} className={`
                rounded-2xl border bg-slate-900/40 p-5 space-y-4 flex flex-col justify-between relative overflow-hidden transition-all duration-200
                ${borderStyle}
              `}>
                
                {isCompleted && (
                  <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
                )}
                {isExpired && (
                  <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-rose-500 to-orange-500" />
                )}

                <div className="space-y-1.5">
                  <div className="flex justify-between items-start">
                    <h3 className="text-sm font-bold text-slate-200">{goal.title}</h3>
                    
                    <button
                      onClick={() => handleDeleteGoal(goal._id)}
                      className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-850 transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[9px] font-black uppercase rounded-full px-2 py-0.5 ${badgeStyle}`}>
                      {goal.status}
                    </span>
                    {isCompleted && (
                      <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-0.5">
                        <Trophy className="h-3.5 w-3.5" /> Achieved!
                      </span>
                    )}
                    {isExpired && (
                      <span className="text-[10px] font-bold text-rose-400 flex items-center gap-0.5">
                        <AlertTriangle className="h-3.5 w-3.5" /> Expired deadline
                      </span>
                    )}
                  </div>
                </div>

                {/* Progress bars */}
                <div className="space-y-2">
                  <div className="flex justify-between items-end text-xs font-bold">
                    <span className="text-slate-400">Saved: {formatCurrency(goal.currentAmount, user?.currency)}</span>
                    <span className="text-slate-300">Target: {formatCurrency(goal.targetAmount, user?.currency)}</span>
                  </div>

                  <div className="w-full bg-slate-950 rounded-full h-2.5 border border-slate-800/60">
                    <div
                      className={`h-full rounded-full transition-all duration-500 bg-gradient-to-r ${
                        isCompleted 
                          ? 'from-emerald-500 to-teal-500 shadow-md shadow-emerald-500/20' 
                          : isExpired
                          ? 'from-rose-500 to-orange-500 shadow-md shadow-rose-500/20'
                          : 'from-cyan-500 to-indigo-500'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>

                  <div className="flex justify-between items-center text-[10px] font-bold">
                    <span className="text-slate-500 flex items-center gap-1">
                      <CalendarDays className="h-3.5 w-3.5" /> Target: {formatDate(goal.deadline)}
                    </span>
                    <span className="text-slate-300">{percent}% Achieved</span>
                  </div>
                </div>

                <button
                  onClick={() => handleGoalDetailsClick(goal)}
                  className="w-full py-2.5 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-950 text-xs font-bold text-slate-300 hover:text-white transition-colors uppercase tracking-wider cursor-pointer"
                >
                  Manage Ledger & Contributions
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* ======================================================== */}
      {/* 1. ADD SAVINGS GOAL MODAL */}
      {/* ======================================================== */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-sm font-extrabold uppercase tracking-widest text-slate-200">
                Configure Savings Goal
              </h3>
              <button 
                onClick={() => { setShowAddModal(false); resetForm(); }}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 pl-0.5">Goal Description Title</label>
                <input
                  type="text"
                  required
                  placeholder="Emergency Reserve, European Cruise Trip, New PC..."
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 pl-0.5">Target Cap ({user?.currency || 'USD'})</label>
                  <input
                    type="number"
                    required
                    placeholder="4000.00"
                    value={formData.targetAmount}
                    onChange={(e) => setFormData(prev => ({ ...prev, targetAmount: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 pl-0.5">Starting Saved Amount ({user?.currency || 'USD'})</label>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={formData.currentAmount}
                    onChange={(e) => setFormData(prev => ({ ...prev, currentAmount: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 pl-0.5">Deadline Timeline</label>
                <input
                  type="date"
                  required
                  value={formData.deadline}
                  onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 text-xs font-bold text-white shadow-md glow-cyan/15 hover:brightness-110 transition-all uppercase tracking-wider mt-2 cursor-pointer"
              >
                Register Savings Goal
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. EXPANDED CONTRIBUTION LEDGER & ACTION MODAL */}
      {/* ======================================================== */}
      {showContributionsModal && selectedGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4">
          <div className="w-full max-w-4xl rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150 flex flex-col md:flex-row gap-6">
            
            {/* Left side: Add Contribution Form */}
            <div className="w-full md:w-5/12 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-extrabold uppercase tracking-widest text-slate-200 flex items-center gap-1.5">
                  <CircleDollarSign className="h-4.5 w-4.5 text-cyan-400" /> Save Money
                </h3>
                <span className="text-[10px] font-bold text-slate-500 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                  {selectedGoal.status}
                </span>
              </div>

              <div className="bg-slate-950 rounded-xl p-4 border border-slate-850 space-y-2">
                <p className="text-[11px] font-extrabold text-slate-400 uppercase">Target Goal: {selectedGoal.title}</p>
                <div className="flex justify-between text-[11px] font-bold text-slate-500">
                  <span>Balance: <b>{formatCurrency(selectedGoal.currentAmount, user?.currency)}</b></span>
                  <span>Target: <b>{formatCurrency(selectedGoal.targetAmount, user?.currency)}</b></span>
                </div>
                <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-cyan-500 rounded-full" 
                    style={{ width: `${Math.min(100, (selectedGoal.currentAmount / selectedGoal.targetAmount) * 100)}%` }} 
                  />
                </div>
              </div>

              <form onSubmit={handleContributionSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 pl-0.5">Contribution Amount ({user?.currency || 'USD'})</label>
                  <input
                    type="number"
                    required
                    placeholder="250.00"
                    value={contributionForm.amount}
                    onChange={(e) => setContributionForm(prev => ({ ...prev, amount: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 pl-0.5">Contribution Date</label>
                  <input
                    type="date"
                    required
                    value={contributionForm.date}
                    onChange={(e) => setContributionForm(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 pl-0.5">Auditable Ledger Note</label>
                  <input
                    type="text"
                    placeholder="Salary transfer, spare change allocation..."
                    value={contributionForm.note}
                    onChange={(e) => setContributionForm(prev => ({ ...prev, note: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50"
                  />
                </div>

                <button
                  type="submit"
                  disabled={selectedGoal.status === 'completed'}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 text-xs font-bold text-white shadow-md glow-cyan/15 hover:brightness-110 transition-all uppercase tracking-wider cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {selectedGoal.status === 'completed' ? 'Goal Already Completed!' : 'Record Money Deposit'}
                </button>
              </form>
            </div>

            {/* Right side: Contribution History Ledger List */}
            <div className="w-full md:w-7/12 flex flex-col justify-between border-t md:border-t-0 md:border-l border-slate-800 pt-6 md:pt-0 md:pl-6">
              <div className="space-y-4 flex-grow flex flex-col">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-extrabold uppercase tracking-widest text-slate-200 flex items-center gap-1.5">
                    <Receipt className="h-4.5 w-4.5 text-cyan-400" /> Audit Ledger & History
                  </h3>
                  <button 
                    onClick={() => { setShowContributionsModal(false); setSelectedGoal(null); setContributions([]); }}
                    className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="flex-grow overflow-y-auto max-h-72 md:max-h-96 pr-1 space-y-2.5">
                  {loadingContributions ? (
                    <div className="flex h-40 items-center justify-center">
                      <Loader className="h-6 w-6 animate-spin text-cyan-500" />
                    </div>
                  ) : contributions.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-850 p-8 text-center bg-slate-950/40">
                      <p className="text-[10px] text-slate-500 font-bold uppercase">No contribution ledger entries found.</p>
                      <p className="text-[9px] text-slate-600 font-semibold mt-1">Make your first deposit contribution on the left side to establish audit trace!</p>
                    </div>
                  ) : (
                    contributions.map((c) => (
                      <div key={c._id} className="rounded-xl bg-slate-950 p-3 border border-slate-850 flex justify-between items-center hover:border-slate-800 transition-colors">
                        <div className="space-y-0.5">
                          <p className="text-xs font-bold text-slate-300">{c.note || 'Goal contribution deposit'}</p>
                          <p className="text-[9px] text-slate-500 font-semibold">{formatDate(c.date)}</p>
                        </div>
                        <span className="text-xs font-black text-emerald-400 font-mono">
                          +{formatCurrency(c.amount, user?.currency)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default Goals;
