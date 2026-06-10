import React, { useState } from 'react';
import { Terminal, KeyRound, UserPlus, LogIn, AlertCircle, Sparkles } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = 'http://localhost:5000/api';

export default function AuthPage({ onAuthSuccess, connError, onRetryConnection, isCancelable, onCancel }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [cfHandle, setCfHandle] = useState('');
  const [ccHandle, setCcHandle] = useState('');
  const [lcHandle, setLcHandle] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Username and Password are required');
      return;
    }

    setLoading(true);
    try {
      const endpoint = isLogin ? 'login' : 'signup';
      const payload = isLogin 
        ? { username: username.trim(), password: password.trim() }
        : { 
            username: username.trim(), 
            password: password.trim(),
            codeforcesHandle: cfHandle.trim(),
            codechefHandle: ccHandle.trim(),
            leetcodeHandle: lcHandle.trim()
          };

      const res = await axios.post(`${BACKEND_URL}/users/${endpoint}`, payload);
      onAuthSuccess(res.data);
    } catch (err) {
      setError(err.response?.data?.error || `Authentication failed. Make sure the server is online.`);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleMock = async () => {
    setLoading(true);
    setError('');
    try {
      let res;
      try {
        // Attempt signup first
        res = await axios.post(`${BACKEND_URL}/users/signup`, {
          username: 'GoogleDeveloper',
          password: 'google_mock_password_123',
          codeforcesHandle: 'tourist',
          codechefHandle: 'genghis_khan',
          leetcodeHandle: 'neal_wu'
        });
      } catch (signupErr) {
        // If username is already taken, log in
        res = await axios.post(`${BACKEND_URL}/users/login`, {
          username: 'GoogleDeveloper',
          password: 'google_mock_password_123'
        });
      }
      onAuthSuccess(res.data);
    } catch (err) {
      setError('Google Mock Sign In failed to register on the backend server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-950 flex flex-col justify-center items-center p-6 relative overflow-hidden font-sans transition-colors duration-300">
      {/* Background Elements for Glassmorphic Glow */}
      <div className="glow-bg glow-bg-1"></div>
      <div className="glow-bg glow-bg-2"></div>
      <div className="glow-bg glow-bg-3"></div>

      <div className="w-full max-w-md space-y-6 z-10">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-gradient-to-tr from-brand-cyan to-brand-purple rounded-2xl text-dark-950 glow-indigo mb-2">
            <Terminal className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-brand-cyan via-brand-indigo to-brand-purple bg-clip-text text-transparent">
            CP Tracker & AI Coach
          </h1>
          <p className="text-sm text-slate-400">Secure entry to competitive programming analytics.</p>
        </div>

        {/* Connection Error Banner */}
        {connError && (
          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex flex-col gap-2 text-amber-300 text-xs font-semibold">
            <p className="flex items-center gap-1.5"><AlertCircle className="w-4 h-4" /> Local Backend Express Server Offline</p>
            <button 
              onClick={onRetryConnection}
              className="py-1 bg-amber-500 text-dark-950 font-bold rounded-lg hover:opacity-90 transition"
            >
              Retry Connection
            </button>
          </div>
        )}

        {/* Auth Panel Card */}
        <div className="glass-panel p-8 rounded-3xl border border-slate-700 glow-indigo space-y-6">
          {/* Tab Selector */}
          <div className="flex bg-dark-905 border border-slate-800 p-1.5 rounded-xl">
            <button
              onClick={() => { setIsLogin(true); setError(''); }}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${isLogin ? 'bg-gradient-to-r from-brand-indigo to-brand-purple text-slate-100 shadow' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <LogIn className="w-3.5 h-3.5" /> Sign In
            </button>
            <button
              onClick={() => { setIsLogin(false); setError(''); }}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${!isLogin ? 'bg-gradient-to-r from-brand-indigo to-brand-purple text-slate-100 shadow' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <UserPlus className="w-3.5 h-3.5" /> Sign Up
            </button>
          </div>

          {error && (
            <div className="p-3 bg-red-900/30 border border-red-500/40 rounded-xl text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. aradhya"
                className="w-full bg-dark-900/80 border border-slate-700 px-4 py-2.5 rounded-xl text-slate-100 outline-none focus:border-brand-indigo text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Password</label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-dark-900/80 border border-slate-700 pl-10 pr-4 py-2.5 rounded-xl text-slate-100 outline-none focus:border-brand-indigo text-sm"
                />
              </div>
            </div>

            {/* Custom handles settings on Signup */}
            {!isLogin && (
              <div className="space-y-3 pt-3 border-t border-slate-800/80">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Competitive Programming Handles (Optional)</p>
                <div className="grid grid-cols-1 gap-3">
                  <input
                    type="text"
                    value={cfHandle}
                    onChange={(e) => setCfHandle(e.target.value)}
                    placeholder="Codeforces Handle"
                    className="w-full bg-dark-900/40 border border-slate-850 px-4 py-2.5 rounded-xl text-slate-200 outline-none focus:border-brand-indigo text-xs"
                  />
                  <input
                    type="text"
                    value={ccHandle}
                    onChange={(e) => setCcHandle(e.target.value)}
                    placeholder="CodeChef Handle"
                    className="w-full bg-dark-900/40 border border-slate-850 px-4 py-2.5 rounded-xl text-slate-200 outline-none focus:border-brand-purple text-xs"
                  />
                  <input
                    type="text"
                    value={lcHandle}
                    onChange={(e) => setLcHandle(e.target.value)}
                    placeholder="LeetCode Handle"
                    className="w-full bg-dark-900/40 border border-slate-850 px-4 py-2.5 rounded-xl text-slate-200 outline-none focus:border-brand-cyan text-xs"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-brand-indigo to-brand-purple text-slate-100 py-3 rounded-xl font-bold transition hover:opacity-95 shadow-md shadow-brand-indigo/10 disabled:opacity-50 mt-2 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-slate-100 border-t-transparent animate-spin"></div>
                  <span>Authenticating...</span>
                </>
              ) : isLogin ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          {/* Social Separator */}
          <div className="flex items-center gap-3 py-1 text-slate-600">
            <div className="h-px bg-slate-800/80 flex-1"></div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">or</span>
            <div className="h-px bg-slate-800/80 flex-1"></div>
          </div>

          {/* Google SSO Login */}
          <button
            onClick={handleGoogleMock}
            disabled={loading}
            className="w-full bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 py-2.5 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path fill="#EA4335" d="M12 5.04c1.67 0 3.2.58 4.38 1.69l3.27-3.27C17.68 1.54 14.98 1 12 1 7.35 1 3.37 3.65 1.42 7.5l3.92 3.04C6.27 7.42 8.92 5.04 12 5.04z"/>
              <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.35H12v4.45h6.45c-.28 1.48-1.12 2.73-2.38 3.58l3.69 2.87c2.16-1.99 3.42-4.92 3.42-8.55z"/>
              <path fill="#FBBC05" d="M5.34 14.73C5.1 14.02 4.96 13.27 4.96 12.5s.14-1.52.38-2.23l-3.92-3.04C.5 8.94 0 10.66 0 12.5s.5 3.56 1.42 5.27l3.92-3.04z"/>
              <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.69-2.87c-1.02.69-2.33 1.1-4.27 1.1-3.08 0-5.73-2.38-6.66-5.5l-3.92 3.04C3.37 20.35 7.35 23 12 23z"/>
            </svg>
            <span>Continue with Google</span>
          </button>

          {isCancelable && (
            <button
              type="button"
              onClick={onCancel}
              className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-350 py-2 rounded-xl text-xs font-semibold transition mt-3 flex items-center justify-center"
            >
              Cancel and Return
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
