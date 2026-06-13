import React, { useState } from 'react';
import { Sparkles, Brain, Award, ShieldAlert, ArrowUpRight, Flame, Target, MessageSquareCode } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = 'http://localhost:5000/api';

export default function AiAnalyzer({ currentUser, stats }) {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAnalyze = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await axios.post(`${BACKEND_URL}/ai/${currentUser._id}/analyze`);
      setAnalysis(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate AI performance report. Make sure your profiles are synced first.');
    } finally {
      setLoading(false);
    }
  };

  const getPlatformClass = (plat) => {
    const classes = {
      'Codeforces': 'bg-brand-indigo/10 border border-royal/20 text-brand-indigo',
      'CodeChef': 'bg-brand-indigo/10 border border-brand-indigo/20 text-slate-100',
      'LeetCode': 'bg-brand-indigo/10 border border-royal/20 text-brand-indigo'
    };
    return classes[plat] || 'bg-slate-50 border border-slate-800/80 text-slate-400';
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-100 ">
            AI Performance Coach
          </h1>
          <p className="text-slate-500 mt-1">Leverage Gemini to audit weak spots and discover targeted problems.</p>
        </div>

        {currentUser && (
          <button
            onClick={handleAnalyze}
            disabled={loading || stats.length === 0}
            className={`flex items-center gap-2 text-slate-100 hover:opacity-95 text-slate-100 px-6 py-2.5 rounded-xl font-bold transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <Sparkles className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Analyzing Profile...' : 'Analyze My Performance'}
          </button>
        )}
      </div>

      {stats.length === 0 ? (
        <div className="bg-[#110e1b] border border-slate-800/80 p-12 rounded-2xl border border-slate-800/80 text-center text-slate-500">
          Sync your account profiles on the dashboard to trigger AI coaching audits.
        </div>
      ) : !analysis ? (
        <div className="bg-[#110e1b] border border-slate-800/80 p-12 rounded-2xl border border-slate-800/80 text-center space-y-6 shadow-sm">
          <Brain className="w-16 h-16 text-brand-indigo mx-auto animate-bounce" />
          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-xl font-bold text-slate-100">Ready to audit your DSA progress?</h3>
            <p className="text-slate-500 text-sm">
              Our analyzer combines solved tags across Codeforces, LeetCode, and CodeChef and queries Gemini to isolate accuracy limits, predict rating gains, and assign practice tasks.
            </p>
          </div>
          {error && <p className="text-sm text-red-400 font-semibold">{error}</p>}
          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="bg-brand-indigo text-white hover:opacity-95 text-slate-100 px-6 py-2.5 rounded-xl font-bold transition"
          >
            Run AI Coaching Audit
          </button>
        </div>
      ) : (
        <div className="space-y-8 animate-fadeIn">
          {/* Insights Overview Paragraph */}
          <div className="bg-[#110e1b] border border-slate-800/80 p-6 rounded-2xl border border-slate-800/80 shadow-sm space-y-3 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-indigo/10 rounded-full blur-3xl"></div>
            <h3 className="font-extrabold text-slate-100 text-xl flex items-center gap-2">
              <MessageSquareCode className="w-6 h-6 text-brand-indigo" /> Coach Insights Overview
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed font-medium">
              {analysis.insights}
            </p>
          </div>

          {/* Rating forecasts and tactics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#110e1b] border border-slate-800/80 p-6 rounded-2xl border border-slate-800/80 flex items-center gap-5">
              <div className="p-3 bg-brand-indigo/10 rounded-xl text-brand-indigo">
                <Flame className="w-8 h-8" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Predicted Rating Shift</p>
                <h3 className="text-3xl font-extrabold text-emerald-400 mt-1">
                  +{analysis.predictedRatingGain}
                </h3>
                <p className="text-[10px] text-slate-500 mt-0.5">Estimated performance trend</p>
              </div>
            </div>

            <div className="bg-[#110e1b] border border-slate-800/80 p-6 rounded-2xl border border-slate-800/80 flex items-center gap-5">
              <div className="p-3 bg-brand-indigo/10 rounded-xl text-slate-100">
                <Award className="w-8 h-8" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Contest Rank Range</p>
                <h3 className="text-xl font-bold text-slate-100 mt-1">#{analysis.predictedRankRange}</h3>
                <p className="text-[10px] text-slate-500 mt-0.5">Forecasted standings rank</p>
              </div>
            </div>

            <div className="bg-[#110e1b] border border-slate-800/80 p-6 rounded-2xl border border-slate-800/80 flex items-center gap-5">
              <div className="p-3 bg-brand-indigo/10 rounded-xl text-brand-indigo">
                <Target className="w-8 h-8" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 tracking-wider uppercase">Focus Category</p>
                <h3 className="text-lg font-bold text-slate-100 mt-1">
                  {analysis.weakTopics[0]?.topic || 'DP / Graphs'}
                </h3>
                <p className="text-[10px] text-slate-500 mt-0.5">Top prioritized growth topic</p>
              </div>
            </div>
          </div>

          {/* Weak Topics warnings */}
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
              <ShieldAlert className="w-6 h-6 text-brand-indigo" /> Identified Weak Areas
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {analysis.weakTopics.map((item, idx) => (
                <div key={idx} className="bg-[#110e1b] border border-slate-800/80 p-5 rounded-2xl border border-slate-800/80 flex flex-col justify-between gap-3 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-brand-indigo/10 rounded-full blur-2xl"></div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="px-3 py-1 bg-brand-indigo/10 border border-royal/20 text-brand-indigo rounded-full font-bold text-xs">
                        {item.topic}
                      </span>
                      <span className="text-slate-500 font-semibold text-xs">Accuracy rate: <span className="text-brand-indigo font-bold">{item.accuracy}</span></span>
                    </div>
                    <p className="text-slate-400 text-sm leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500">Solved count: {item.solvedCount} problems</span>
                </div>
              ))}
            </div>
          </div>

          {/* Problem Recommendations */}
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-brand-indigo" /> Smart Problem Recommendations
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {analysis.recommendations.map((item, idx) => (
                <div key={idx} className="bg-[#110e1b] border border-slate-800/80 p-5 rounded-2xl border border-slate-800/80 flex flex-col justify-between gap-4 hover:border-royal/20 transition-all duration-300">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className={`px-2 py-0.5 text-[10px] font-bold border rounded-full ${getPlatformClass(item.platform)}`}>
                        {item.platform}
                      </span>
                      <span className="text-[10px] text-slate-500 font-semibold">{item.difficulty}</span>
                    </div>
                    <h4 className="font-bold text-slate-100 line-clamp-1">{item.name}</h4>
                    <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">
                      {item.reason}
                    </p>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-slate-800/80">
                    <span className="text-[10px] font-bold text-brand-indigo uppercase tracking-wide">{item.topic}</span>
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-semibold text-brand-indigo hover:text-brand-indigo transition flex items-center gap-0.5"
                    >
                      Attempt <ArrowUpRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Contest Strategy Recommendations */}
          <div className="bg-[#110e1b] border border-slate-800/80 p-6 rounded-2xl border border-slate-800/80 space-y-4">
            <h3 className="font-extrabold text-slate-100 text-lg flex items-center gap-2">
              <Brain className="w-5 h-5 text-slate-100" /> Dynamic Contest Pacing Tactics
            </h3>
            <div className="text-sm text-slate-400 whitespace-pre-line leading-relaxed font-medium">
              {analysis.contestStrategy}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
