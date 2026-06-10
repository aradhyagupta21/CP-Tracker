import mongoose from 'mongoose';

const StatisticsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  platform: {
    type: String,
    enum: ['Codeforces', 'CodeChef', 'LeetCode'],
    required: true
  },
  currentRating: {
    type: Number,
    default: 0
  },
  maxRating: {
    type: Number,
    default: 0
  },
  contestsCount: {
    type: Number,
    default: 0
  },
  solvedCount: {
    type: Number,
    default: 0
  },
  solvedByTopic: {
    type: Map,
    of: Number,
    default: {}
  },
  difficultyDistribution: {
    type: Map,
    of: Number,
    default: {}
  },
  ratingHistory: [{
    contestName: String,
    rating: Number,
    rank: Number,
    date: Date,
    ratingChange: Number
  }],
  recentSubmissions: [{
    problemName: String,
    problemUrl: String,
    verdict: String,
    submittedAt: Date,
    difficulty: String,
    tags: [String]
  }],
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Compound index to ensure uniqueness per user and platform
StatisticsSchema.index({ userId: 1, platform: 1 }, { unique: true });

export default mongoose.models.Statistics || mongoose.model('Statistics', StatisticsSchema);
