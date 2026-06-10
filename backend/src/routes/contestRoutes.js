import express from 'express';
import axios from 'axios';

const router = express.Router();

// Duration helper functions
const formatDurationMs = (durationMs) => {
  const hours = durationMs / 3600000;
  return Number.isInteger(hours) ? `${hours} hrs` : `${hours.toFixed(1)} hrs`;
};

const formatDurationSec = (durationSec) => {
  const hours = durationSec / 3600;
  return Number.isInteger(hours) ? `${hours} hrs` : `${hours.toFixed(1)} hrs`;
};

const formatDurationMin = (durationMin) => {
  const hours = durationMin / 60;
  return Number.isInteger(hours) ? `${hours} hrs` : `${hours.toFixed(1)} hrs`;
};

// Generate regular LeetCode Weekly and Biweekly contests dynamically as a fallback
const getLeetCodeContests = () => {
  const contests = [];
  const now = Date.now();
  const msInWeek = 7 * 24 * 60 * 60 * 1000;
  
  // Weekly Contest Reference: Weekly Contest 506 was on 2026-06-14T02:30:00Z
  const refWeeklyDate = new Date('2026-06-14T02:30:00Z').getTime();
  const refWeeklyNum = 506;
  
  // Biweekly Contest Reference: Biweekly Contest 186 was on 2026-06-20T14:30:00Z
  const refBiweeklyDate = new Date('2026-06-20T14:30:00Z').getTime();
  const refBiweeklyNum = 186;
  
  // Generate Weekly Contests (from 2 weeks ago up to 5 weeks ahead)
  for (let w = -2; w < 5; w++) {
    const time = refWeeklyDate + w * msInWeek;
    const num = refWeeklyNum + w;
    // Keep it if it is in the future or was very recent (ended within last 2 hours)
    if (time + 5400000 > now) {
      contests.push({
        id: `leetcode-weekly-${num}`,
        name: `LeetCode Weekly Contest ${num}`,
        platform: 'LeetCode',
        startTime: new Date(time),
        duration: '1.5 hrs',
        link: `https://leetcode.com/contest/weekly-contest-${num}`
      });
    }
  }
  
  // Generate Biweekly Contests (from 2 weeks ago up to 5 weeks ahead)
  for (let b = -2; b < 5; b++) {
    const time = refBiweeklyDate + b * 2 * msInWeek;
    const num = refBiweeklyNum + b;
    if (time + 5400000 > now) {
      contests.push({
        id: `leetcode-biweekly-${num}`,
        name: `LeetCode Biweekly Contest ${num}`,
        platform: 'LeetCode',
        startTime: new Date(time),
        duration: '1.5 hrs',
        link: `https://leetcode.com/contest/biweekly-contest-${num}`
      });
    }
  }
  
  return contests;
};

// GET /api/contests/upcoming
router.get('/upcoming', async (req, res) => {
  try {
    // 1. Try CompeteAPI first
    try {
      const response = await axios.get('https://competeapi.vercel.app/contests/upcoming/', { timeout: 5000 });
      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        const mapped = response.data
          .map(c => {
            let platform = '';
            const siteStr = String(c.site).toLowerCase();
            if (siteStr.includes('codeforces')) platform = 'Codeforces';
            else if (siteStr.includes('codechef')) platform = 'CodeChef';
            else if (siteStr.includes('leetcode')) platform = 'LeetCode';
            else return null;
            
            // Format link
            let link = c.url || '#';
            if (platform === 'Codeforces' && (link === '#' || link === '')) {
              link = 'https://codeforces.com/contests';
            }
            if (platform === 'CodeChef' && (link === '#' || link === '')) {
              link = 'https://www.codechef.com/contests';
            }
            if (platform === 'LeetCode' && (link === '#' || link === '')) {
              link = 'https://leetcode.com/contest/';
            }

            // LeetCode durations from CompeteAPI are inaccurate — always use 1.5 hrs
            const duration = platform === 'LeetCode' ? '1.5 hrs' : formatDurationMs(c.duration);

            return {
              id: c.site + '-' + c.startTime,
              name: c.title,
              platform,
              startTime: new Date(c.startTime),
              duration,
              link
            };
          })
          .filter(Boolean);
          
        if (mapped.length > 0) {
          mapped.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
          return res.json(mapped);
        }
      }
    } catch (apiError) {
      console.warn('[Contests Proxy] CompeteAPI failed, falling back to official source APIs:', apiError.message);
    }

    // 2. Fallback: Fetch directly from source APIs
    console.log('[Contests Proxy] Fetching directly from Codeforces and CodeChef endpoints...');
    const contests = [];
    
    // A. Codeforces Fallback
    try {
      const cfRes = await axios.get('https://codeforces.com/api/contest.list?gym=false', { timeout: 4000 });
      if (cfRes.data && cfRes.data.status === 'OK') {
        const cfContests = cfRes.data.result
          .filter(c => c.phase === 'BEFORE')
          .map(c => ({
            id: `cf-${c.id}`,
            name: c.name,
            platform: 'Codeforces',
            startTime: new Date(c.startTimeSeconds * 1000),
            duration: formatDurationSec(c.durationSeconds),
            link: `https://codeforces.com/contest/${c.id}`
          }));
        contests.push(...cfContests);
      }
    } catch (cfError) {
      console.warn('[Contests Proxy] Codeforces API fallback failed:', cfError.message);
    }

    // B. CodeChef Fallback
    try {
      const ccRes = await axios.get('https://www.codechef.com/api/list/contests/all?type=upcoming', { timeout: 4000 });
      if (ccRes.data && ccRes.data.status === 'success') {
        const ccContests = (ccRes.data.future_contests || []).map(c => ({
          id: `cc-${c.contest_code}`,
          name: c.contest_name,
          platform: 'CodeChef',
          startTime: new Date(c.contest_start_date_iso),
          duration: formatDurationMin(parseInt(c.contest_duration) || 180),
          link: `https://www.codechef.com/${c.contest_code}`
        }));
        contests.push(...ccContests);
      }
    } catch (ccError) {
      console.warn('[Contests Proxy] CodeChef API fallback failed:', ccError.message);
    }

    // C. LeetCode Fallback (Generates schedule algorithmically)
    try {
      const lcContests = getLeetCodeContests();
      contests.push(...lcContests);
    } catch (lcError) {
      console.warn('[Contests Proxy] LeetCode generation fallback failed:', lcError.message);
    }

    // Sort chronologically
    contests.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

    res.json(contests);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch contest schedules', details: err.message });
  }
});

export default router;
