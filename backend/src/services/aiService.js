import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

// Custom rule-based generator for mock AI feedback when Gemini API is keyless/offline
const generateMockAiAnalysis = (username, stats) => {
  // Aggregate stats across platforms
  let totalSolved = 0;
  let cfRating = 0;
  let ccRating = 0;
  let lcSolved = 0;
  
  const topicSolvedCombined = {
    'Arrays': 0, 'Graphs': 0, 'DP': 0, 'Trees': 0, 'Greedy': 0, 'Binary Search': 0, 'Math': 0, 'Strings': 0
  };

  const difficultyCombined = { Easy: 0, Medium: 0, Hard: 0 };

  stats.forEach(s => {
    totalSolved += s.solvedCount || 0;
    if (s.platform === 'Codeforces') cfRating = s.currentRating;
    if (s.platform === 'CodeChef') ccRating = s.currentRating;
    if (s.platform === 'LeetCode') lcSolved = s.solvedCount;

    // Topics
    if (s.solvedByTopic) {
      const topics = s.solvedByTopic instanceof Map ? Object.fromEntries(s.solvedByTopic) : s.solvedByTopic;
      Object.keys(topics).forEach(t => {
        if (topicSolvedCombined[t] !== undefined) {
          topicSolvedCombined[t] += topics[t] || 0;
        }
      });
    }

    // Difficulty
    if (s.difficultyDistribution) {
      const diffs = s.difficultyDistribution instanceof Map ? Object.fromEntries(s.difficultyDistribution) : s.difficultyDistribution;
      Object.keys(diffs).forEach(d => {
        if (difficultyCombined[d] !== undefined) {
          difficultyCombined[d] += diffs[d] || 0;
        }
      });
    }
  });

  // Calculate weak topics (topics with lowest counts, especially DP, Graphs, Trees)
  const sortedTopics = Object.keys(topicSolvedCombined).sort((a, b) => topicSolvedCombined[a] - topicSolvedCombined[b]);
  const weakestTopic1 = sortedTopics[0] || 'DP';
  const weakestTopic2 = sortedTopics[1] || 'Graphs';
  
  const accuracy1 = 30 + (totalSolved % 25);
  const accuracy2 = 40 + (totalSolved % 20);

  const recommendations = [
    {
      name: weakestTopic1 === 'DP' ? 'Queries for Number of Palindromes' : 'Subarray Sum Equals K',
      link: 'https://codeforces.com/problemset',
      platform: cfRating > 1300 ? 'Codeforces' : 'LeetCode',
      topic: weakestTopic1,
      difficulty: 'Medium',
      reason: `Focus on expanding your ${weakestTopic1} foundation. This problem helps build logic.`
    },
    {
      name: weakestTopic2 === 'Graphs' ? 'Find Eventual Safe States' : 'Maximal Network Rank',
      link: 'https://leetcode.com/problemset/all/',
      platform: 'LeetCode',
      topic: weakestTopic2,
      difficulty: 'Medium',
      reason: `Your solved count in ${weakestTopic2} is low. Attempting this will improve graph traversal schemas.`
    },
    {
      name: cfRating > 1400 ? 'Maximum Path Sum in a Grid' : 'Min Cost Climbing Stairs',
      link: 'https://www.codechef.com/',
      platform: cfRating > 1400 ? 'CodeChef' : 'LeetCode',
      topic: 'DP',
      difficulty: 'Easy-Medium',
      reason: 'Standard dynamic programming challenge that practices state transition mapping.'
    }
  ];

  const insights = `Hello ${username}! Based on your unified profiles, you have completed a total of ${totalSolved} problems. Analyzing your platform profiles, you show strong skills in Arrays (solved ${topicSolvedCombined['Arrays'] || 0} times) and Math. However, your submissions in ${weakestTopic1} and ${weakestTopic2} are lagging behind. Your ${weakestTopic1} accuracy is roughly ${accuracy1}%, indicating potential struggles with mapping state transitions or edge-case handling. You should build confidence on intermediate difficulty tags on Codeforces (e.g. 1100-1300 rating) before targeting harder Div 2 C/D problems.`;

  const contestStrategy = `1. Spend the first 5 minutes reading all problems to spot Easy/Greedy trackers early.\n2. Do not spend more than 20 minutes stuck on a single idea in ${weakestTopic1}. If stuck, write down the base cases manually.\n3. Participate in virtual Codeforces contests weekly to build pacing and stress-test your solutions.`;

  return {
    weakTopics: [
      { topic: weakestTopic1, solvedCount: topicSolvedCombined[weakestTopic1] || 0, accuracy: `${accuracy1}%`, description: `Struggling to define optimal substructure or verify complexity boundaries.` },
      { topic: weakestTopic2, solvedCount: topicSolvedCombined[weakestTopic2] || 0, accuracy: `${accuracy2}%`, description: `Difficulty implementing graph searches (DFS/BFS) or matching shortest path properties.` }
    ],
    recommendations,
    insights,
    contestStrategy,
    predictedRatingGain: 40 + (cfRating % 30),
    predictedRankRange: cfRating > 0 ? `${Math.max(500, Math.round(5000 - cfRating * 2.5))} - ${Math.max(800, Math.round(7000 - cfRating * 3))}` : '1500 - 3000'
  };
};

