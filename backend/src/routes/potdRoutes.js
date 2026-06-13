import express from 'express';
import axios from 'axios';

const router = express.Router();

// GET /api/potd
// Fetches the live Problem of the Day from LeetCode GraphQL
router.get('/', async (req, res) => {
  try {
    const query = `
      query questionOfToday {
        activeDailyCodingChallengeQuestion {
          date
          link
          question {
            difficulty
            title
            titleSlug
          }
        }
      }
    `;

    const response = await axios.post('https://leetcode.com/graphql', {
      query
    }, {
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (response.data && response.data.data && response.data.data.activeDailyCodingChallengeQuestion) {
      const potdData = response.data.data.activeDailyCodingChallengeQuestion;
      res.json({
        date: potdData.date,
        link: `https://leetcode.com${potdData.link}`,
        id: potdData.question.titleSlug,
        title: potdData.question.title,
        difficulty: potdData.question.difficulty
      });
    } else {
      res.status(500).json({ error: 'Unexpected response format from LeetCode' });
    }
  } catch (error) {
    console.error('Error fetching POTD:', error.message);
    res.status(500).json({ error: 'Failed to fetch POTD from LeetCode' });
  }
});

export default router;
