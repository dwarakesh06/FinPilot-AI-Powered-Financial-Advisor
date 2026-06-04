import React, { useState, useEffect } from 'react';
import { Menu, Bell, User, CalendarClock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/formatters';
import api from '../utils/api';

const Navbar = ({ toggleSidebar }) => {
  const { user } = useAuth();
  const [reminders, setReminders] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Fetch reminders to calculate active alerts
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await api.get('/api/reminders');
        if (res.data.success) {
          // Filter unpaid reminders due in <= 3 days
          const today = new Date();
          const threeDays = new Date();
          threeDays.setDate(today.getDate() + 3);

          const activeAlerts = res.data.reminders.filter(
            r => !r.isPaid && new Date(r.dueDate) <= threeDays
          );
          setReminders(activeAlerts);
        }
      } catch (err) {
        console.error('Failed to fetch reminders for notification count:', err.message);
      }
    };
    if (user) {
      fetchAlerts();
    }
  }, [user]);

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-800/40 bg-slate-900/80 px-6 backdrop-blur-md">
      {/* Mobile Toggle */}
      <button
        onClick={() => toggleSidebar(true)}
        className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white md:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Greeting / Date */}
      <div className="hidden sm:block">
        <h2 className="text-sm font-semibold text-white">
          Welcome back, <span className="text-cyan-400">{user?.name || 'User'}</span>
        </h2>
        <p className="text-[11px] font-medium text-slate-500">
          {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-4 ml-auto">
        {/* Currency preference Pill */}
        <div className="rounded-full bg-slate-800/80 px-3.5 py-1 text-xs font-bold tracking-wider text-slate-300 uppercase border border-slate-700/40">
          Currency: <span className="text-cyan-400">{user?.currency || 'USD'}</span>
        </div>

        {/* Notifications Icon with Alert Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <Bell className="h-5 w-5" />
            {reminders.length > 0 && (
              <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-slate-900 animate-pulse" />
            )}
          </button>

          {/* Notifications Dropdown Panel */}
          {showNotifications && (
            <div className="absolute right-0 mt-3.5 w-80 rounded-2xl border border-slate-800 bg-slate-900 p-4 shadow-xl glow-indigo z-50">
              <h3 className="mb-3 text-xs font-bold tracking-widest text-slate-400 uppercase flex items-center gap-2">
                <CalendarClock className="h-4 w-4 text-cyan-400" /> Bill Reminders
              </h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {reminders.length === 0 ? (
                  <p className="text-xs text-slate-500 py-2 text-center">No urgent upcoming or overdue bills.</p>
                ) : (
                  reminders.map((rem) => {
                    const diff = Math.ceil((new Date(rem.dueDate) - new Date()) / (1000 * 60 * 60 * 24));
                    const isOverdue = diff < 0;

                    return (
                      <div key={rem._id} className="rounded-xl bg-slate-950 p-3 border border-slate-800/50">
                        <div className="flex items-start justify-between">
                          <h4 className="text-xs font-bold text-slate-200">{rem.title}</h4>
                          <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded uppercase ${
                            isOverdue ? 'bg-rose-950/40 text-rose-400' : 'bg-amber-950/40 text-amber-400'
                          }`}>
                            {isOverdue ? 'Overdue' : 'Soon'}
                          </span>
                        </div>
                        <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-500">
                          <span>Amount: <b className="text-slate-300">{formatCurrency(rem.amount, user?.currency)}</b></span>
                          <span>{isOverdue ? `${Math.abs(diff)}d overdue` : `Due in ${diff}d`}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* User profile Pill */}
        <div className="flex items-center gap-2.5 rounded-full bg-slate-800/50 pl-2.5 pr-4 py-1.5 border border-slate-700/30">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-tr from-cyan-500 to-indigo-500 text-[11px] font-extrabold text-white">
            {user?.name?.slice(0, 2).toUpperCase() || 'US'}
          </div>
          <span className="hidden md:inline text-xs font-bold text-slate-300">{user?.name || 'User'}</span>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
