import { apiService } from './src/services/apiService.js';

async function testCF() {
  console.log('Testing Codeforces API Fetcher for handle "tourist"...');
  try {
    const data = await apiService.fetchCodeforces('tourist');
    console.log('Codeforces Fetch Result Status: SUCCESS');
    console.log(`Rating: ${data.currentRating} (Max: ${data.maxRating})`);
    console.log(`Problems Solved (cached count): ${data.solvedCount}`);
    console.log(`Topics count: ${Object.keys(data.solvedByTopic || {}).length}`);
    console.log(`Recent Submissions: ${data.recentSubmissions?.length || 0}`);
  } catch (error) {
    console.error('Codeforces Test FAILED:', error.message);
  }
}

async function testLC() {
  console.log('\nTesting LeetCode API Fetcher for handle "neal_wu"...');
  try {
    const data = await apiService.fetchLeetCode('neal_wu');
    console.log('LeetCode Fetch Result Status: SUCCESS');
    console.log(`Solved Count: ${data.solvedCount}`);
    console.log(`Difficulty distribution:`, data.difficultyDistribution);
  } catch (error) {
    console.error('LeetCode Test FAILED:', error.message);
  }
}

async function testCC() {
  console.log('\nTesting CodeChef Scraper for handle "genghis_khan"...');
  try {
    const data = await apiService.fetchCodeChef('genghis_khan');
    console.log('CodeChef Fetch Result Status: SUCCESS');
    console.log(`Current Rating: ${data.currentRating}`);
    console.log(`Solved Count: ${data.solvedCount}`);
  } catch (error) {
    console.error('CodeChef Test FAILED:', error.message);
  }
}

async function runAll() {
  await testCF();
  await testLC();
  await testCC();
  console.log('\nTesting complete.');
}

runAll();
