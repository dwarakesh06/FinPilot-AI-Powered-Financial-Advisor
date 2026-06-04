import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { 
  User, 
  Coins, 
  Database, 
  HelpCircle, 
  Sparkles, 
  ShieldCheck, 
  Loader,
  CheckCircle2
} from 'lucide-react';

const Settings = () => {
  const { user, updateSettings } = useAuth();
  
  const [currency, setCurrency] = useState(user?.currency || 'USD');
  const [updatingCurrency, setUpdatingCurrency] = useState(false);
  const [currencyMsg, setCurrencyMsg] = useState('');

  const handleCurrencySubmit = async (e) => {
    e.preventDefault();
    setUpdatingCurrency(true);
    setCurrencyMsg('');

    try {
      await updateSettings(currency);
      setCurrencyMsg('Display currency preference updated successfully!');
      setTimeout(() => setCurrencyMsg(''), 3000);
    } catch (err) {
      setCurrencyMsg(`Update Failed: ${err.message}`);
    } finally {
      setUpdatingCurrency(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">Client Settings & Console</h2>
        <p className="text-[11px] text-slate-500 font-semibold mt-0.5 font-sans">Configure system currency preferences and manage profile states</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Profile Card (Left) */}
        <div className="md:col-span-1 rounded-2xl border border-slate-800/60 bg-slate-900/40 p-6 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <h3 className="text-xs font-extrabold tracking-widest text-slate-500 uppercase">User Account Profile</h3>
            
            <div className="flex flex-col items-center py-4 space-y-3">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-tr from-cyan-500 to-indigo-500 text-lg font-black text-white glow-cyan/15">
                {user?.name?.slice(0, 2).toUpperCase() || 'US'}
              </div>
              <div className="text-center">
                <h4 className="text-sm font-extrabold text-white">{user?.name || 'User'}</h4>
                <p className="text-[10px] text-slate-500 font-bold tracking-wider mt-0.5">{user?.email}</p>
              </div>
            </div>

            <div className="space-y-2 border-t border-slate-800/60 pt-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              <div className="flex justify-between"><span>Account ID:</span><span className="text-slate-300 font-mono select-all">#{user?.id?.slice(-8)}</span></div>
              <div className="flex justify-between"><span>Authority:</span><span className="text-cyan-400">Authenticated Client</span></div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 rounded-xl bg-slate-950 p-2 text-[10px] text-slate-500 font-semibold border border-slate-850 justify-center">
            <ShieldCheck className="h-4 w-4 text-emerald-400" /> Authorized Safe JWT Session
          </div>
        </div>

        {/* Configurations Panel (Right) */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Currency preferences Form */}
          <div className="rounded-2xl border border-slate-800/60 bg-slate-900/40 p-6">
            <h3 className="text-xs font-extrabold tracking-widest text-slate-500 uppercase mb-4">Currency Configuration</h3>
            
            <form onSubmit={handleCurrencySubmit} className="space-y-4">
              <div className="max-w-md space-y-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-0.5">Select Preferred Currency</label>
                <div className="relative">
                  <Coins className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-500" />
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-800 bg-slate-950 text-xs font-bold text-slate-200 focus:outline-none appearance-none cursor-pointer"
                  >
                    <option value="USD">USD ($ - US Dollar)</option>
                    <option value="EUR">EUR (€ - Euro)</option>
                    <option value="GBP">GBP (£ - British Pound)</option>
                    <option value="INR">INR (₹ - Indian Rupee)</option>
                    <option value="CAD">CAD ($ - Canadian Dollar)</option>
                  </select>
                </div>
              </div>

              {currencyMsg && (
                <p className={`text-[10px] font-extrabold uppercase ${
                  currencyMsg.includes('updated') ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {currencyMsg}
                </p>
              )}

              <button
                type="submit"
                disabled={updatingCurrency}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 hover:brightness-110 text-slate-950 font-black px-6 py-3 text-xs uppercase tracking-wider transition-all"
              >
                {updatingCurrency ? <Loader className="h-4 w-4 animate-spin" /> : 'Save Preferences'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
