import axios from 'axios';

// In-memory cache for CF problems to avoid fetching 10MB repeatedly
let problemsCache = null;
let cacheTimestamp = 0;

export const simulatorService = {
  async generateContest(targetRating, questionCount = 4) {
    const rating = parseInt(targetRating, 10);
    if (isNaN(rating)) throw new Error('Invalid target rating');
    const count = parseInt(questionCount, 10);

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

      // Filter problems that have exactly the target rating
      const ratedProblems = problemsCache.filter(p => p.rating === rating);
      const selectedProblems = [];
      const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

      const candidates = [...ratedProblems];
      for (let i = 0; i < count; i++) {
        if (candidates.length > 0) {
          const randIdx = Math.floor(Math.random() * candidates.length);
          const p = candidates[randIdx];
          candidates.splice(randIdx, 1);
          selectedProblems.push({
            letter: alphabet[i],
            name: p.name,
            url: `https://codeforces.com/contest/${p.contestId}/problem/${p.index}`,
            rating: p.rating,
            tags: p.tags
          });
        } else {
          // Fallback if no exact match
          selectedProblems.push({
            letter: alphabet[i],
            name: `Mock Problem ${alphabet[i]}`,
            url: '#',
            rating: rating,
            tags: ['implementation']
          });
        }
      }

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
        problems: Array.from({ length: count }).map((_, i) => ({
          letter: alphabet[i],
          name: `Mock Problem ${alphabet[i]}`,
          url: '#',
          rating: rating,
          tags: ['mock']
        })),
        generatedAt: new Date()
      };
    }
  },

  async evaluatePerformance(targetRating, userCurrentRating, results) {
    let totalScore = 0;
    let solvedCount = 0;
    let totalTime = 0;

    // Uniform scoring: 1000 per problem
    results.forEach(res => {
      if (res.solved) {
        solvedCount++;
        totalTime += res.timeMinutes;
        const maxScore = 1000;
        let score = maxScore - (maxScore / 250) * res.timeMinutes - (50 * (res.penaltyCount || 0));
        score = Math.max(score, maxScore * 0.3); // minimum 30% points if solved
        totalScore += score;
      }
    });

    const totalQuestions = results.length;
    const maxPossibleScore = totalQuestions * 1000;
    const percentage = totalScore / maxPossibleScore;

    // Rank estimation
    let baseRank = 20000;
    if (percentage > 0) {
      baseRank = 20000 - (percentage * 19000);
    }
    baseRank = Math.max(1, Math.round(baseRank));

    // Predict Rating Change
    const effectiveUserRating = userCurrentRating > 0 ? userCurrentRating : 1200;
    
    // Performance rating based on percentage solved uniformly
    let performanceRating = targetRating - 400 + (percentage * 800);
    
    // Adjust by time
    if (solvedCount > 0) {
      const avgTime = totalTime / solvedCount;
      if (avgTime < 15) performanceRating += 100;
      else if (avgTime > 60) performanceRating -= 100;
    }

    let ratingChange = Math.round((performanceRating - effectiveUserRating) / 4);
    ratingChange = Math.min(150, Math.max(-100, ratingChange));

    return {
      estimatedRank: baseRank,
      predictedRatingChange: ratingChange,
      performanceRating: Math.round(performanceRating),
      totalScore: Math.round(totalScore)
    };
  }
};