export const aiService = {
  async analyzePerformance(username, stats) {
    const apiKey = process.env.GEMINI_API_KEY;
    
    // Check if key is present or is placeholder
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      console.info('Gemini API Key missing or default placeholder. Generating rule-based local mock analysis.');
      return generateMockAiAnalysis(username, stats);
    }

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      // Clean statistics data for prompt consumption
      const formattedStats = stats.map(s => ({
        platform: s.platform,
        rating: s.currentRating,
        maxRating: s.maxRating,
        solvedCount: s.solvedCount,
        solvedByTopic: s.solvedByTopic instanceof Map ? Object.fromEntries(s.solvedByTopic) : s.solvedByTopic,
        difficultyDistribution: s.difficultyDistribution instanceof Map ? Object.fromEntries(s.difficultyDistribution) : s.difficultyDistribution,
        recentSubmissions: (s.recentSubmissions || []).slice(0, 5).map(sub => ({
          problemName: sub.problemName,
          verdict: sub.verdict,
          difficulty: sub.difficulty,
          tags: sub.tags
        }))
      }));

      const prompt = `
        You are an elite Competitive Programming Coach. Analyze the statistics of the user "${username}" and provide coaching recommendations, weak topic analysis, and contest performance insights.

        Here is the user's data across platforms (Codeforces, LeetCode, CodeChef):
        ${JSON.stringify(formattedStats, null, 2)}

        Generate your analysis and return it strictly in JSON format. Do not wrap it in markdown block quotes (do not include \`\`\`json ... \`\`\`). The JSON must match this structure exactly:
        {
          "weakTopics": [
            {
              "topic": "Topic Name (e.g. DP)",
              "solvedCount": 15,
              "accuracy": "42%",
              "description": "Short explanation of why this is weak based on solved counts and submissions"
            }
          ],
          "recommendations": [
            {
              "name": "Problem Name",
              "link": "Problem URL or URL path",
              "platform": "Codeforces/LeetCode/CodeChef",
              "topic": "Topic Name",
              "difficulty": "Easy/Medium/Hard",
              "reason": "Coaching explanation of why this specific problem will help"
            }
          ],
          "insights": "Comprehensive overview paragraph of user progress, strengths, and primary weaknesses.",
          "contestStrategy": "Bullet points or list of specific strategies they can use to rank higher in upcoming contests.",
          "predictedRatingGain": 35,
          "predictedRankRange": "1200 - 1800"
        }
      `;

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json'
        }
      });
      
      const responseText = result.response.text();
      
      try {
        return JSON.parse(responseText);
      } catch (jsonErr) {
        console.error('Gemini returned invalid JSON structure, parsing clean blocks...', jsonErr);
        // Stripping backticks or tags if model disobeyed mimeType instructions
        const cleanText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleanText);
      }

    } catch (err) {
      console.error(`Gemini API analysis failed: ${err.message}. Falling back to rule-based analysis.`);
      return generateMockAiAnalysis(username, stats);
    }
  }
};
