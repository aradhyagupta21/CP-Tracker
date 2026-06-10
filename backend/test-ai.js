import { aiService } from './src/services/aiService.js';

async function testAi() {
  console.log('Testing AI Performance Analyzer with local statistics...');
  const stats = [
    {
      platform: 'Codeforces',
      currentRating: 1420,
      maxRating: 1480,
      solvedCount: 120,
      solvedByTopic: {
        'Arrays': 40,
        'Graphs': 10,
        'DP': 8,
        'Greedy': 30,
        'Math': 32
      },
      difficultyDistribution: { Easy: 60, Medium: 50, Hard: 10 }
    },
    {
      platform: 'LeetCode',
      currentRating: 1600,
      maxRating: 1600,
      solvedCount: 180,
      solvedByTopic: {
        'Arrays': 80,
        'DP': 12,
        'Trees': 20,
        'Binary Search': 30,
        'Strings': 38
      },
      difficultyDistribution: { Easy: 100, Medium: 70, Hard: 10 }
    }
  ];

  try {
    const analysis = await aiService.analyzePerformance('aradhya', stats);
    console.log('AI Analysis Result Status: SUCCESS');
    console.log('\n--- Coach Insights ---');
    console.log(analysis.insights);
    
    console.log('\n--- Weak Topics ---');
    console.log(JSON.stringify(analysis.weakTopics, null, 2));

    console.log('\n--- Recommendations ---');
    console.log(JSON.stringify(analysis.recommendations, null, 2));
    
    console.log('\n--- Predictions ---');
    console.log(`Predicted Rating Gain: +${analysis.predictedRatingGain}`);
    console.log(`Probable Rank Range: ${analysis.predictedRankRange}`);
  } catch (err) {
    console.error('AI Analyzer test FAILED:', err.message);
  }
}

testAi();
