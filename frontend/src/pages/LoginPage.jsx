import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BrainCircuit, Mail, Lock, AlertCircle, Sparkles, Key } from 'lucide-react';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Demo autofill removed

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-6 py-12 relative overflow-hidden">
      {/* Decorative background blur blobs */}
      <div className="absolute top-1/4 left-1/4 h-[350px] w-[350px] rounded-full bg-cyan-500/5 blur-[90px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 h-[350px] w-[350px] rounded-full bg-indigo-500/5 blur-[90px] pointer-events-none" />

      {/* Brand Header */}
      <div className="flex items-center gap-3 mb-8 hover:scale-105 transition-transform">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-500 text-white shadow-md glow-cyan">
          <BrainCircuit className="h-6 w-6" />
        </div>
        <h1 className="font-extrabold tracking-tight text-white uppercase text-base">
          FinPilot
        </h1>
      </div>

      {/* Glassmorphic Form Card */}
      <div className="w-full max-w-md rounded-2xl border border-slate-800/80 bg-slate-900/40 p-8 shadow-2xl backdrop-blur-xl relative z-10">
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-white tracking-tight">Access Account</h2>
          <p className="text-[11px] text-slate-500 mt-1 font-semibold">Enter your credentials to login</p>
        </div>

        {/* Error Alert Box */}
        {error && (
          <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-rose-900/30 bg-rose-950/20 p-3 text-xs text-rose-400">
            <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 pl-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-800 bg-slate-950/80 text-sm text-slate-200 placeholder:text-slate-600 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 focus:outline-none transition-all duration-200"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 pl-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-800 bg-slate-950/80 text-sm text-slate-200 placeholder:text-slate-600 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 focus:outline-none transition-all duration-200"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 hover:scale-[1.01] hover:brightness-110 active:scale-95 text-sm font-bold text-white transition-all duration-150 shadow-md glow-cyan/10 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <>Sign In</>
            )}
          </button>
        </form>

        {/* Register Redirect Link */}
        <p className="mt-6 text-center text-xs text-slate-500 font-medium">
          Don't have an account?{' '}
          <Link to="/register" className="text-cyan-400 hover:underline font-bold pl-0.5">
            Register Here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
