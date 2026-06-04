import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { formatCurrency, formatDate } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';
import { 
  Plus, 
  Trash2, 
  CheckCircle2, 
  X,
  Loader,
  CalendarDays,
  CalendarClock,
  HelpCircle,
  Coins
} from 'lucide-react';

const Reminders = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [reminders, setReminders] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    dueDate: new Date().toISOString().slice(0, 10),
    frequency: 'monthly',
  });

  const fetchReminders = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/reminders');
      if (res.data.success) {
        setReminders(res.data.reminders);
      }
    } catch (err) {
      console.error('Failed to load reminders:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReminders();
  }, []);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        amount: parseFloat(formData.amount),
        isPaid: false
      };

      const res = await api.post('/api/reminders', payload);
      if (res.data.success) {
        setShowAddModal(false);
        resetForm();
        fetchReminders();
      }
    } catch (err) {
      alert(err.message || 'Failed to create bill reminder');
    }
  };

  // Pay Reminder (Invokes endpoint and auto-advances date)
  const handlePayReminder = async (id) => {
    try {
      const res = await api.patch(`/api/reminders/${id}/pay`);
      if (res.data.success) {
        alert(res.data.message || 'Bill logged successfully!');
        fetchReminders();
      }
    } catch (err) {
      alert(err.message || 'Failed to pay bill');
    }
  };

  const handleDeleteReminder = async (id) => {
    if (!window.confirm('Are you absolute sure you want to remove this reminder?')) return;
    try {
      const res = await api.delete(`/api/reminders/${id}`);
      if (res.data.success) {
        fetchReminders();
      }
    } catch (err) {
      alert(err.message || 'Failed to remove reminder');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      amount: '',
      dueDate: new Date().toISOString().slice(0, 10),
      frequency: 'monthly',
    });
  };

  // Sort and filter reminders into Overdue, Upcoming, and Paid categories
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const overdueReminders = reminders.filter(
    (r) => !r.isPaid && new Date(r.dueDate) < today
  );
  
  const upcomingReminders = reminders.filter(
    (r) => !r.isPaid && new Date(r.dueDate) >= today
  );

  const paidReminders = reminders.filter((r) => r.isPaid);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Bill Reminders</h2>
          <p className="text-[11px] text-slate-500 font-semibold mt-0.5">Manage recurring subscriptions and fixed utility calendars</p>
        </div>

        <button
          onClick={() => { resetForm(); setShowAddModal(true); }}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 hover:brightness-110 text-slate-950 font-bold px-4.5 py-3 text-xs shadow-md glow-cyan/10"
        >
          <Plus className="h-4 w-4 text-slate-950" /> Add Bill Calendar
        </button>
      </div>

      {loading ? (
        <div className="flex h-60 items-center justify-center">
          <Loader className="h-8 w-8 animate-spin text-cyan-500" />
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* Overdue alerts - highlighted in high alarm red */}
          {overdueReminders.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-extrabold tracking-widest text-rose-400 uppercase flex items-center gap-2">
                <CalendarClock className="h-4.5 w-4.5 animate-pulse" /> Overdue Bill Reminders
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {overdueReminders.map((rem) => (
                  <div key={rem._id} className="rounded-2xl border border-rose-500/20 bg-rose-950/10 p-5 space-y-4 flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-0 inset-x-0 h-1 bg-rose-500" />
                    
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-start">
                        <h4 className="text-sm font-bold text-rose-200">{rem.title}</h4>
                        <button
                          onClick={() => handleDeleteReminder(rem._id)}
                          className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-850 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="text-[10px] text-rose-400 font-extrabold uppercase tracking-widest flex items-center gap-1.5">
                        Overdue: Due {formatDate(rem.dueDate)}
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-2">
                      <div className="text-lg font-black text-rose-300">{formatCurrency(rem.amount, user?.currency)}</div>
                      <button
                        onClick={() => handlePayReminder(rem._id)}
                        className="inline-flex items-center gap-1 rounded-lg bg-rose-900/40 hover:bg-rose-900 text-rose-400 hover:text-white border border-rose-800/30 px-3 py-1.5 text-xs font-bold transition-all"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" /> Pay Bill
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upcoming Bills section */}
          <div className="space-y-3">
            <h3 className="text-xs font-extrabold tracking-widest text-slate-500 uppercase flex items-center gap-2">
              <CalendarDays className="h-4.5 w-4.5 text-cyan-500" /> Active Upcoming Bill Reminders
            </h3>

            {upcomingReminders.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-800 p-8 text-center text-xs text-slate-500">
                No upcoming scheduled bills active. Set custom reminders above!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {upcomingReminders.map((rem) => {
                  const diff = Math.ceil((new Date(rem.dueDate) - today) / (1000 * 60 * 60 * 24));
                  const isUrgent = diff <= 3;

                  return (
                    <div key={rem._id} className={`
                      rounded-2xl border bg-slate-900/40 p-5 space-y-4 flex flex-col justify-between relative overflow-hidden transition-colors
                      ${isUrgent ? 'border-amber-500/30 shadow-sm shadow-amber-950/20' : 'border-slate-800/60'}
                    `}>
                      {isUrgent && <div className="absolute top-0 inset-x-0 h-1 bg-amber-500" />}

                      <div className="space-y-1.5">
                        <div className="flex justify-between items-start">
                          <h4 className="text-sm font-bold text-slate-200">{rem.title}</h4>
                          <button
                            onClick={() => handleDeleteReminder(rem._id)}
                            className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-850 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <div className={`text-[10px] font-extrabold uppercase tracking-widest ${
                          isUrgent ? 'text-amber-400 animate-pulse' : 'text-slate-500'
                        }`}>
                          Due: {formatDate(rem.dueDate)} ({diff === 0 ? 'Due Today' : `in ${diff} days`})
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-2">
                        <div className="text-lg font-black text-slate-200">{formatCurrency(rem.amount, user?.currency)}</div>
                        <button
                          onClick={() => handlePayReminder(rem._id)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-950 px-3.5 py-1.5 text-[11px] font-bold text-slate-300 hover:text-white transition-colors"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400" /> Pay Bill
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Paid / Completed one-time bills */}
          {paidReminders.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-extrabold tracking-widest text-slate-500 uppercase">Paid / Inactive One-Time Bills</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {paidReminders.map((rem) => (
                  <div key={rem._id} className="rounded-2xl border border-slate-850 bg-slate-900/10 p-5 space-y-4 flex flex-col justify-between opacity-60">
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-start">
                        <h4 className="text-sm font-bold text-slate-400 line-through">{rem.title}</h4>
                        <button
                          onClick={() => handleDeleteReminder(rem._id)}
                          className="p-1 rounded-lg text-slate-600 hover:text-rose-400 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="text-[10px] text-emerald-400 font-extrabold uppercase tracking-widest flex items-center gap-1">
                        Completed Payment
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="text-base font-bold text-slate-500">{formatCurrency(rem.amount, user?.currency)}</div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                        One-Time Bill
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* ADD BILL REMINDER MODAL */}
      {/* ======================================================== */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-sm font-extrabold uppercase tracking-widest text-slate-200">
                Configure Bill Reminder
              </h3>
              <button 
                onClick={() => { setShowAddModal(false); resetForm(); }}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 pl-0.5">Bill Title</label>
                <input
                  type="text"
                  required
                  placeholder="Netflix, Landlord Lease Rent, Electric Power..."
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 pl-0.5">Amount Due ({user?.currency || 'USD'})</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="120.00"
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-xs text-slate-200 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 pl-0.5">Frequency Cycle</label>
                  <select
                    value={formData.frequency}
                    onChange={(e) => setFormData(prev => ({ ...prev, frequency: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-xs text-slate-200 focus:outline-none appearance-none cursor-pointer"
                  >
                    <option value="once">One-Time Only</option>
                    <option value="weekly">Weekly Cycle</option>
                    <option value="monthly">Monthly Cycle</option>
                    <option value="yearly">Yearly Cycle</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 pl-0.5">Due Date Calendar</label>
                <input
                  type="date"
                  required
                  value={formData.dueDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-xs text-slate-200 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 text-xs font-bold text-white shadow-md glow-cyan/15 hover:brightness-110 transition-all uppercase tracking-wider mt-2"
              >
                Register Bill Reminder
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reminders;
