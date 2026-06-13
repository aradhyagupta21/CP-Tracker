import React, { useState } from 'react';
import { Shield, Activity, KeyRound, UserPlus, LogIn, AlertCircle, User, MapPin, GraduationCap } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = 'http://localhost:5000/api';

export default function AuthPage({ onAuthSuccess, connError, onRetryConnection, isCancelable, onCancel }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [location, setLocation] = useState('');
  const [college, setCollege] = useState('');
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
            fullName: fullName.trim(),
            location: location.trim(),
            college: college.trim()
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
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-6 relative overflow-hidden font-sans transition-colors duration-300">
      {/* Background Elements for Glassmorphic Glow */}
      <div className="glow-bg glow-bg-1"></div>
      <div className="glow-bg glow-bg-2"></div>
      <div className="glow-bg glow-bg-3"></div>

      <div className="w-full max-w-md space-y-6 z-10">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="relative inline-flex p-3 bg-brand-indigo text-white rounded-2xl text-blue-950 shadow-sm mb-2">
            <Shield className="w-8 h-8" />
            <Activity className="w-4 h-4 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" strokeWidth={4} />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-100 ">
            CP Pulse & AI Coach
          </h1>
          <p className="text-sm text-slate-500">Secure entry to competitive programming analytics.</p>
        </div>

        {/* Connection Error Banner */}
        {connError && (
          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex flex-col gap-2 text-amber-300 text-xs font-semibold">
            <p className="flex items-center gap-1.5"><AlertCircle className="w-4 h-4" /> Local Backend Express Server Offline</p>
            <button 
              onClick={onRetryConnection}
              className="py-1 bg-amber-500 text-blue-950 font-bold rounded-lg hover:opacity-90 transition"
            >
              Retry Connection
            </button>
          </div>
        )}

        {/* Auth Panel Card */}
        <div className="bg-[#110e1b] border border-slate-800/80 p-8 rounded-3xl border border-slate-800/80 shadow-sm space-y-6">
          {/* Tab Selector */}
          <div className="flex bg-dark-905 border border-slate-800/80 p-1.5 rounded-xl">
            <button
              onClick={() => { setIsLogin(true); setError(''); }}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${isLogin ? 'bg-brand-indigo text-white text-slate-100 shadow' : 'text-slate-500 hover:text-brand-indigo'}`}
            >
              <LogIn className="w-3.5 h-3.5" /> Sign In
            </button>
            <button
              onClick={() => { setIsLogin(false); setError(''); }}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${!isLogin ? 'bg-brand-indigo text-white text-slate-100 shadow' : 'text-slate-500 hover:text-brand-indigo'}`}
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
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. aradhya"
                className="w-full bg-[#110e1b] border border-slate-800/80 px-4 py-2.5 rounded-xl text-slate-100 outline-none focus:border-royal/20 text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Password</label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#110e1b] border border-slate-800/80 pl-10 pr-4 py-2.5 rounded-xl text-slate-100 outline-none focus:border-royal/20 text-sm"
                />
              </div>
            </div>

            {/* Profile fields on Signup */}
            {!isLogin && (
              <div className="space-y-3 pt-3 border-t border-slate-800/80">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Profile Information</p>
                <div className="grid grid-cols-1 gap-3">
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Full Name"
                      className="w-full bg-[#110e1b] border border-slate-800 px-4 pl-10 py-2.5 rounded-xl text-slate-100 outline-none focus:border-royal/20 text-xs"
                    />
                  </div>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Location (e.g. Lucknow, India)"
                      className="w-full bg-[#110e1b] border border-slate-800 px-4 pl-10 py-2.5 rounded-xl text-slate-100 outline-none focus:border-brand-indigo/20 text-xs"
                    />
                  </div>
                  <div className="relative">
                    <GraduationCap className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      value={college}
                      onChange={(e) => setCollege(e.target.value)}
                      placeholder="College / Organization"
                      className="w-full bg-[#110e1b] border border-slate-800 px-4 pl-10 py-2.5 rounded-xl text-slate-100 outline-none focus:border-royal/20 text-xs"
                    />
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-indigo text-white text-slate-100 py-3 rounded-xl font-bold transition hover:opacity-95 shadow-md shadow-brand-indigo/10 disabled:opacity-50 mt-2 flex items-center justify-center gap-2"
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
          <div className="flex items-center gap-3 py-1 text-slate-400">
            <div className="h-px bg-slate-50 flex-1"></div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">or</span>
            <div className="h-px bg-slate-50 flex-1"></div>
          </div>

          {/* Google SSO Login */}
          <button
            onClick={handleGoogleMock}
            disabled={loading}
            className="w-full bg-slate-100 hover:bg-slate-50 border border-slate-800/80 text-slate-400 py-2.5 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2"
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
              className="w-full bg-slate-950 border border-slate-800/80 hover:border-slate-800/80 text-slate-500 hover:text-slate-350 py-2 rounded-xl text-xs font-semibold transition mt-3 flex items-center justify-center"
            >
              Cancel and Return
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
