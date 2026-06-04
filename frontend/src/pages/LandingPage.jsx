import React from 'react';
import { Link } from 'react-router-dom';
import { 
  BrainCircuit, 
  TrendingUp, 
  ShieldCheck, 
  FileSpreadsheet, 
  ArrowRight,
  Sparkles,
  ChevronRight,
  DollarSign
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const LandingPage = () => {
  const { user } = useAuth();

  const features = [
    {
      title: 'AI Financial Advisor',
      desc: 'Get highly personalized, context-aware money-saving advice and budget optimization recommendations from our intelligence engine.',
      icon: BrainCircuit,
      color: 'from-cyan-500 to-blue-500'
    },
    {
      title: 'Advanced Trend Forecasting',
      desc: 'Predict next month\'s expenditures and category cash flow trends using exponential moving averages and trend adjustments.',
      icon: TrendingUp,
      color: 'from-indigo-500 to-purple-500'
    },
    {
      title: 'Financial Health Score',
      desc: 'Evaluate your performance out of 100 based on savings ratios, budget overruns, debt metrics, and month-over-month stability.',
      icon: Sparkles,
      color: 'from-emerald-500 to-teal-500'
    },
    {
      title: 'Premium PDF & CSV Sheets',
      desc: 'Synthesize beautiful balance sheets, categories, and ledger entries with professional, print-ready PDF statements and raw CSV sheets.',
      icon: FileSpreadsheet,
      color: 'from-amber-500 to-orange-500'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col overflow-x-hidden relative">
      {/* Decorative background glows */}
      <div className="absolute top-[-10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-cyan-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-10%] h-[500px] w-[500px] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-900/80 bg-slate-950/75 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-500 text-white glow-cyan">
              <BrainCircuit className="h-6 w-6" />
            </div>
            <h1 className="font-extrabold tracking-tight text-white uppercase text-sm sm:text-base">
              FinPilot
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <Link 
              to={user ? "/dashboard" : "/login"}
              className="text-xs font-semibold text-slate-400 hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link 
              to={user ? "/dashboard" : "/register"}
              className="rounded-full bg-gradient-to-tr from-cyan-500 to-indigo-500 px-4 py-2 text-xs font-bold text-white shadow-md hover:scale-105 transition-transform duration-200"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-1 flex flex-col justify-center items-center px-6 py-20 text-center max-w-5xl mx-auto z-10">
        {/* Floating badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-950/30 px-4 py-1.5 text-xs font-semibold text-cyan-400 mb-8 animate-bounce">
          <Sparkles className="h-3.5 w-3.5" /> Next-Gen AI Financial Advisor
        </div>

        <h2 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-none bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent mb-6 max-w-4xl">
          Take Absolute Control of Your Capital with <span className="bg-gradient-to-r from-cyan-400 to-indigo-500 bg-clip-text">AI Guidance</span>
        </h2>

        <p className="text-sm sm:text-lg text-slate-400 max-w-2xl leading-relaxed mb-10">
          Track cash flow, configure category budgets, visualize financial health indicators, predict future spending trends, and receive personal money coaching summaries.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full max-w-md mb-16">
          <Link
            to={user ? "/dashboard" : "/register"}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-8 py-3.5 text-sm transition-all duration-200 shadow-lg shadow-cyan-500/20"
          >
            Launch Free Account <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Dynamic Graphic Mockup */}
        <div className="w-full rounded-2xl border border-slate-800/80 bg-slate-900/40 p-4 shadow-2xl glow-indigo relative group">
          <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/10 to-indigo-500/10 rounded-2xl opacity-50 blur-xl pointer-events-none" />
          <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950 p-6 flex flex-col md:flex-row gap-6 items-center justify-between text-left">
            <div className="space-y-4 max-w-md">
              <div className="h-7 w-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                <DollarSign className="h-4.5 w-4.5" />
              </div>
              <h3 className="text-lg font-bold text-white">Dynamic Asset Dashboard</h3>
              <p className="text-xs text-slate-400">
                Instantly visualize monthly balance sheets, savings rates, and upcoming bills. Review category progress bars and predictive graphs.
              </p>
              <div className="flex gap-4">
                <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded uppercase">+34% Savings</span>
                <span className="text-[11px] font-bold text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded uppercase">Health Score: 85</span>
              </div>
            </div>

            {/* Visual Mini Chart Graphic */}
            <div className="w-full md:w-80 rounded-xl bg-slate-900/80 border border-slate-800 p-4 space-y-3 shadow-inner">
              <div className="flex justify-between items-center text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                <span>Predicted Spending</span>
                <span className="text-cyan-400">Next Month</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-300">Food & Dining</span>
                  <span className="text-slate-200">$295.40</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-1.5">
                  <div className="bg-cyan-500 h-1.5 rounded-full" style={{ width: '70%' }} />
                </div>
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-300">Transportation</span>
                  <span className="text-slate-200">$85.20</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-1.5">
                  <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: '35%' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="bg-slate-900/40 border-t border-slate-900 px-6 py-24 z-10">
        <div className="mx-auto max-w-7xl">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h3 className="text-2xl sm:text-4xl font-extrabold text-white">
              Enterprise-Grade Financial Intelligence
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-3 leading-relaxed">
              Equipped with advanced mathematical calculators, statistical forecasting, and secure document exports, engineered to standard financial production specs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feat) => (
              <div key={feat.title} className="rounded-2xl border border-slate-800/60 bg-slate-900/40 p-6 hover:border-slate-700/60 transition-colors">
                <div className={`h-11 w-11 rounded-xl bg-gradient-to-tr ${feat.color} text-slate-950 flex items-center justify-center shadow-md mb-6`}>
                  <feat.icon className="h-5 w-5 text-white" />
                </div>
                <h4 className="text-sm font-bold text-white mb-2">{feat.title}</h4>
                <p className="text-[12px] text-slate-400 leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-12 px-6 bg-slate-950">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between text-slate-500 text-[11px] font-semibold gap-4">
          <div className="flex items-center gap-2">
            <BrainCircuit className="h-4 w-4 text-cyan-500" />
            <span>&copy; {new Date().getFullYear()} FinPilot. All rights reserved.</span>
          </div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition-colors">Security Policy</a>
            <a href="#" className="hover:text-white transition-colors">API References</a>
            <a href="#" className="hover:text-white transition-colors">System Status</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
