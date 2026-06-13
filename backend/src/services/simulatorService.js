import axios from 'axios';

// In-memory cache for CF problems to avoid fetching 10MB repeatedly
let problemsCache = null;
let cacheTimestamp = 0;

export const simulatorService = {
  async generateContest(targetRating) {
    const rating = parseInt(targetRating, 10);
    if (isNaN(rating)) throw new Error('Invalid target rating');

    try {
      // Refresh cache if older than 24 hours
      if (!problemsCache || Date.now() - cacheTimestamp > 24 * 60 * 60 * 1000) {
        const res = await axios.get('https://codeforces.com/api/problemset.problems');
        if (res.data && res.data.status === 'OK') {
          problemsCache = res.data.result.problems;
          cacheTimestamp = Date.now();
        } else {
          throw new Error('CF API returned non-OK status');
        }
      }

      // Filter problems that have ratings
      const ratedProblems = problemsCache.filter(p => p.rating);
      
      // Define target ratings for A, B, C, D
      const targets = [
        { id: 'A', rating: Math.max(800, rating - 400) },
        { id: 'B', rating: Math.max(900, rating - 200) },
        { id: 'C', rating: rating },
        { id: 'D', rating: rating + 200 }
      ];

      const selectedProblems = [];

      targets.forEach(t => {
        // Find problems close to target rating
        const candidates = ratedProblems.filter(p => Math.abs(p.rating - t.rating) <= 100);
        if (candidates.length > 0) {
          // Pick a random problem
          const p = candidates[Math.floor(Math.random() * candidates.length)];
          selectedProblems.push({
            letter: t.id,
            name: p.name,
            url: `https://codeforces.com/contest/${p.contestId}/problem/${p.index}`,
            rating: p.rating,
            tags: p.tags
          });
        } else {
          // Fallback if no exact match (rare on CF)
          selectedProblems.push({
            letter: t.id,
            name: `Mock Problem ${t.id}`,
            url: '#',
            rating: t.rating,
            tags: ['implementation']
          });
        }
      });

      return {
        targetRating: rating,
        problems: selectedProblems,
        generatedAt: new Date()
      };

    } catch (error) {
      console.warn(`Failed to fetch CF problems for simulator: ${error.message}. Using mocks.`);
      // Mock Fallback
      return {
        targetRating: rating,
        problems: [
          { letter: 'A', name: 'Watermelon Distro', url: '#', rating: Math.max(800, rating - 400), tags: ['math'] },
          { letter: 'B', name: 'Array Shuffle', url: '#', rating: Math.max(900, rating - 200), tags: ['greedy', 'sortings'] },
          { letter: 'C', name: 'Tree Traversals', url: '#', rating: rating, tags: ['graphs', 'dfs'] },
          { letter: 'D', name: 'Dynamic Counting', url: '#', rating: rating + 200, tags: ['dp'] }
        ],
        generatedAt: new Date()
      };
    }
  },

  async evaluatePerformance(targetRating, userCurrentRating, results) {
    // results is an array of objects: { letter: 'A', solved: true, timeMinutes: 15, penaltyCount: 1 }
    
    let totalScore = 0;
    let solvedCount = 0;
    let totalTime = 0;

    // Simple Div2-like scoring model
    // A: 500, B: 1000, C: 1500, D: 2000
    const maxScores = { A: 500, B: 1000, C: 1500, D: 2000 };

    results.forEach(res => {
      if (res.solved) {
        solvedCount++;
        totalTime += res.timeMinutes;
        const maxScore = maxScores[res.letter] || 500;
        // Decrease score based on time and penalties
        let score = maxScore - (maxScore / 250) * res.timeMinutes - (50 * (res.penaltyCount || 0));
        score = Math.max(score, maxScore * 0.3); // minimum 30% points if solved
        totalScore += score;
      }
    });

    // Estimate Rank based on targetRating tier and solved count
    // A 1400 rated contest might have 20000 participants.
    let baseRank = 15000;
    if (solvedCount === 0) baseRank = 18000;
    else if (solvedCount === 1) baseRank = 12000 - (totalScore / 500) * 1000;
    else if (solvedCount === 2) baseRank = 8000 - (totalScore / 1500) * 2000;
    else if (solvedCount === 3) baseRank = 4000 - (totalScore / 3000) * 1500;
    else if (solvedCount === 4) baseRank = 1000 - (totalScore / 5000) * 800;

    baseRank = Math.max(1, Math.round(baseRank));

    // Predict Rating Change
    // Calculate expected performance (Elo-like simplified)
    // If user's current rating is lower than target rating, gaining points is easier.
    const effectiveUserRating = userCurrentRating > 0 ? userCurrentRating : 1200;
    
    let performanceRating = 800;
    if (solvedCount === 1) performanceRating = targetRating - 300;
    else if (solvedCount === 2) performanceRating = targetRating;
    else if (solvedCount === 3) performanceRating = targetRating + 300;
    else if (solvedCount === 4) performanceRating = targetRating + 600;

    // Adjust performance rating by time factor
    if (solvedCount > 0) {
      const avgTime = totalTime / solvedCount;
      if (avgTime < 20) performanceRating += 100;
      else if (avgTime > 60) performanceRating -= 100;
    }

    let ratingChange = Math.round((performanceRating - effectiveUserRating) / 4);
    
    // Cap rating changes to realistic bounds [-100, +150]
    ratingChange = Math.min(150, Math.max(-100, ratingChange));

    return {
      estimatedRank: baseRank,
      predictedRatingChange: ratingChange,
      performanceRating,
      totalScore: Math.round(totalScore)
    };
  }
};
