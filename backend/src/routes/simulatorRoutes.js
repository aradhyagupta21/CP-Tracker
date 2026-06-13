import express from 'express';
import { simulatorService } from '../services/simulatorService.js';
import { dbHelper } from '../config/dbHelper.js';

const router = express.Router();

// Generate a contest
router.get('/generate', async (req, res) => {
  try {
    const { targetRating, questionCount, division } = req.query;
    let rating = 1400;
    let count = 4;
    let divStr = division || 'Custom';

    if (targetRating && questionCount) {
      rating = parseInt(targetRating, 10);
      count = parseInt(questionCount, 10);
    } else if (division) {
      if (division === 'Div 1') rating = 2100;
      else if (division === 'Div 2') rating = 1700;
      else if (division === 'Div 3') rating = 1400;
      else if (division === 'Div 4') rating = 1000;
    } else {
      return res.status(400).json({ error: 'Target rating and question count are required' });
    }

    const contest = await simulatorService.generateContest(rating, count);
    // Add the division to the response so the frontend knows what was generated
    contest.division = divStr;
    res.json(contest);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Evaluate contest performance
router.post('/evaluate', async (req, res) => {
  try {
    const { targetRating, userId, results, division } = req.body;
    
    if (!targetRating || !results || !division) {
      return res.status(400).json({ error: 'Target rating, division, and results are required' });
    }

    let userCurrentRating = 1200; // default

    // If userId provided, fetch their real Codeforces rating
    if (userId) {
      const stats = await dbHelper.getStatisticsByPlatform(userId, 'Codeforces');
      if (stats && stats.currentRating > 0) {
        userCurrentRating = stats.currentRating;
      }
    }

    const evaluation = await simulatorService.evaluatePerformance(
      parseInt(targetRating, 10),
      userCurrentRating,
      results
    );

    if (userId) {
      // Calculate solved count
      const solvedCount = results.filter(r => r.solved).length;
      
      // Save simulation record
      await dbHelper.createSimulationRecord(userId, {
        division,
        targetRating: parseInt(targetRating, 10),
        solvedCount,
        totalScore: evaluation.totalScore,
        predictedRatingChange: evaluation.predictedRatingChange,
        performanceRating: evaluation.performanceRating
      });
    }

    res.json(evaluation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user simulation records
router.get('/records/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const records = await dbHelper.getSimulationRecords(userId);
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
