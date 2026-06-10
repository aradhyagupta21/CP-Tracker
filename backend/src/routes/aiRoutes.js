import express from 'express';
import { dbHelper } from '../config/dbHelper.js';
import { aiService } from '../services/aiService.js';

const router = express.Router();

router.post('/:userId/analyze', async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await dbHelper.getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const stats = await dbHelper.getStatistics(userId);
    if (!stats || stats.length === 0) {
      return res.status(400).json({ error: 'No platform statistics found. Please sync your accounts first before generating AI analysis!' });
    }

    const analysis = await aiService.analyzePerformance(user.username, stats);
    res.json(analysis);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
