import mongoose from 'mongoose';

const sheetProgressSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  problemId: {
    type: String,
    required: true
  },
  patternId: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['solved', 'revisit', 'unsolved'],
    default: 'unsolved'
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index to ensure one status per user per problem
sheetProgressSchema.index({ userId: 1, problemId: 1 }, { unique: true });

const SheetProgress = mongoose.model('SheetProgress', sheetProgressSchema);

export default SheetProgress;
