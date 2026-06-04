import React from 'react';
import { Sparkles } from 'lucide-react';

const FinancialHealthScore = ({ transactions, healthScore, healthStroke, healthText, healthDesc }) => {
  const strokeDashoffset = 339.29 - (339.29 * healthScore) / 100;

  return (
    <div className="rounded-2xl border border-slate-800/60 bg-slate-900/40 p-6 flex flex-col items-center justify-center text-center">
      <h3 className="text-xs font-bold tracking-widest text-slate-500 uppercase mb-4">Financial Health Score</h3>
      
      <div className="relative h-32 w-32 mb-4 flex items-center justify-center">
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
  );
};

export default FinancialHealthScore;
