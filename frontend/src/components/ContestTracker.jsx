import React, { useEffect, useState, useCallback } from 'react';
import { Calendar, TrendingUp, Sparkles, Clock, RefreshCw, ShieldAlert, Filter } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = 'http://localhost:5000/api';

const PLATFORM_COLORS = {
  Codeforces: {
    pill: 'bg-brand-indigo/10 border-brand-indigo/25 text-brand-indigo',
    tab: 'from-brand-indigo to-blue-600',
    glow: 'border-brand-indigo/30',
    dot: 'bg-brand-indigo'
  },
  CodeChef: {
    pill: 'bg-brand-purple/10 border-brand-purple/25 text-brand-purple',
    tab: 'from-brand-purple to-violet-600',
    glow: 'border-brand-purple/30',
    dot: 'bg-brand-purple'
  },
  LeetCode: {
    pill: 'bg-brand-cyan/10 border-brand-cyan/25 text-brand-cyan',
    tab: 'from-brand-cyan to-teal-500',
    glow: 'border-brand-cyan/30',
    dot: 'bg-brand-cyan'
  }
};

export default function ContestTracker({ stats, currentUser }) {
  const [allUpcoming, setAllUpcoming] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('synced');
  const [refreshKey, setRefreshKey] = useState(0);

  // Detect which platforms the current user has linked
  const linkedPlatforms = [];
  if (currentUser?.codeforcesHandle) linkedPlatforms.push('Codeforces');
  if (currentUser?.codechefHandle) linkedPlatforms.push('CodeChef');
  if (currentUser?.leetcodeHandle) linkedPlatforms.push('LeetCode');

  const fetchContests = useCallback(async () => {
    setLoading(true);
    setErr('');
    try {
      const res = await axios.get(`${BACKEND_URL}/contests/upcoming`, { timeout: 8000 });
      if (res.data && Array.isArray(res.data)) {
        const parsed = res.data.map(c => ({
          ...c,
          startTime: new Date(c.startTime)
        }));
        setAllUpcoming(parsed);
      }
    } catch (e) {
      console.warn('Backend contest proxy failed, falling back to direct Codeforces API...', e.message);
      setErr('Could not load live schedules. Showing available data.');
      // Minimal fallback: pull CF only
      try {
        const cfRes = await axios.get('https://codeforces.com/api/contest.list?gym=false', { timeout: 5000 });
        if (cfRes.data?.status === 'OK') {
          const upcoming = cfRes.data.result
            .filter(c => c.phase === 'BEFORE')
            .map(c => {
              const h = c.durationSeconds / 3600;
              return {
                id: `cf-${c.id}`,
                name: c.name,
                platform: 'Codeforces',
                startTime: new Date(c.startTimeSeconds * 1000),
                duration: Number.isInteger(h) ? `${h} hrs` : `${h.toFixed(1)} hrs`,
                link: `https://codeforces.com/contest/${c.id}`
              };
            });
          setAllUpcoming(upcoming);
        }
      } catch (_) {
        setErr('Failed to load contest schedules. Check your internet connection.');
      }
    } finally {
      setLoading(false);
    }
  }, [refreshKey]);

  useEffect(() => {
    fetchContests();
  }, [fetchContests]);

  // Apply platform filter
  const getFilteredContests = () => {
    if (selectedFilter === 'all') return allUpcoming.slice(0, 8);
    if (selectedFilter === 'synced') {
      if (linkedPlatforms.length === 0) return allUpcoming.slice(0, 8);
      return allUpcoming.filter(c => linkedPlatforms.includes(c.platform)).slice(0, 8);
    }
    return allUpcoming.filter(c => c.platform === selectedFilter).slice(0, 8);
  };

  const filtered = getFilteredContests();

  const formatDateTime = (date) => {
    return date.toLocaleString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeUntil = (date) => {
    const diff = date - Date.now();
    if (diff <= 0) return 'Starting now';
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (days > 0) return `in ${days}d ${hours}h`;
    if (hours > 0) return `in ${hours}h ${mins}m`;
    return `in ${mins}m`;
  };

  // Compile full contest history across stats
  const getFullHistory = () => {
    let history = [];
    stats.forEach(s => {
      if (s.ratingHistory) {
        const platformHistory = s.ratingHistory.map(h => ({ ...h, platform: s.platform }));
        history = [...history, ...platformHistory];
      }
    });
    return history.sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  const history = getFullHistory();

  // Contest Predictor
  const getPrediction = () => {
    const cfStats = stats.find(s => s.platform === 'Codeforces');
    if (!cfStats || !cfStats.ratingHistory || cfStats.ratingHistory.length === 0) return null;
    const ratings = cfStats.ratingHistory.map(h => h.rating);
    const changes = cfStats.ratingHistory.map(h => h.ratingChange);
    const ranks = cfStats.ratingHistory.map(h => h.rank);
    const avgChange = Math.round(changes.reduce((sum, val) => sum + val, 0) / changes.length);
    const lastRating = ratings[ratings.length - 1];
    const predictedChange = avgChange > 0 ? Math.round(avgChange * 0.8) : Math.round(avgChange * 0.5 + 15);
    const predictedRank = Math.round(ranks.reduce((sum, val) => sum + val, 0) / ranks.length);
    return {
      platform: 'Codeforces',
      currentRating: lastRating,
      expectedChange: predictedChange >= 0 ? `+${predictedChange}` : predictedChange,
      expectedChangeRaw: predictedChange,
      probableRank: `${Math.max(100, Math.round(predictedRank * 0.85))} - ${Math.round(predictedRank * 1.15)}`,
      strategy: cfStats.currentRating < 1400
        ? 'Focus purely on speed solving problems A & B. Skip C if it involves Dynamic Programming or Complex Graphs.'
        : 'Solve A & B within 35 minutes. Read C and D, and focus on Greedy/Constructive algorithms first.'
    };
  };

  const prediction = getPrediction();

  const filterTabs = [
    {
      id: 'synced',
      label: `My Syncs${linkedPlatforms.length > 0 ? ` (${linkedPlatforms.length})` : ''}`,
      activeClass: 'bg-gradient-to-r from-brand-indigo to-brand-purple text-slate-100 shadow-md shadow-brand-indigo/10'
    },
    { id: 'all', label: 'All Platforms', activeClass: 'bg-gradient-to-r from-slate-600 to-slate-700 text-slate-100' },
    { id: 'Codeforces', label: 'Codeforces', activeClass: 'bg-gradient-to-r from-brand-indigo to-blue-600 text-slate-100' },
    { id: 'CodeChef', label: 'CodeChef', activeClass: 'bg-gradient-to-r from-brand-purple to-violet-600 text-slate-100' },
    { id: 'LeetCode', label: 'LeetCode', activeClass: 'bg-gradient-to-r from-brand-cyan to-teal-500 text-slate-900' }
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-brand-cyan via-brand-indigo to-brand-purple bg-clip-text text-transparent">
          Contest Tracker & Predictor
        </h1>
        <p className="text-slate-400 mt-1">Live schedules synced from Codeforces, CodeChef & LeetCode.</p>
      </div>

      {/* Predictor Panel */}
      {prediction ? (
        <div className="glass-panel p-6 rounded-2xl border border-slate-700 relative overflow-hidden glow-indigo">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-cyan/5 rounded-full blur-3xl"></div>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-brand-cyan animate-pulse" />
            <span className="text-xs font-bold text-brand-cyan uppercase tracking-wider">Advanced Contest Predictor</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-100 mb-4">Upcoming Contest Forecast</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-4 border-t border-slate-800/80">
            <div>
              <p className="text-xs text-slate-400 uppercase">Target Platform</p>
              <p className="text-lg font-bold text-slate-200 mt-1">{prediction.platform}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase">Predicted Rating Shift</p>
              <p className={`text-lg font-extrabold mt-1 ${prediction.expectedChangeRaw >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {prediction.expectedChange}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase">Expected Rank Range</p>
              <p className="text-lg font-bold text-slate-200 mt-1">#{prediction.probableRank}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase">Current Profile Rating</p>
              <p className="text-lg font-bold text-slate-200 mt-1">{prediction.currentRating}</p>
            </div>
          </div>
          <div className="mt-5 p-4 bg-dark-900/60 border border-slate-800 rounded-xl">
            <h4 className="text-xs font-bold text-brand-indigo uppercase tracking-wider mb-1">Coach Strategy Recommendation:</h4>
            <p className="text-sm text-slate-300 font-medium">{prediction.strategy}</p>
          </div>
        </div>
      ) : (
        <div className="glass-panel p-6 rounded-2xl border border-slate-700 text-slate-400 text-sm flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 text-brand-cyan" />
          To generate contest predictions, sync a Codeforces handle with at least one competitive match history.
        </div>
      )}

      {/* Upcoming Contests */}
      <div className="space-y-4">
        {/* Section Header + Refresh */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Clock className="w-6 h-6 text-brand-cyan" /> Upcoming Schedules
          </h2>
          <button
            onClick={() => setRefreshKey(k => k + 1)}
            disabled={loading}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold glass-panel border border-slate-700 text-slate-400 hover:text-slate-200 hover:border-brand-cyan/30 transition-all duration-200 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        {/* Platform Filter Pills */}
        <div className="flex flex-wrap gap-2 items-center">
          <Filter className="w-4 h-4 text-slate-500 shrink-0" />
          {filterTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 border ${
                selectedFilter === tab.id
                  ? `${tab.activeClass} border-transparent shadow-sm`
                  : 'bg-slate-800/30 border-slate-700/50 text-slate-400 hover:text-slate-200 hover:bg-slate-700/40'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Notice when no handles linked */}
        {selectedFilter === 'synced' && linkedPlatforms.length === 0 && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300 text-xs font-medium">
            No platform handles linked yet. Showing all platforms. Head to <strong>Dashboard → Configure Handles</strong> to link your profiles.
          </div>
        )}

        {err && (
          <div className="p-3 bg-red-900/20 border border-red-500/30 rounded-xl text-red-300 text-xs font-medium">
            {err}
          </div>
        )}

        {/* Contest Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="glass-panel p-4 rounded-2xl border border-slate-700/50 animate-pulse">
                <div className="flex justify-between items-center gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-slate-700/50 rounded-full w-24"></div>
                    <div className="h-5 bg-slate-700/50 rounded-full w-3/4"></div>
                  </div>
                  <div className="space-y-2 text-right shrink-0">
                    <div className="h-4 bg-slate-700/50 rounded-full w-20"></div>
                    <div className="h-3 bg-slate-700/50 rounded-full w-16"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass-panel p-12 rounded-2xl text-center text-slate-400 text-sm border border-slate-700">
            No upcoming contests found for the selected filter.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((c) => {
              const colors = PLATFORM_COLORS[c.platform] || PLATFORM_COLORS.Codeforces;
              const timeUntil = getTimeUntil(c.startTime);
              const isStartingSoon = c.startTime - Date.now() < 3 * 60 * 60 * 1000;
              return (
                <a
                  key={c.id}
                  href={c.link}
                  target="_blank"
                  rel="noreferrer"
                  className={`glass-panel p-4 rounded-2xl border border-slate-700 flex justify-between items-center gap-4 hover:${colors.glow} transition-all duration-300 group block`}
                >
                  <div className="space-y-2 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-0.5 text-[10px] font-bold border rounded-full ${colors.pill}`}>
                        {c.platform}
                      </span>
                      <span className="text-[10px] text-slate-500 font-semibold bg-slate-800/60 px-2 py-0.5 rounded-full">
                        ⏱ {c.duration}
                      </span>
                      {isStartingSoon && (
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2 py-0.5 rounded-full animate-pulse">
                          SOON
                        </span>
                      )}
                    </div>
                    <h4 className="font-bold text-slate-200 group-hover:text-slate-100 transition text-sm leading-snug line-clamp-2">
                      {c.name}
                    </h4>
                  </div>

                  <div className="text-right shrink-0 space-y-1">
                    <p className="text-xs font-bold text-brand-cyan whitespace-nowrap">
                      {formatDateTime(c.startTime)}
                    </p>
                    <p className={`text-[10px] font-semibold ${isStartingSoon ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {timeUntil}
                    </p>
                    <p className="text-[10px] text-slate-600">Click to register →</p>
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </div>

      {/* Contest History */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-brand-purple" /> Historic Ranks & Rating Shifts
        </h2>

        {history.length === 0 ? (
          <div className="glass-panel p-12 rounded-2xl text-center text-slate-400 text-sm border border-slate-700">
            No historic contest data linked yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[420px] overflow-y-auto pr-1">
            {history.map((c, idx) => {
              const colors = PLATFORM_COLORS[c.platform] || PLATFORM_COLORS.Codeforces;
              return (
                <div
                  key={idx}
                  className="glass-panel p-4 rounded-2xl border border-slate-700 flex justify-between items-center gap-4"
                >
                  <div className="space-y-1.5 min-w-0">
                    <span className={`px-2 py-0.5 text-[10px] font-bold border rounded-full ${colors.pill}`}>
                      {c.platform}
                    </span>
                    <h4 className="font-bold text-slate-200 text-sm line-clamp-1">{c.contestName}</h4>
                    <p className="text-[10px] text-slate-500">{new Date(c.date).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-slate-200">Rank: #{c.rank}</p>
                    <div className="flex items-center justify-end gap-1.5 mt-0.5">
                      <span className="text-xs text-slate-400 font-semibold">Rating: {c.rating}</span>
                      {c.ratingChange !== undefined && (
                        <span className={`text-[10px] font-bold ${c.ratingChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          ({c.ratingChange >= 0 ? `+${c.ratingChange}` : c.ratingChange})
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
