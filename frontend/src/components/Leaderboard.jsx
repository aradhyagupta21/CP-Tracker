import React, { useState } from 'react';
import { Trophy, Plus, UserX, Medal, Search, Users } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = 'http://localhost:5000/api';

export default function Leaderboard({ currentUser, leaderboard, onFriendAdd, onFriendRemove }) {
  const [friendUsername, setFriendUsername] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAddFriend = async (e) => {
    e.preventDefault();
    setError('');

    if (!friendUsername.trim()) {
      setError('Friend username is required');
      return;
    }

    setIsLoading(true);
    try {
      const res = await axios.post(`${BACKEND_URL}/users/${currentUser._id}/friends`, {
        friendUsername: friendUsername.trim()
      });
      onFriendAdd(res.data);
      setFriendUsername('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add friend');
    } finally {
      setIsLoading(false);
    }
  };

  const getRankIcon = (index) => {
    if (index === 0) return <Medal className="w-5 h-5 text-amber-400" />;
    if (index === 1) return <Medal className="w-5 h-5 text-slate-400" />;
    if (index === 2) return <Medal className="w-5 h-5 text-amber-600" />;
    return <span className="text-slate-500 font-bold text-sm w-5 text-center">{index + 1}</span>;
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-100 ">
          Leaderboards & Social
        </h1>
        <p className="text-slate-500 mt-1">Compare ratings and problem-solving counts with friends.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Leaderboard Table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
              <Trophy className="w-6 h-6 text-amber-400" /> Active Standings
            </h2>
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Sorted by solved problems</span>
          </div>

          <div className="bg-[#110e1b] border border-slate-800/80 rounded-2xl border border-slate-800/80 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800/80 bg-[#110e1b] text-slate-500 text-xs font-semibold uppercase tracking-wider">
                    <th className="py-4 px-5 w-16">Rank</th>
                    <th className="py-4 px-5">Developer</th>
                    <th className="py-4 px-5 text-center">CF Rating</th>
                    <th className="py-4 px-5 text-center">CC Rating</th>
                    <th className="py-4 px-5 text-center">LC Solved</th>
                    <th className="py-4 px-5 text-right">Total Solved</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {leaderboard.map((user, idx) => {
                    const isSelf = user.userId === currentUser._id;
                    
                    return (
                      <tr 
                        key={user.userId} 
                        className={`hover:bg-slate-50 transition-all ${isSelf ? 'bg-brand-indigo/10 font-semibold text-slate-100 border-l-2 border-royal/20' : 'text-slate-400'}`}
                      >
                        <td className="py-4 px-5">
                          <div className="flex justify-center items-center h-full">
                            {getRankIcon(idx)}
                          </div>
                        </td>
                        <td className="py-4 px-5">
                          <div className="flex flex-col">
                            <span>{user.username}</span>
                            {isSelf && <span className="text-[10px] text-brand-indigo font-bold">You</span>}
                          </div>
                        </td>
                        <td className="py-4 px-5 text-center font-bold text-slate-100">
                          {user.codeforcesRating > 0 ? user.codeforcesRating : '-'}
                        </td>
                        <td className="py-4 px-5 text-center font-bold text-slate-100">
                          {user.codechefRating > 0 ? user.codechefRating : '-'}
                        </td>
                        <td className="py-4 px-5 text-center text-slate-100">
                          {user.leetcodeSolved > 0 ? user.leetcodeSolved : '-'}
                        </td>
                        <td className="py-4 px-5 text-right font-extrabold text-brand-indigo text-sm">
                          {user.totalSolved}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Friends Management & Info Panel */}
        <div className="space-y-6">
          {/* Add Friend Form */}
          <div className="bg-[#110e1b] border border-slate-800/80 p-6 rounded-2xl border border-slate-800/80">
            <h2 className="text-xl font-bold text-slate-100 mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-brand-indigo" /> Add Friend
            </h2>

            {error && (
              <div className="p-3 bg-red-900/30 border border-red-500/40 rounded-xl text-red-300 text-sm mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleAddFriend} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500">Friend's Username *</label>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={friendUsername}
                    onChange={(e) => setFriendUsername(e.target.value)}
                    placeholder="Enter registered username"
                    className="w-full bg-[#110e1b] border border-slate-800/80 pl-9 pr-3 py-2 rounded-xl text-slate-100 outline-none focus:border-royal/20"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-brand-indigo text-white text-slate-100 py-2.5 rounded-xl font-bold transition hover:opacity-95 disabled:opacity-50"
              >
                {isLoading ? 'Adding...' : 'Link Friend'}
              </button>
            </form>
          </div>

          {/* Linked Friends List */}
          <div className="bg-[#110e1b] border border-slate-800/80 p-6 rounded-2xl border border-slate-800/80">
            <h2 className="text-xl font-bold text-slate-100 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-slate-100" /> Linked Friends
            </h2>

            {(!currentUser.friends || currentUser.friends.length === 0) ? (
              <p className="text-sm text-slate-500">You haven't linked any friends yet. Add usernames registered on CP Pulse to see their standings.</p>
            ) : (
              <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                {currentUser.friends.map((friendName) => (
                  <div 
                    key={friendName} 
                    className="flex justify-between items-center p-3 bg-[#110e1b] border border-slate-800/80 rounded-xl hover:border-slate-800/80 transition"
                  >
                    <span className="text-sm font-semibold text-slate-100">{friendName}</span>
                    <button
                      onClick={() => onFriendRemove(friendName)}
                      className="p-1 text-slate-500 hover:text-red-400 transition"
                      title="Unlink Friend"
                    >
                      <UserX className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
