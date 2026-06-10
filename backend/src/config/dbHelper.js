import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { checkMongoConnection } from './db.js';
import User from '../models/User.js';
import Statistics from '../models/Statistics.js';
import Goal from '../models/Goal.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '../../data');

// Ensure data directory exists for JSON fallback
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const USERS_FILE = path.join(DATA_DIR, 'users.json');
const STATS_FILE = path.join(DATA_DIR, 'statistics.json');
const GOALS_FILE = path.join(DATA_DIR, 'goals.json');

// Initialize files if they don't exist
const initFile = (filePath) => {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify([], null, 2));
  }
};
initFile(USERS_FILE);
initFile(STATS_FILE);
initFile(GOALS_FILE);

const readJSON = (filePath) => {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch (err) {
    return [];
  }
};

const writeJSON = (filePath, data) => {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

export const dbHelper = {
  // --- USER METHODS ---
  async getUsers() {
    if (checkMongoConnection()) {
      return await User.find({});
    } else {
      return readJSON(USERS_FILE);
    }
  },

  async getUserById(id) {
    if (checkMongoConnection()) {
      return await User.findById(id);
    } else {
      const users = readJSON(USERS_FILE);
      return users.find(u => u._id === id) || null;
    }
  },

  async getUserByUsername(username) {
    if (checkMongoConnection()) {
      return await User.findOne({ username: new RegExp(`^${username}$`, 'i') });
    } else {
      const users = readJSON(USERS_FILE);
      return users.find(u => u.username.toLowerCase() === username.toLowerCase()) || null;
    }
  },

  async createUser(userData) {
    if (checkMongoConnection()) {
      const newUser = new User(userData);
      return await newUser.save();
    } else {
      const users = readJSON(USERS_FILE);
      const existing = users.find(u => u.username.toLowerCase() === userData.username.toLowerCase());
      if (existing) {
        throw new Error('User already exists');
      }
      const newUser = {
        _id: 'u_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
        username: userData.username,
        password: userData.password,
        codeforcesHandle: userData.codeforcesHandle || '',
        codechefHandle: userData.codechefHandle || '',
        leetcodeHandle: userData.leetcodeHandle || '',
        friends: userData.friends || [],
        credentials: userData.credentials || [],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      users.push(newUser);
      writeJSON(USERS_FILE, users);
      return newUser;
    }
  },

  async updateUser(id, userData) {
    if (checkMongoConnection()) {
      return await User.findByIdAndUpdate(id, userData, { new: true });
    } else {
      const users = readJSON(USERS_FILE);
      const index = users.findIndex(u => u._id === id);
      if (index === -1) return null;
      
      const updatedUser = {
        ...users[index],
        ...userData,
        updatedAt: new Date()
      };
      users[index] = updatedUser;
      writeJSON(USERS_FILE, users);
      return updatedUser;
    }
  },

  // --- STATISTICS METHODS ---
  async getStatistics(userId) {
    const idStr = userId.toString();
    if (checkMongoConnection()) {
      return await Statistics.find({ userId });
    } else {
      const stats = readJSON(STATS_FILE);
      return stats.filter(s => s.userId === idStr);
    }
  },

  async getStatisticsByPlatform(userId, platform) {
    const idStr = userId.toString();
    if (checkMongoConnection()) {
      return await Statistics.findOne({ userId, platform });
    } else {
      const stats = readJSON(STATS_FILE);
      return stats.find(s => s.userId === idStr && s.platform === platform) || null;
    }
  },

  async upsertStatistics(userId, platform, statData) {
    const idStr = userId.toString();
    if (checkMongoConnection()) {
      return await Statistics.findOneAndUpdate(
        { userId, platform },
        { ...statData, userId, platform, lastUpdated: new Date() },
        { new: true, upsert: true }
      );
    } else {
      const stats = readJSON(STATS_FILE);
      const index = stats.findIndex(s => s.userId === idStr && s.platform === platform);
      const updatedStat = {
        _id: index !== -1 ? stats[index]._id : 's_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
        userId: idStr,
        platform,
        currentRating: statData.currentRating || 0,
        maxRating: statData.maxRating || 0,
        contestsCount: statData.contestsCount || 0,
        solvedCount: statData.solvedCount || 0,
        solvedByTopic: statData.solvedByTopic || {},
        difficultyDistribution: statData.difficultyDistribution || {},
        ratingHistory: statData.ratingHistory || [],
        recentSubmissions: statData.recentSubmissions || [],
        lastUpdated: new Date(),
        createdAt: index !== -1 ? stats[index].createdAt : new Date(),
        updatedAt: new Date()
      };

      if (index !== -1) {
        stats[index] = updatedStat;
      } else {
        stats.push(updatedStat);
      }
      writeJSON(STATS_FILE, stats);
      return updatedStat;
    }
  },

  // --- GOAL METHODS ---
  async getGoals(userId) {
    const idStr = userId.toString();
    if (checkMongoConnection()) {
      return await Goal.find({ userId });
    } else {
      const goals = readJSON(GOALS_FILE);
      return goals.filter(g => g.userId === idStr);
    }
  },

  async createGoal(userId, goalData) {
    const idStr = userId.toString();
    if (checkMongoConnection()) {
      const newGoal = new Goal({ ...goalData, userId });
      return await newGoal.save();
    } else {
      const goals = readJSON(GOALS_FILE);
      const newGoal = {
        _id: 'g_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
        userId: idStr,
        title: goalData.title,
        platform: goalData.platform,
        targetType: goalData.targetType,
        targetValue: Number(goalData.targetValue),
        currentValue: Number(goalData.currentValue || 0),
        isCompleted: !!goalData.isCompleted,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      goals.push(newGoal);
      writeJSON(GOALS_FILE, goals);
      return newGoal;
    }
  },

  async updateGoal(goalId, goalData) {
    if (checkMongoConnection()) {
      return await Goal.findByIdAndUpdate(goalId, goalData, { new: true });
    } else {
      const goals = readJSON(GOALS_FILE);
      const index = goals.findIndex(g => g._id === goalId);
      if (index === -1) return null;
      
      const updatedGoal = {
        ...goals[index],
        ...goalData,
        updatedAt: new Date()
      };
      goals[index] = updatedGoal;
      writeJSON(GOALS_FILE, goals);
      return updatedGoal;
    }
  },

  async deleteGoal(goalId) {
    if (checkMongoConnection()) {
      return await Goal.findByIdAndDelete(goalId);
    } else {
      const goals = readJSON(GOALS_FILE);
      const index = goals.findIndex(g => g._id === goalId);
      if (index === -1) return null;
      const deleted = goals.splice(index, 1)[0];
      writeJSON(GOALS_FILE, goals);
      return deleted;
    }
  }
};
