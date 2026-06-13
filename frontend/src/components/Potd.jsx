import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, CheckCircle2, ExternalLink, Flame, Search, ChevronRight, Zap } from 'lucide-react';

const BACKEND_URL = 'http://localhost:5000/api';

// Famous problems for historical fallback
const historicalProblems = [
  { title: "Merge Two Sorted Lists", id: "merge-two-sorted-lists", difficulty: "Easy" },
  { title: "Valid Parentheses", id: "valid-parentheses", difficulty: "Easy" },
  { title: "Remove Nth Node From End of List", id: "remove-nth-node-from-end-of-list", difficulty: "Medium" },
  { title: "4Sum", id: "4sum", difficulty: "Medium" },
  { title: "Letter Combinations of a Phone Number", id: "letter-combinations-of-a-phone-number", difficulty: "Medium" },
  { title: "3Sum Closest", id: "3sum-closest", difficulty: "Medium" },
  { title: "3Sum", id: "3sum", difficulty: "Medium" },
  { title: "Longest Common Prefix", id: "longest-common-prefix", difficulty: "Easy" },
  { title: "Roman to Integer", id: "roman-to-integer", difficulty: "Easy" },
  { title: "Integer to Roman", id: "integer-to-roman", difficulty: "Medium" },
  { title: "Container With Most Water", id: "container-with-most-water", difficulty: "Medium" },
  { title: "Regular Expression Matching", id: "regular-expression-matching", difficulty: "Hard" },
  { title: "Palindrome Number", id: "palindrome-number", difficulty: "Easy" },
  { title: "String to Integer (atoi)", id: "string-to-integer-atoi", difficulty: "Medium" },
  { title: "Reverse Integer", id: "reverse-integer", difficulty: "Medium" },
  { title: "Zigzag Conversion", id: "zigzag-conversion", difficulty: "Medium" },
  { title: "Longest Palindromic Substring", id: "longest-palindromic-substring", difficulty: "Medium" },
  { title: "Median of Two Sorted Arrays", id: "median-of-two-sorted-arrays", difficulty: "Hard" },
  { title: "Longest Substring Without Repeating Characters", id: "longest-substring-without-repeating-characters", difficulty: "Medium" },
  { title: "Add Two Numbers", id: "add-two-numbers", difficulty: "Medium" },
  { title: "Two Sum", id: "two-sum", difficulty: "Easy" }
];

