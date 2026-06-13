import React, { useState, useEffect } from 'react';
import { 
  BookOpen, CheckCircle2, Circle, ExternalLink, X, Activity, ChevronRight, Play, Search,
  Grid, Layers, Code, Zap, Sparkles, GitMerge, Database, Cpu, BarChart2, Shuffle, Binary 
} from 'lucide-react';
import axios from 'axios';
import { leetcodeTopics } from '../data/leetcodePatterns';

const BACKEND_URL = 'http://localhost:5000/api';

const IconMap = {
  Grid, Layers, Code, Zap, BookOpen, Sparkles, GitMerge, Database, Cpu, BarChart2, Shuffle, Binary
};

export default function PatternSheet({ currentUser }) {
  const [progress, setProgress] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  
  // Navigation State
  const [activeView, setActiveView] = useState('topics'); // 'topics', 'patterns', 'problems'
  const [currentTopic, setCurrentTopic] = useState(null);
  const [currentPattern, setCurrentPattern] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchProgress = async () => {
    if (!currentUser?._id) return;
    setIsLoading(true);
    try {
      const res = await axios.get(`${BACKEND_URL}/sheet/${currentUser._id}`);
      const progressMap = {};
      res.data.forEach(item => {
        progressMap[item.problemId] = item.status;
      });
      setProgress(progressMap);
    } catch (err) {
      console.error('Failed to load sheet progress:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProgress();
  }, [currentUser]);

  const toggleProblemStatus = async (problemId, patternId) => {
    if (!currentUser?._id) return;
    const currentStatus = progress[problemId];
    const newStatus = currentStatus === 'solved' ? 'unsolved' : 'solved';

    setProgress(prev => ({ ...prev, [problemId]: newStatus }));

    try {
      await axios.post(`${BACKEND_URL}/sheet/update`, {
        userId: currentUser._id,
        problemId,
        patternId,
        status: newStatus
      });
    } catch (err) {
      console.error('Failed to update status:', err);
      fetchProgress(); // Revert on error
    }
  };

  const getTopicSolved = (topic) => {
    let count = 0;
    topic.subPatterns.forEach(sp => {
      sp.problems.forEach(p => {
        if (progress[p.id] === 'solved') count++;
      });
    });
    return count;
  };

  const getPatternSolved = (pattern) => {
    return pattern.problems.filter(p => progress[p.id] === 'solved').length;
  };

  // ----------------------------------------------------
  // VIEW 1: TOPICS GRID
  // ----------------------------------------------------
  const renderTopicsView = () => (
    <div className="animate-fadeIn">
      <div className="flex justify-between items-end pb-4 border-b border-slate-800/60 mb-8">
        <div>
          <p className="text-[10px] font-bold text-brand-indigo uppercase tracking-[0.2em] mb-2">Algorithm Collections</p>
          <h1 className="text-4xl font-extrabold tracking-tight text-white">
            Pattern-Wise <span className="text-brand-purple">Mastery</span>
          </h1>
        </div>
        <div className="text-slate-400 text-sm font-medium pb-2">
          <span className="text-white font-bold text-xl">{leetcodeTopics.length}</span> topics
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {leetcodeTopics.map(topic => {
          const IconComp = IconMap[topic.icon] || Grid;
          const solved = getTopicSolved(topic);
          const percentage = topic.totalProblems > 0 ? Math.round((solved / topic.totalProblems) * 100) : 0;
          
          return (
            <div 
              key={topic.id} 
              onClick={() => {
                setCurrentTopic(topic);
                setActiveView('patterns');
              }}
              className="bg-[#110e1b]/80 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 cursor-pointer group hover:bg-[#151122] transition-all duration-300 hover:border-brand-indigo/40 hover:-translate-y-1 relative overflow-hidden"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="w-10 h-10 rounded-xl bg-brand-indigo/10 flex items-center justify-center text-brand-indigo group-hover:bg-brand-indigo/20 transition-all">
                  <IconComp className="w-5 h-5" />
                </div>
                <div className="text-xs font-semibold text-slate-500 bg-slate-900/50 px-2 py-1 rounded-md border border-slate-800/50 group-hover:text-slate-400 transition-colors">
                  {solved}/{topic.totalProblems}
                </div>
              </div>
              <div className="mb-8">
                <h3 className="text-lg font-bold text-slate-100 group-hover:text-white mb-1 transition-colors">{topic.title}</h3>
                <p className="text-sm font-medium text-brand-purple/70">{topic.patternsCount} patterns</p>
              </div>
              <div className="pt-4 border-t border-slate-800/60">
                <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 group-hover:text-slate-400">
                  <span>Progress</span>
                  <span className={percentage > 0 ? 'text-brand-indigo' : ''}>{percentage}%</span>
                </div>
                <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden">
                  <div className="h-full bg-brand-indigo rounded-full transition-all duration-1000 ease-out" style={{ width: `${percentage}%` }}></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  // ----------------------------------------------------
  // VIEW 2: TACTICAL PATTERNS
  // ----------------------------------------------------
  const renderPatternsView = () => {
    if (!currentTopic) return null;
    const overallSolved = getTopicSolved(currentTopic);
    const overallPercentage = currentTopic.totalProblems > 0 ? Math.round((overallSolved / currentTopic.totalProblems) * 100) : 0;

    return (
      <div className="animate-fadeIn">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">
          <button onClick={() => setActiveView('topics')} className="hover:text-brand-indigo transition-colors">Curriculum</button>
          <ChevronRight className="w-3 h-3" />
          <span className="text-slate-300">Patterns</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between pb-8 mb-8 border-b border-slate-800/60">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2">
              Tactical <span className="text-brand-purple">Patterns</span>
            </h1>
            <p className="text-slate-400 text-sm">{currentTopic.patternsCount} patterns — work through each to build complete mastery.</p>
          </div>
          <div className="mt-6 md:mt-0 bg-[#110e1b] border border-slate-800/80 px-6 py-4 rounded-2xl flex items-center gap-6">
            <div className="w-48 h-2 bg-slate-900 rounded-full overflow-hidden relative">
              <div className="absolute inset-y-0 left-0 bg-brand-indigo rounded-full" style={{ width: `${overallPercentage}%` }}></div>
            </div>
            <div className="text-sm font-bold"><span className="text-brand-indigo">{overallPercentage}%</span> <span className="text-slate-500">overall</span></div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentTopic.subPatterns.map(pattern => {
            const solved = getPatternSolved(pattern);
            const percentage = pattern.totalProblems > 0 ? Math.round((solved / pattern.totalProblems) * 100) : 0;

            return (
              <div key={pattern.id} className="bg-[#110e1b] border border-slate-800/80 rounded-2xl p-6 flex flex-col hover:border-brand-indigo/40 transition-colors group">
                <div className="w-12 h-12 rounded-full bg-slate-800/50 flex items-center justify-center text-slate-400 mb-6 group-hover:bg-brand-indigo/20 group-hover:text-brand-indigo transition-all">
                  <Play className="w-5 h-5 ml-1" />
                </div>
                <h3 className="text-xl font-bold text-white mb-1">{pattern.title}</h3>
                <p className="text-sm text-slate-500 font-medium mb-6">{solved} of {pattern.totalProblems} problems solved</p>
                
                <div className="mb-6">
                  <div className="flex justify-between text-xs font-bold text-slate-500 mb-2">
                    <span>{solved}/{pattern.totalProblems} solved</span>
                    <span className={percentage > 0 ? 'text-brand-indigo' : ''}>{percentage}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-indigo rounded-full" style={{ width: `${percentage}%` }}></div>
                  </div>
                </div>

                <div className="mt-auto pt-4">
                  <button 
                    onClick={() => {
                      setCurrentPattern(pattern);
                      setSearchQuery('');
                      setActiveView('problems');
                    }}
                    className="w-full py-3 bg-slate-800/30 hover:bg-slate-800/60 rounded-xl text-sm font-bold text-slate-300 hover:text-white border border-transparent hover:border-slate-700 transition-all flex items-center justify-center gap-2"
                  >
                    Start Pattern <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ----------------------------------------------------
  // VIEW 3: PATTERN PROBLEMS
  // ----------------------------------------------------
  const renderProblemsView = () => {
    if (!currentTopic || !currentPattern) return null;
    const solved = getPatternSolved(currentPattern);
    const percentage = currentPattern.totalProblems > 0 ? Math.round((solved / currentPattern.totalProblems) * 100) : 0;

    const filteredProblems = currentPattern.problems.filter(p => 
      p.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
      <div className="animate-fadeIn">
        <div className="bg-[#110e1b] border border-slate-800/80 rounded-3xl p-8 mb-8">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest mb-6">
            <button onClick={() => setActiveView('topics')} className="hover:text-brand-indigo transition-colors">Topic</button>
            <ChevronRight className="w-3 h-3" />
            <button onClick={() => setActiveView('patterns')} className="hover:text-brand-indigo transition-colors">Pattern</button>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <h1 className="text-4xl font-extrabold text-white mb-2">Pattern Problems</h1>
              <p className="text-slate-400 text-sm">{solved} of {currentPattern.totalProblems} problems solved in this pattern.</p>
            </div>
            <div className="mt-6 md:mt-0 flex items-center gap-4">
              <div className="text-5xl font-black text-brand-purple">{percentage}%</div>
              <div>
                <p className="text-sm font-bold text-slate-500 mb-1">Pattern Mastery</p>
                <div className="w-32 h-1.5 bg-slate-900 rounded-full overflow-hidden">
                  <div className="h-full bg-brand-purple rounded-full" style={{ width: `${percentage}%` }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#110e1b] border border-slate-800/80 rounded-3xl overflow-hidden">
          {/* Table Header Controls */}
          <div className="p-6 border-b border-slate-800/60 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-white">Problems</h2>
              <span className="bg-slate-800/50 px-2 py-1 rounded text-xs font-bold text-brand-indigo">{currentPattern.problems.length} problems</span>
            </div>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input 
                type="text" 
                placeholder="Search problems..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-brand-purple/50 focus:ring-1 focus:ring-brand-purple/50 transition-all"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center w-5 h-5 rounded border border-slate-700 bg-slate-800 text-[10px] text-slate-400 font-mono">⌘K</div>
            </div>
          </div>

          {/* Table List */}
          <div className="overflow-x-auto">
            {filteredProblems.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-sm">
                No problems found matching your search, or this pattern doesn't have curated problems yet.
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800/60 bg-dark-900/20">
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest w-24">Status</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Problem Title</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center w-24">Solve</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right w-32">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProblems.map((prob) => {
                    const isSolved = progress[prob.id] === 'solved';
                    return (
                      <tr key={prob.id} className="border-b border-slate-800/30 hover:bg-slate-800/20 transition-colors group">
                        <td className="px-6 py-5">
                          <button 
                            onClick={() => toggleProblemStatus(prob.id, currentTopic.id)}
                            className={`flex items-center justify-center w-6 h-6 rounded-full border transition-all ${isSolved ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 'border-slate-600 text-transparent hover:border-brand-purple'}`}
                          >
                            {isSolved && <CheckCircle2 className="w-4 h-4" />}
                          </button>
                        </td>
                        <td className="px-6 py-5">
                          <span className="font-bold text-slate-200 group-hover:text-white transition-colors">{prob.title}</span>
                        </td>
                        <td className="px-6 py-5 text-center">
                          <a 
                            href={prob.url} 
                            target="_blank" 
                            rel="noreferrer"
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-800/50 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <button
                            onClick={() => toggleProblemStatus(prob.id, currentTopic.id)}
                            className={`px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-lg hover:shadow-xl ${isSolved ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20' : 'bg-brand-purple text-white hover:bg-[#8b5cf6]'}`}
                          >
                            {isSolved ? 'Solved' : 'Verify'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 pb-12 relative min-h-screen">
      {activeView === 'topics' && renderTopicsView()}
      {activeView === 'patterns' && renderPatternsView()}
      {activeView === 'problems' && renderProblemsView()}
    </div>
  );
}
