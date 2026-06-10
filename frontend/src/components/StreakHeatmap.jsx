import React from 'react';
import { Flame, Calendar, Award } from 'lucide-react';

export default function StreakHeatmap({ stats }) {
  // Aggregate submissions by date
  const getSubmissionsByDate = () => {
    const submissionCounts = {};
    stats.forEach(s => {
      (s.recentSubmissions || []).forEach(sub => {
        if (sub.verdict === 'OK' || sub.verdict === 'Accepted') {
          const date = new Date(sub.submittedAt);
          const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
          submissionCounts[dateStr] = (submissionCounts[dateStr] || 0) + 1;
        }
      });
    });
    return submissionCounts;
  };

  const activityMap = getSubmissionsByDate();

  // Generate grid for last 16 weeks (112 days) ending today
  const generateGridData = () => {
    const grid = [];
    const today = new Date();
    today.setHours(0,0,0,0);
    
    // We want to show a standard calendar alignment: Columns of weeks (Sunday to Saturday)
    // To make it simpler, we generate the last 112 days in order, then group into weeks
    const daysToShow = 112; // 16 weeks
    
    for (let i = daysToShow - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      
      grid.push({
        date,
        dateStr,
        count: activityMap[dateStr] || 0
      });
    }

    // Group into weeks (arrays of 7 days)
    const weeks = [];
    let currentWeek = [];
    
    // To align properly, find day of week for first date
    const firstDateDay = grid[0].date.getDay();
    // Fill empty cells for padding before the first day if necessary
    for (let p = 0; p < firstDateDay; p++) {
      currentWeek.push(null);
    }

    grid.forEach(day => {
      currentWeek.push(day);
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    });

    if (currentWeek.length > 0) {
      // Pad end of the last week
      while (currentWeek.length < 7) {
        currentWeek.push(null);
      }
      weeks.push(currentWeek);
    }

    return weeks;
  };

  const weeks = generateGridData();

  // Get color intensity for cell count
  const getCellColor = (count) => {
    if (count === 0) return 'bg-slate-900 border border-slate-800/40';
    if (count <= 1) return 'bg-brand-cyan/20 border border-brand-cyan/30 text-brand-cyan';
    if (count <= 3) return 'bg-brand-cyan/40 border border-brand-cyan/50 text-brand-cyan';
    if (count <= 5) return 'bg-brand-cyan/75 border border-brand-cyan/80 text-dark-950';
    return 'bg-brand-cyan border border-cyan-300 text-dark-950';
  };

  // Compute streak details
  const getStreakData = () => {
    const dates = Object.keys(activityMap).sort((a,b) => new Date(b) - new Date(a));
    if (dates.length === 0) return { current: 0, max: 0 };

    let current = 0;
    let max = 0;
    let temp = 0;

    const todayStr = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const hasCodedToday = activityMap[todayStr] > 0;
    const hasCodedYesterday = activityMap[yesterdayStr] > 0;

    if (hasCodedToday || hasCodedYesterday) {
      current = 1;
      let checkDate = hasCodedToday ? new Date(todayStr) : new Date(yesterdayStr);
      
      for (let i = 0; i < 150; i++) { // lookback limit
        const nextDate = new Date(checkDate);
        nextDate.setDate(nextDate.getDate() - 1);
        const nextDateStr = nextDate.toISOString().split('T')[0];
        
        if (activityMap[nextDateStr] > 0) {
          current++;
          checkDate = nextDate;
        } else {
          break;
        }
      }
    }

    // Longest streak
    const datesSortedAsc = Object.keys(activityMap).sort((a,b) => new Date(a) - new Date(b));
    let lastDate = null;
    datesSortedAsc.forEach(dStr => {
      const date = new Date(dStr);
      if (!lastDate) {
        temp = 1;
      } else {
        const diff = Math.ceil(Math.abs(date - lastDate) / (1000 * 60 * 60 * 24));
        if (diff === 1) {
          temp++;
        } else if (diff > 1) {
          max = Math.max(max, temp);
          temp = 1;
        }
      }
      lastDate = date;
    });
    max = Math.max(max, temp);

    return { current, max: Math.max(max, current) };
  };

  const streaks = getStreakData();

  return (
    <div className="space-y-8 animate-fadeIn">
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-brand-cyan via-brand-indigo to-brand-purple bg-clip-text text-transparent">
          Consistency Heatmap
        </h1>
        <p className="text-slate-400 mt-1">Visualize your daily coding streaks and aggregated activity trends.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Current streak card */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-700 flex items-center gap-5 glow-indigo">
          <div className="p-3 bg-brand-cyan/10 rounded-xl text-brand-cyan">
            <Flame className="w-8 h-8 animate-pulse" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Current coding streak</p>
            <h3 className="text-3xl font-extrabold text-slate-100 mt-1">{streaks.current} Days</h3>
            <p className="text-xs text-slate-400 mt-0.5">Keep submitting daily to keep it glowing!</p>
          </div>
        </div>

        {/* Max streak card */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-700 flex items-center gap-5">
          <div className="p-3 bg-brand-purple/10 rounded-xl text-brand-purple">
            <Award className="w-8 h-8" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Longest coding streak</p>
            <h3 className="text-3xl font-extrabold text-slate-100 mt-1">{streaks.max} Days</h3>
            <p className="text-xs text-slate-400 mt-0.5">Your lifetime consistency record.</p>
          </div>
        </div>

        {/* Calendar details card */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-700 flex items-center gap-5">
          <div className="p-3 bg-brand-indigo/10 rounded-xl text-brand-indigo">
            <Calendar className="w-8 h-8" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Active Days</p>
            <h3 className="text-3xl font-extrabold text-slate-100 mt-1">
              {Object.keys(activityMap).length} Days
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Coding session events recorded overall.</p>
          </div>
        </div>
      </div>

      {/* The Grid Map Panel */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-700 glow-indigo">
        <h3 className="font-bold text-slate-100 text-lg mb-6 flex items-center gap-2">
          Coding Heatmap (Last 16 Weeks)
        </h3>

        {stats.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            Sync accounts on the dashboard to build the calendar profile!
          </div>
        ) : (
          <div className="space-y-4">
            <div className="overflow-x-auto pb-2">
              <div className="flex gap-1 min-w-[700px] select-none justify-between">
                {/* Y-axis days of week */}
                <div className="flex flex-col justify-between text-[10px] text-slate-500 pr-2 pb-1 pt-1.5 h-[105px]">
                  <span>Sun</span>
                  <span>Tue</span>
                  <span>Thu</span>
                  <span>Sat</span>
                </div>

                {/* Heatmap Grid */}
                <div className="flex gap-1.5">
                  {weeks.map((week, wIdx) => (
                    <div key={wIdx} className="flex flex-col gap-1.5">
                      {week.map((day, dIdx) => {
                        if (!day) {
                          return (
                            <div 
                              key={dIdx} 
                              className="w-3 h-3 bg-transparent"
                            />
                          );
                        }

                        return (
                          <div
                            key={dIdx}
                            className={`w-3.5 h-3.5 rounded-sm heatmap-cell cursor-help transition-all duration-200 ${getCellColor(day.count)}`}
                            title={`${day.count} solved on ${day.date.toDateString()}`}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Grid Legend */}
            <div className="flex justify-between items-center text-xs text-slate-400 pt-3 border-t border-slate-800/60">
              <p>Activity timeline tracks Codeforces and LeetCode solved events.</p>
              <div className="flex items-center gap-1.5">
                <span>Less</span>
                <div className="w-3 h-3 rounded-sm bg-slate-900 border border-slate-800" />
                <div className="w-3 h-3 rounded-sm bg-brand-cyan/20 border border-brand-cyan/30" />
                <div className="w-3 h-3 rounded-sm bg-brand-cyan/40 border border-brand-cyan/50" />
                <div className="w-3 h-3 rounded-sm bg-brand-cyan/75 border border-brand-cyan/80" />
                <div className="w-3 h-3 rounded-sm bg-brand-cyan border border-cyan-300" />
                <span>More</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
