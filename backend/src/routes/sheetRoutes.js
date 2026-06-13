import express from 'express';
import { dbHelper } from '../config/dbHelper.js';

const router = express.Router();

// Get user's sheet progress
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const progress = await dbHelper.getSheetProgress(userId);
    res.json(progress);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a problem's status
router.post('/update', async (req, res) => {
  try {
    const { userId, problemId, patternId, status } = req.body;
    
    if (!userId || !problemId || !patternId || !status) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const updatedProgress = await dbHelper.upsertSheetProgress(userId, problemId, patternId, status);
    res.json(updatedProgress);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
