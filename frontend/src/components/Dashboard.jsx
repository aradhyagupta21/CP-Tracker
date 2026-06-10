import React, { useState } from 'react';
import { RefreshCw, UserCheck, Flame, BookOpen, Award, Target, Plus, ShieldCheck } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = 'http://localhost:5000/api';

export default function Dashboard({ currentUser, stats, goals, onSync, isLoading, allUsers, onUserSelect, onUserRegister, onUserUpdate }) {
  const [newUsername, setNewUsername] = useState('');
  const [cfHandle, setCfHandle] = useState('');
  const [ccHandle, setCcHandle] = useState('');
  const [lcHandle, setLcHandle] = useState('');
  const [showReg, setShowReg] = useState(false);
  const [error, setError] = useState('');

  // Editing state for active profiles handles
  const [showEditHandles, setShowEditHandles] = useState(false);
  const [editCfHandle, setEditCfHandle] = useState('');
  const [editCcHandle, setEditCcHandle] = useState('');
  const [editLcHandle, setEditLcHandle] = useState('');
  const [isSavingHandles, setIsSavingHandles] = useState(false);

  // States for simulated secure authentication linking
  const [activeLinkTab, setActiveLinkTab] = useState('quick'); // 'quick' or 'secure'
  const [securePlatform, setSecurePlatform] = useState('Codeforces');
  const [secureHandle, setSecureHandle] = useState('');
  const [securePassword, setSecurePassword] = useState('');
  const [isAuthing, setIsAuthing] = useState(false);
  const [authStep, setAuthStep] = useState('');



  // Calculate totals
  const totalSolved = stats.reduce((sum, s) => sum + (s.solvedCount || 0), 0);
  const cfRating = stats.find(s => s.platform === 'Codeforces')?.currentRating || 0;
  const ccRating = stats.find(s => s.platform === 'CodeChef')?.currentRating || 0;
  const lcSolved = stats.find(s => s.platform === 'LeetCode')?.solvedCount || 0;
  const lcRating = stats.find(s => s.platform === 'LeetCode')?.currentRating || 0;


  // Streak calculations (based on submissions list)
  const calculateStreak = () => {
    const dates = new Set();
    stats.forEach(s => {
      (s.recentSubmissions || []).forEach(sub => {
        if (sub.verdict === 'OK' || sub.verdict === 'Accepted') {
          const dateStr = new Date(sub.submittedAt).toDateString();
          dates.add(dateStr);
        }
      });
    });

    const sortedDates = Array.from(dates).map(d => new Date(d)).sort((a, b) => b - a);
    if (sortedDates.length === 0) return { current: 0, longest: 0 };

    let current = 0;
    let longest = 0;
    let temp = 0;
    
    // Check if coded today or yesterday
    const today = new Date();
    today.setHours(0,0,0,0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const firstDate = sortedDates[0];
    firstDate.setHours(0,0,0,0);

    const isCodingRecently = (firstDate.getTime() === today.getTime() || firstDate.getTime() === yesterday.getTime());
    
    if (isCodingRecently) {
      current = 1;
      let checkDate = new Date(firstDate);
      
      for (let i = 1; i < sortedDates.length; i++) {
        const nextDate = sortedDates[i];
        nextDate.setHours(0,0,0,0);
        
        const diffTime = Math.abs(checkDate - nextDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
          current++;
          checkDate = nextDate;
        } else if (diffDays > 1) {
          break; // Streak broken
        }
      }
    }

    // Longest streak
    let currentTemp = 0;
    let checkDateLong = null;
    
    const sortedDatesAsc = [...sortedDates].sort((a,b) => a - b);
    sortedDatesAsc.forEach(date => {
      date.setHours(0,0,0,0);
      if (!checkDateLong) {
        currentTemp = 1;
        checkDateLong = date;
      } else {
        const diffTime = Math.abs(date - checkDateLong);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          currentTemp++;
        } else if (diffDays > 1) {
          longest = Math.max(longest, currentTemp);
          currentTemp = 1;
        }
        checkDateLong = date;
      }
    });
    longest = Math.max(longest, currentTemp);

    return { current, longest: Math.max(longest, current) };
  };

  const streak = calculateStreak();

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!newUsername.trim()) {
      setError('Username is required');
      return;
    }
    try {
      const res = await axios.post(`${BACKEND_URL}/users/register`, {
        username: newUsername.trim(),
        codeforcesHandle: cfHandle.trim(),
        codechefHandle: ccHandle.trim(),
        leetcodeHandle: lcHandle.trim()
      });
      onUserRegister(res.data);
      setNewUsername('');
      setCfHandle('');
      setCcHandle('');
      setLcHandle('');
      setShowReg(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to register user');
    }
  };

  const handleStartEdit = () => {
    setEditCfHandle(currentUser?.codeforcesHandle || '');
    setEditCcHandle(currentUser?.codechefHandle || '');
    setEditLcHandle(currentUser?.leetcodeHandle || '');
    setError('');
    setShowEditHandles(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSavingHandles(true);
    try {
      const res = await axios.put(`${BACKEND_URL}/users/${currentUser._id}`, {
        codeforcesHandle: editCfHandle.trim(),
        codechefHandle: editCcHandle.trim(),
        leetcodeHandle: editLcHandle.trim()
      });
      onUserUpdate(res.data);
      setShowEditHandles(false);
      // Auto trigger stats update
      setTimeout(() => {
        onSync();
      }, 300);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update handles');
    } finally {
      setIsSavingHandles(false);
    }
  };

  const handleSecureSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!secureHandle.trim() || !securePassword.trim()) {
      setError('Username/Handle and Password are required for secure linkage.');
      return;
    }
    
    setIsAuthing(true);
    setAuthStep(`Connecting to ${securePlatform} secure gateway...`);
    
    // Step 2
    setTimeout(() => {
      setAuthStep('Bypassing verification CAPTCHA cloud shield...');
    }, 900);
    
    // Step 3
    setTimeout(() => {
      setAuthStep('Decrypting credentials & extracting platform authentication token...');
    }, 1800);
    
    // Step 4: Finalize
    setTimeout(async () => {
      try {
        const res = await axios.post(`${BACKEND_URL}/users/${currentUser._id}/credentials`, {
          platform: securePlatform,
          handle: secureHandle.trim(),
          password: securePassword.trim()
        });
        onUserUpdate(res.data);
        setIsAuthing(false);
        setAuthStep('');
        setShowEditHandles(false);
        setSecureHandle('');
        setSecurePassword('');
        // Trigger sync
        setTimeout(() => {
          onSync();
        }, 300);
      } catch (err) {
        setError(err.response?.data?.error || 'Simulated gateway handshake failed. Check your handles and credentials.');
        setIsAuthing(false);
        setAuthStep('');
      }
    }, 2800);
  };



  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Upper Navigation and User selection */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-brand-cyan via-brand-indigo to-brand-purple bg-clip-text text-transparent">
            Developer Dashboard
          </h1>
          <p className="text-slate-400 mt-1">
            Track and optimize your competitive programming handles.
          </p>
        </div>

        {/* User Selection Panel */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 glass-panel px-4 py-2 rounded-xl border border-slate-700">
            <UserCheck className="w-5 h-5 text-brand-cyan" />
            <select 
              value={currentUser?._id || ''} 
              onChange={(e) => onUserSelect(e.target.value)}
              className="bg-transparent text-slate-100 outline-none border-none cursor-pointer text-sm font-medium"
            >
              {allUsers.length === 0 ? (
                <option value="">No Users Registered</option>
              ) : (
                allUsers.map(u => (
                  <option key={u._id} value={u._id} className="bg-dark-900 text-slate-100">
                    {u.username}
                  </option>
                ))
              )}
            </select>
          </div>

          <button
            onClick={() => setShowReg(!showReg)}
            className="flex items-center gap-2 bg-gradient-to-r from-brand-indigo to-brand-purple hover:opacity-95 text-slate-100 px-4 py-2 rounded-xl text-sm font-semibold transition"
          >
            <Plus className="w-4 h-4" /> Add Profile
          </button>

          {currentUser && (
            <button
              onClick={handleStartEdit}
              className="flex items-center gap-2 bg-dark-900 border border-slate-700 hover:border-brand-purple hover:bg-brand-purple/10 text-slate-300 hover:text-slate-100 px-4 py-2 rounded-xl text-sm font-semibold transition"
            >
              Configure Handles
            </button>
          )}

          {currentUser && (
            <button
              onClick={onSync}
              disabled={isLoading}
              className={`flex items-center gap-2 glass-panel px-4 py-2 rounded-xl text-sm font-semibold text-brand-cyan border border-brand-cyan/20 transition-all duration-300 hover:bg-brand-cyan/10 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Syncing...' : 'Sync Profiles'}
            </button>
          )}
        </div>
      </div>

      {/* Profile register modal/form */}
      {showReg && (
        <form onSubmit={handleRegisterSubmit} className="glass-panel p-6 rounded-2xl border border-slate-700 max-w-xl mx-auto space-y-4 glow-indigo">
          <h2 className="text-xl font-bold text-slate-100">Register CP Profile</h2>
          {error && <div className="p-3 bg-red-900/30 border border-red-500/40 rounded-lg text-red-300 text-sm">{error}</div>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400">Username *</label>
              <input 
                type="text" 
                value={newUsername} 
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="e.g. aradhya"
                className="w-full bg-dark-900/80 border border-slate-700 px-3 py-2 rounded-lg text-slate-100 outline-none focus:border-brand-cyan"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400">Codeforces Handle</label>
              <input 
                type="text" 
                value={cfHandle} 
                onChange={(e) => setCfHandle(e.target.value)}
                placeholder="e.g. Tourist"
                className="w-full bg-dark-900/80 border border-slate-700 px-3 py-2 rounded-lg text-slate-100 outline-none focus:border-brand-cyan"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400">CodeChef Handle</label>
              <input 
                type="text" 
                value={ccHandle} 
                onChange={(e) => setCcHandle(e.target.value)}
                placeholder="e.g. genghis_khan"
                className="w-full bg-dark-900/80 border border-slate-700 px-3 py-2 rounded-lg text-slate-100 outline-none focus:border-brand-cyan"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400">LeetCode Handle</label>
              <input 
                type="text" 
                value={lcHandle} 
                onChange={(e) => setLcHandle(e.target.value)}
                placeholder="e.g. aradhya_1"
                className="w-full bg-dark-900/80 border border-slate-700 px-3 py-2 rounded-lg text-slate-100 outline-none focus:border-brand-cyan"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button 
              type="button" 
              onClick={() => setShowReg(false)}
              className="px-4 py-2 border border-slate-700 rounded-lg text-slate-400 text-sm hover:bg-dark-900 transition"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="px-4 py-2 bg-gradient-to-r from-brand-indigo to-brand-purple rounded-lg text-slate-100 text-sm font-semibold transition hover:opacity-95"
            >
              Create
            </button>
          </div>
        </form>
      )}

      {/* Edit handles modal/form */}
      {showEditHandles && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-700 max-w-xl mx-auto space-y-5 glow-purple">
          <div className="flex justify-between items-center pb-3 border-b border-slate-800">
            <h2 className="text-xl font-bold text-slate-100">Configure Platform Linking for {currentUser.username}</h2>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setActiveLinkTab('quick'); setError(''); }}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${activeLinkTab === 'quick' ? 'bg-brand-indigo/25 text-brand-indigo border border-brand-indigo/30' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Quick Handles
              </button>
              <button
                type="button"
                onClick={() => { setActiveLinkTab('secure'); setError(''); }}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${activeLinkTab === 'secure' ? 'bg-brand-purple/25 text-brand-purple border border-brand-purple/30' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Simulated Password Auth
              </button>
            </div>
          </div>

          {error && <div className="p-3 bg-red-900/30 border border-red-500/40 rounded-xl text-red-300 text-sm">{error}</div>}

          {activeLinkTab === 'quick' ? (
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Codeforces Handle</label>
                  <input 
                    type="text" 
                    value={editCfHandle} 
                    onChange={(e) => setEditCfHandle(e.target.value)}
                    placeholder="e.g. Tourist"
                    className="w-full bg-dark-900/80 border border-slate-700 px-3 py-2 rounded-lg text-slate-100 outline-none focus:border-brand-indigo"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">CodeChef Handle</label>
                  <input 
                    type="text" 
                    value={editCcHandle} 
                    onChange={(e) => setEditCcHandle(e.target.value)}
                    placeholder="e.g. genghis_khan"
                    className="w-full bg-dark-900/80 border border-slate-700 px-3 py-2 rounded-lg text-slate-100 outline-none focus:border-brand-purple"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">LeetCode Handle</label>
                  <input 
                    type="text" 
                    value={editLcHandle} 
                    onChange={(e) => setEditLcHandle(e.target.value)}
                    placeholder="e.g. aradhya_1"
                    className="w-full bg-dark-900/80 border border-slate-700 px-3 py-2 rounded-lg text-slate-100 outline-none focus:border-brand-cyan"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2 border-t border-slate-800/60">
                <button 
                  type="button" 
                  onClick={() => setShowEditHandles(false)}
                  className="px-4 py-2 border border-slate-700 rounded-lg text-slate-400 text-sm hover:bg-dark-900 transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSavingHandles}
                  className="px-4 py-2 bg-gradient-to-r from-brand-indigo to-brand-purple rounded-lg text-slate-100 text-sm font-semibold transition hover:opacity-95 disabled:opacity-50"
                >
                  {isSavingHandles ? 'Saving...' : 'Save Handles'}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSecureSubmit} className="space-y-4">
              {isAuthing ? (
                <div className="py-8 text-center space-y-4">
                  <div className="w-8 h-8 rounded-full border-4 border-brand-purple border-t-transparent animate-spin mx-auto"></div>
                  <p className="text-sm text-slate-300 font-semibold animate-pulse">{authStep}</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-400">Target Platform</label>
                      <select
                        value={securePlatform}
                        onChange={(e) => setSecurePlatform(e.target.value)}
                        className="w-full bg-dark-900 border border-slate-700 px-3 py-2 rounded-lg text-slate-100 outline-none focus:border-brand-purple"
                      >
                        <option value="Codeforces">Codeforces</option>
                        <option value="CodeChef">CodeChef</option>
                        <option value="LeetCode">LeetCode</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-400">Platform Username/Handle</label>
                      <input 
                        type="text" 
                        value={secureHandle} 
                        onChange={(e) => setSecureHandle(e.target.value)}
                        placeholder="Enter platform handle"
                        className="w-full bg-dark-900/80 border border-slate-700 px-3 py-2 rounded-lg text-slate-100 outline-none focus:border-brand-purple"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-400">Platform Password</label>
                      <input 
                        type="password" 
                        value={securePassword} 
                        onChange={(e) => setSecurePassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-dark-900/80 border border-slate-700 px-3 py-2 rounded-lg text-slate-100 outline-none focus:border-brand-purple"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 pt-2 border-t border-slate-800/60">
                    <button 
                      type="button" 
                      onClick={() => setShowEditHandles(false)}
                      className="px-4 py-2 border border-slate-700 rounded-lg text-slate-400 text-sm hover:bg-dark-900 transition"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="px-4 py-2 bg-gradient-to-r from-brand-purple to-brand-pink rounded-lg text-slate-100 text-sm font-semibold transition hover:opacity-95"
                    >
                      Authenticate & Link
                    </button>
                  </div>
                </>
              )}
            </form>
          )}
        </div>
      )}

      {currentUser ? (
        <>
          {/* Main Key Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="glass-panel glass-panel-hover p-6 rounded-2xl flex items-center gap-5 border border-slate-700 glow-indigo">
              <div className="p-3 bg-brand-cyan/10 rounded-xl text-brand-cyan">
                <BookOpen className="w-7 h-7" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Solved</p>
                <h3 className="text-3xl font-extrabold text-slate-100 mt-1">{totalSolved}</h3>
                <p className="text-xs text-brand-cyan mt-1 font-medium">Across platforms</p>
              </div>
            </div>

            <div className="glass-panel glass-panel-hover p-6 rounded-2xl border border-slate-700 glow-indigo flex flex-col justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-brand-indigo/10 rounded-xl text-brand-indigo shrink-0">
                  <Award className="w-6 h-6" />
                </div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Platform Ratings</p>
              </div>
              
              <div className="space-y-2 mt-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400 font-medium">Codeforces:</span>
                  <span className="text-sm font-extrabold text-brand-indigo">
                    {cfRating > 0 ? cfRating : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center border-t border-slate-800/60 pt-1.5">
                  <span className="text-xs text-slate-400 font-medium">CodeChef:</span>
                  <span className="text-sm font-extrabold text-brand-purple">
                    {ccRating > 0 ? `${ccRating} ★` : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center border-t border-slate-800/60 pt-1.5">
                  <span className="text-xs text-slate-400 font-medium">LeetCode:</span>
                  <span className="text-sm font-extrabold text-brand-cyan">
                    {lcRating > 0 ? lcRating : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            <div className="glass-panel glass-panel-hover p-6 rounded-2xl flex items-center gap-5 border border-slate-700">
              <div className="p-3 bg-brand-purple/10 rounded-xl text-brand-purple">
                <Flame className="w-7 h-7 animate-pulse" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Streak</p>
                <h3 className="text-3xl font-extrabold text-slate-100 mt-1">{streak.current} Days</h3>
                <p className="text-xs text-brand-purple mt-1 font-medium">Max Streak: {streak.longest} days</p>
              </div>
            </div>

            <div className="glass-panel glass-panel-hover p-6 rounded-2xl flex items-center gap-5 border border-slate-700">
              <div className="p-3 bg-brand-pink/10 rounded-xl text-brand-pink">
                <Target className="w-7 h-7" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Target Goals</p>
                <h3 className="text-3xl font-extrabold text-slate-100 mt-1">
                  {goals.length}
                </h3>
                <p className="text-xs text-brand-pink mt-1 font-medium">
                  Completed: {goals.filter(g => g.isCompleted).length} / {goals.length}
                </p>
              </div>
            </div>
          </div>

          {/* Platform Profiles Details */}
          <div>
            <h2 className="text-2xl font-bold text-slate-100 mb-6">Linked Handles Breakdown</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Codeforces Panel */}
              <div className="glass-panel p-6 rounded-2xl border border-slate-700 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-brand-indigo/5 rounded-full blur-2xl"></div>
                <div className="flex justify-between items-start">
                  <div>
                    <span className="px-2.5 py-1 text-xs font-bold bg-brand-indigo/10 border border-brand-indigo/20 text-brand-indigo rounded-full">
                      Codeforces
                    </span>
                    <h3 className="text-xl font-bold text-slate-100 mt-3">
                      {currentUser.codeforcesHandle ? `@${currentUser.codeforcesHandle}` : 'Not Linked'}
                    </h3>
                  </div>
                </div>
                {currentUser.codeforcesHandle ? (
                  <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-slate-800">
                    <div>
                      <p className="text-xs text-slate-400 uppercase">Rating</p>
                      <p className="text-lg font-bold text-slate-200 mt-1">
                        {stats.find(s => s.platform === 'Codeforces')?.currentRating || 'Unrated'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 uppercase">Max Rating</p>
                      <p className="text-lg font-bold text-slate-200 mt-1">
                        {stats.find(s => s.platform === 'Codeforces')?.maxRating || 'Unrated'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 uppercase">Contests</p>
                      <p className="text-lg font-bold text-slate-200 mt-1">
                        {stats.find(s => s.platform === 'Codeforces')?.contestsCount || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 uppercase">Solved Count</p>
                      <p className="text-lg font-bold text-slate-200 mt-1">
                        {stats.find(s => s.platform === 'Codeforces')?.solvedCount || 0}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="mt-8 space-y-4">
                    <p className="text-xs text-slate-400">Link your Codeforces handle to synchronize solved counts, rank badges, and rating graphs.</p>
                    <button
                      type="button"
                      onClick={handleStartEdit}
                      className="w-full text-center py-2 bg-brand-indigo/10 border border-brand-indigo/30 rounded-xl text-brand-indigo font-bold text-xs hover:bg-brand-indigo/20 transition"
                    >
                      Configure Codeforces Account
                    </button>
                  </div>
                )}
              </div>

              {/* CodeChef Panel */}
              <div className="glass-panel p-6 rounded-2xl border border-slate-700 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-brand-purple/5 rounded-full blur-2xl"></div>
                <div className="flex justify-between items-start">
                  <div>
                    <span className="px-2.5 py-1 text-xs font-bold bg-brand-purple/10 border border-brand-purple/20 text-brand-purple rounded-full">
                      CodeChef
                    </span>
                    <h3 className="text-xl font-bold text-slate-100 mt-3">
                      {currentUser.codechefHandle ? `@${currentUser.codechefHandle}` : 'Not Linked'}
                    </h3>
                  </div>
                </div>
                {currentUser.codechefHandle ? (
                  <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-slate-800">
                    <div>
                      <p className="text-xs text-slate-400 uppercase">Rating</p>
                      <p className="text-lg font-bold text-slate-200 mt-1">
                        {stats.find(s => s.platform === 'CodeChef')?.currentRating || 'Unrated'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 uppercase">Max Rating</p>
                      <p className="text-lg font-bold text-slate-200 mt-1">
                        {stats.find(s => s.platform === 'CodeChef')?.maxRating || 'Unrated'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 uppercase">Contests</p>
                      <p className="text-lg font-bold text-slate-200 mt-1">
                        {stats.find(s => s.platform === 'CodeChef')?.contestsCount || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 uppercase">Solved Count</p>
                      <p className="text-lg font-bold text-slate-200 mt-1">
                        {stats.find(s => s.platform === 'CodeChef')?.solvedCount || 0}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="mt-8 space-y-4">
                    <p className="text-xs text-slate-400">Link your CodeChef handle to track star rankings, global ranks, and solve rates.</p>
                    <button
                      type="button"
                      onClick={handleStartEdit}
                      className="w-full text-center py-2 bg-brand-purple/10 border border-brand-purple/30 rounded-xl text-brand-purple font-bold text-xs hover:bg-brand-purple/20 transition"
                    >
                      Configure CodeChef Account
                    </button>
                  </div>
                )}
              </div>

              {/* LeetCode Panel */}
              <div className="glass-panel p-6 rounded-2xl border border-slate-700 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-brand-cyan/5 rounded-full blur-2xl"></div>
                <div className="flex justify-between items-start">
                  <div>
                    <span className="px-2.5 py-1 text-xs font-bold bg-brand-cyan/10 border border-brand-cyan/20 text-brand-cyan rounded-full">
                      LeetCode
                    </span>
                    <h3 className="text-xl font-bold text-slate-100 mt-3">
                      {currentUser.leetcodeHandle ? `@${currentUser.leetcodeHandle}` : 'Not Linked'}
                    </h3>
                  </div>
                </div>
                {currentUser.leetcodeHandle ? (
                  <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-slate-800">
                    <div>
                      <p className="text-xs text-slate-400 uppercase">Solved Count</p>
                      <p className="text-lg font-bold text-slate-200 mt-1">
                        {lcSolved}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 uppercase">Easy Solved</p>
                      <p className="text-sm font-semibold text-slate-200 mt-1 text-emerald-400">
                        {stats.find(s => s.platform === 'LeetCode')?.difficultyDistribution?.Easy || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 uppercase">Medium Solved</p>
                      <p className="text-sm font-semibold text-slate-200 mt-1 text-amber-400">
                        {stats.find(s => s.platform === 'LeetCode')?.difficultyDistribution?.Medium || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 uppercase">Hard Solved</p>
                      <p className="text-sm font-semibold text-slate-200 mt-1 text-rose-500">
                        {stats.find(s => s.platform === 'LeetCode')?.difficultyDistribution?.Hard || 0}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="mt-8 space-y-4">
                    <p className="text-xs text-slate-400">Link your LeetCode handle to synchronize acceptance distribution (Easy/Medium/Hard).</p>
                    <button
                      type="button"
                      onClick={handleStartEdit}
                      className="w-full text-center py-2 bg-brand-cyan/10 border border-brand-cyan/30 rounded-xl text-brand-cyan font-bold text-xs hover:bg-brand-cyan/20 transition"
                    >
                      Configure LeetCode Account
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="glass-panel p-12 rounded-2xl border border-slate-700 text-center space-y-4">
          <ShieldCheck className="w-16 h-16 text-brand-cyan mx-auto animate-pulse-slow" />
          <h2 className="text-2xl font-bold text-slate-100">Welcome to CP Tracker</h2>
          <p className="text-slate-400 max-w-md mx-auto">
            Please register a new competitive programming profile or select an existing one to begin aggregating statistics, syncing history, and analyzing code performance.
          </p>
          <button
            onClick={() => setShowReg(true)}
            className="bg-gradient-to-r from-brand-indigo to-brand-purple hover:opacity-95 text-slate-100 px-6 py-2.5 rounded-xl font-bold transition inline-block"
          >
            Create Profile Handle
          </button>
        </div>
      )}
    </div>
  );
}
