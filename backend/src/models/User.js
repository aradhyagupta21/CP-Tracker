import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  codeforcesHandle: {
    type: String,
    default: ''
  },
  codechefHandle: {
    type: String,
    default: ''
  },
  leetcodeHandle: {
    type: String,
    default: ''
  },
  friends: {
    type: [String], // Array of handles or user IDs
    default: []
  },
  credentials: [{
    platform: String,
    handle: String,
    token: String,
    linkedAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

export default mongoose.models.User || mongoose.model('User', UserSchema);