export default function Potd({ currentUser }) {
  const [livePotd, setLivePotd] = useState(null);
  const [history, setHistory] = useState([]);
  const [progress, setProgress] = useState({});
  const [potdProgress, setPotdProgress] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Generate the last 20 days dynamically
  useEffect(() => {
    const generatedHistory = [];
    for (let i = 1; i <= 20; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const prob = historicalProblems[i - 1];
      
      generatedHistory.push({
        date: dateStr,
        title: prob.title,
        id: prob.id,
        difficulty: prob.difficulty,
        link: `https://leetcode.com/problems/${prob.id}/`
      });
    }
    setHistory(generatedHistory);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch Live POTD
        const potdRes = await axios.get(`${BACKEND_URL}/potd`);
        setLivePotd(potdRes.data);
      } catch (err) {
        console.error('Failed to fetch live POTD:', err);
      }

      // Fetch user progress
      if (currentUser?._id) {
        try {
          const res = await axios.get(`${BACKEND_URL}/sheet/${currentUser._id}`);
          const progressMap = {};
          const pProgress = [];
          res.data.forEach(item => {
            progressMap[item.problemId] = item.status;
            if (item.patternId === 'potd' && item.status === 'solved') {
              pProgress.push(item);
            }
          });
          setProgress(progressMap);
          setPotdProgress(pProgress);
        } catch (err) {
          console.error('Failed to load sheet progress:', err);
        }
      }
      setIsLoading(false);
    };
    fetchData();
  }, [currentUser]);

  const toggleStatus = async (problemId) => {
    if (!currentUser?._id) return;
    const currentStatus = progress[problemId];
    const newStatus = currentStatus === 'solved' ? 'unsolved' : 'solved';

    setProgress(prev => ({ ...prev, [problemId]: newStatus }));

    try {
      const res = await axios.post(`${BACKEND_URL}/sheet/update`, {
        userId: currentUser._id,
        problemId,
        patternId: 'potd',
        status: newStatus
      });
      // Optionally update local potdProgress state here to immediately reflect streak change
      if (newStatus === 'solved') {
        setPotdProgress(prev => [...prev, res.data]);
      } else {
        setPotdProgress(prev => prev.filter(p => p.problemId !== problemId));
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const getDifficultyColor = (diff) => {
    switch(diff) {
      case 'Easy': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
      case 'Medium': return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
      case 'Hard': return 'text-red-400 bg-red-400/10 border-red-400/20';
      default: return 'text-slate-400 bg-slate-400/10 border-slate-400/20';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 rounded-full border-4 border-brand-indigo border-t-transparent animate-spin"></div>
      </div>
    );
  }

  const isLiveSolved = livePotd && progress[livePotd.id] === 'solved';

  return (
    <div className="animate-fadeIn space-y-8 pb-12">
      {/* Header */}
      <div className="flex justify-between items-end pb-4 border-b border-slate-800/60 mb-8">
        <div>
          <p className="text-[10px] font-bold text-brand-indigo uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-500" /> Daily Challenge
          </p>
          <h1 className="text-4xl font-extrabold tracking-tight text-white">
            Problem of the <span className="text-brand-purple">day</span>
          </h1>
        </div>
      </div>

      {/* Hero Section: Live POTD */}
      {livePotd && (
        <div className="bg-gradient-to-br from-[#110e1b] to-[#151122] border border-brand-indigo/30 rounded-3xl p-8 shadow-2xl shadow-brand-indigo/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
            <Calendar className="w-32 h-32 text-brand-indigo" />
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <span className="px-3 py-1 bg-brand-indigo/20 text-brand-indigo font-bold text-xs rounded-lg border border-brand-indigo/30 uppercase tracking-widest flex items-center gap-2">
                <Zap className="w-3 h-3" /> Live Today
              </span>
              <span className="text-slate-400 text-sm font-semibold">{livePotd.date}</span>
            </div>

            <h2 className="text-3xl md:text-5xl font-black text-white mb-4 leading-tight">
              {livePotd.title}
            </h2>
            
            <div className="flex flex-wrap items-center gap-4 mb-10">
              <span className={`px-3 py-1 rounded-lg text-xs font-bold border ${getDifficultyColor(livePotd.difficulty)}`}>
                {livePotd.difficulty}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <a 
                href={livePotd.link} 
                target="_blank" 
                rel="noreferrer"
                className="w-full sm:w-auto px-8 py-4 bg-white text-blue-950 font-bold rounded-xl hover:bg-slate-200 transition-colors shadow-lg shadow-white/10 flex items-center justify-center gap-2"
              >
                Start Problem <ExternalLink className="w-4 h-4" />
              </a>
              <button
                onClick={() => toggleStatus(livePotd.id)}
                className={`w-full sm:w-auto px-8 py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 border ${isLiveSolved ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50 shadow-emerald-500/20 shadow-lg' : 'bg-slate-800/50 text-slate-300 border-slate-700 hover:bg-brand-purple hover:text-white hover:border-brand-purple'}`}
              >
                {isLiveSolved ? (
                  <> <CheckCircle2 className="w-5 h-5" /> Completed </>
                ) : (
                  'Mark as Solved'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Practice Streak Widget */}
      <div className="bg-[#110e1b] border border-slate-800/80 rounded-3xl overflow-hidden mt-12 p-8 shadow-2xl flex flex-col items-center justify-center text-center glow-purple relative">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-t from-brand-purple/5 to-transparent opacity-50 pointer-events-none"></div>
        
        <div className="p-4 bg-brand-purple/10 rounded-2xl text-brand-purple mb-6 animate-pulse">
          <Flame className="w-12 h-12" />
        </div>
        
        <h2 className="text-2xl font-bold text-white mb-2">Practice Streak Tracker</h2>
        <p className="text-slate-400 text-sm mb-8 max-w-sm">Consistency is key to mastering algorithms. Complete the Problem of the Day to build your streak!</p>
        
        <div className="flex items-center gap-10">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Total Solved</p>
            <div className="text-5xl font-black text-slate-200">
              {potdProgress.length}
            </div>
          </div>
          <div className="w-px h-16 bg-slate-800"></div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Current Streak</p>
            <div className="text-5xl font-black text-brand-purple flex items-baseline gap-2">
              {(() => {
                if (potdProgress.length === 0) return 0;
                // Safely calculate streak avoiding undefined updatedAt errors
                const dates = [...new Set(
                  potdProgress
                    .map(p => p.updatedAt ? new Date(p.updatedAt) : null)
                    .filter(d => d && !isNaN(d.valueOf()))
                    .map(d => d.toISOString().split('T')[0])
                )].sort();
                if (dates.length === 0) return 0;
                
                let currentStreak = 0;
                const todayStr = new Date().toISOString().split('T')[0];
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                const yesterdayStr = yesterday.toISOString().split('T')[0];
                
                if (dates.includes(todayStr) || dates.includes(yesterdayStr)) {
                  currentStreak = 1;
                  let check = dates.includes(todayStr) ? todayStr : yesterdayStr;
                  while (true) {
                    const d = new Date(check + 'T00:00:00Z');
                    d.setUTCDate(d.getUTCDate() - 1);
                    const prev = d.toISOString().split('T')[0];
                    if (dates.includes(prev)) {
                      currentStreak++;
                      check = prev;
                    } else {
                      break;
                    }
                  }
                }
                return currentStreak;
              })()}
              <span className="text-xl font-bold text-slate-500">Days</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
