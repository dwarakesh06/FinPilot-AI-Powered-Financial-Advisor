import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Receipt, 
  PiggyBank, 
  TrendingUp, 
  BrainCircuit, 
  CalendarDays, 
  FileSpreadsheet, 
  Settings, 
  LogOut,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const { logout } = useAuth();

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Transactions', path: '/transactions', icon: Receipt },
    { name: 'Budgets', path: '/budgets', icon: PiggyBank },
    { name: 'Savings Goals', path: '/goals', icon: TrendingUp },
    { name: 'AI Advisor', path: '/insights', icon: BrainCircuit, premium: true },
    { name: 'Bill Reminders', path: '/reminders', icon: CalendarDays },
    { name: 'Reports', path: '/reports', icon: FileSpreadsheet },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Sidebar Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-950/80 md:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed top-0 bottom-0 left-0 z-50 flex w-64 flex-col border-r border-slate-800/60 bg-slate-900 px-4 py-6 transition-all duration-300
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Brand/Logo */}
        <div className="flex items-center gap-3 px-2 mb-8">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-500 text-white shadow-md glow-cyan">
            <BrainCircuit className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-sans text-sm font-extrabold tracking-tight text-white uppercase">
              FinPilot
            </h1>
            <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-1">
              <Sparkles className="h-2 w-2" /> AI Advisor
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-1.5 px-1 overflow-y-auto">
          {menuItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              onClick={() => toggleSidebar(false)}
              className={({ isActive }) => `
                group flex items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200
                ${isActive 
                  ? 'bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 text-cyan-400 border-l-2 border-cyan-400 shadow-sm' 
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border-l-2 border-transparent'}
              `}
            >
              <div className="flex items-center gap-3">
                <item.icon className="h-4.5 w-4.5 shrink-0 group-hover:scale-110 transition-transform" />
                <span>{item.name}</span>
              </div>
              {item.premium && (
                <span className="rounded bg-cyan-900/50 px-1.5 py-0.5 text-[9px] font-bold tracking-widest text-cyan-400 uppercase border border-cyan-800/40">
                  AI
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Logout Button */}
        <div className="mt-auto px-1">
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-xl border border-transparent px-4 py-3 text-sm font-semibold text-rose-400 hover:bg-rose-950/20 hover:border-rose-900/30 transition-all duration-200"
          >
            <LogOut className="h-4.5 w-4.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
