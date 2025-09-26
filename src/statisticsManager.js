/**
 * Statistics Manager for Flashcard Deutscher
 * 
 * This module handles all analytics data collection, calculation, and persistence
 * for the flashcard learning system. It tracks daily progress, learning streaks,
 * accuracy metrics, and provides data for visualization charts.
 * 
 * Features:
 * - Daily study session tracking
 * - Learning streak calculation
 * - Progress analytics and insights
 * - Data export functionality
 * - Automatic data migration
 */

// Get today's date in YYYY-MM-DD format for consistent date keys
const getTodayKey = () => {
  return new Date().toISOString().split('T')[0];
};

// Initialize or get learning statistics from localStorage
export const getStatistics = () => {
  const stats = localStorage.getItem('learning-stats');
  if (!stats) {
    const initialStats = {
      dailyStats: {},
      streaks: {
        current: 0,
        longest: 0,
        lastStudyDate: null
      },
      totalStats: {
        wordsLearned: 0,
        totalStudyTime: 0,
        averageAccuracy: 0,
        totalSessions: 0,
        totalCorrectAnswers: 0,
        totalWrongAnswers: 0
      }
    };
    localStorage.setItem('learning-stats', JSON.stringify(initialStats));
    return initialStats;
  }
  return JSON.parse(stats);
};

// Save statistics to localStorage
export const saveStatistics = (stats) => {
  localStorage.setItem('learning-stats', JSON.stringify(stats));
};

/**
 * Record a completed study session with performance metrics
 * @param {number} wordsStudied - Number of words reviewed in this session
 * @param {number} timeSpent - Session duration in seconds
 * @param {number} correctAnswers - Number of correct responses
 * @param {number} wrongAnswers - Number of incorrect responses
 * @returns {Object} Updated statistics object
 */
export const recordStudySession = (wordsStudied, timeSpent, correctAnswers, wrongAnswers) => {
  const stats = getStatistics();
  const today = getTodayKey();
  
  // Initialize today's stats if not exists
  if (!stats.dailyStats[today]) {
    stats.dailyStats[today] = {
      wordsStudied: 0,
      timeSpent: 0,
      correctAnswers: 0,
      wrongAnswers: 0,
      newWordsLearned: 0,
      sessionsCompleted: 0
    };
  }
  
  // Update daily stats
  stats.dailyStats[today].wordsStudied += wordsStudied;
  stats.dailyStats[today].timeSpent += timeSpent;
  stats.dailyStats[today].correctAnswers += correctAnswers;
  stats.dailyStats[today].wrongAnswers += wrongAnswers;
  stats.dailyStats[today].sessionsCompleted += 1;
  
  // Update total stats
  stats.totalStats.totalStudyTime += timeSpent;
  stats.totalStats.totalSessions += 1;
  stats.totalStats.totalCorrectAnswers += correctAnswers;
  stats.totalStats.totalWrongAnswers += wrongAnswers;
  
  // Calculate accuracy
  const totalAnswers = stats.totalStats.totalCorrectAnswers + stats.totalStats.totalWrongAnswers;
  stats.totalStats.averageAccuracy = totalAnswers > 0 
    ? (stats.totalStats.totalCorrectAnswers / totalAnswers) * 100 
    : 0;
  
  // Update streaks
  updateStreaks(stats, today);
  
  saveStatistics(stats);
  return stats;
};

/**
 * Update learning streaks based on study consistency
 * Calculates current and longest streaks automatically
 * @param {Object} stats - Current statistics object to update
 * @param {string} today - Today's date key (YYYY-MM-DD)
 */
const updateStreaks = (stats, today) => {
  const lastStudyDate = stats.streaks.lastStudyDate;
  
  if (!lastStudyDate) {
    // First time studying
    stats.streaks.current = 1;
    stats.streaks.longest = 1;
    stats.streaks.lastStudyDate = today;
  } else {
    const lastDate = new Date(lastStudyDate);
    const currentDate = new Date(today);
    const diffTime = Math.abs(currentDate - lastDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      // Consecutive day
      stats.streaks.current += 1;
      stats.streaks.longest = Math.max(stats.streaks.longest, stats.streaks.current);
    } else if (diffDays > 1) {
      // Streak broken
      stats.streaks.current = 1;
    }
    // If diffDays === 0, it's the same day, don't change streak
    
    stats.streaks.lastStudyDate = today;
  }
};

// Record when a new word is learned
export const recordNewWordLearned = () => {
  const stats = getStatistics();
  const today = getTodayKey();
  
  if (!stats.dailyStats[today]) {
    stats.dailyStats[today] = {
      wordsStudied: 0,
      timeSpent: 0,
      correctAnswers: 0,
      wrongAnswers: 0,
      newWordsLearned: 0,
      sessionsCompleted: 0
    };
  }
  
  stats.dailyStats[today].newWordsLearned += 1;
  stats.totalStats.wordsLearned += 1;
  
  saveStatistics(stats);
  return stats;
};

/**
 * Get chart-ready data for the specified number of days
 * Includes study metrics, time spent, and accuracy calculations
 * @param {number} days - Number of days to include (default: 7)
 * @returns {Array} Array of daily data objects for chart visualization
 */
export const getChartData = (days = 7) => {
  const stats = getStatistics();
  const chartData = [];
  const today = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateKey = date.toISOString().split('T')[0];
    
    const dayStats = stats.dailyStats[dateKey] || {
      wordsStudied: 0,
      timeSpent: 0,
      correctAnswers: 0,
      wrongAnswers: 0,
      newWordsLearned: 0
    };
    
    chartData.push({
      date: dateKey,
      shortDate: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      wordsStudied: dayStats.wordsStudied,
      timeSpent: Math.round(dayStats.timeSpent / 60), // Convert to minutes
      correctAnswers: dayStats.correctAnswers,
      wrongAnswers: dayStats.wrongAnswers,
      accuracy: dayStats.correctAnswers + dayStats.wrongAnswers > 0 
        ? Math.round((dayStats.correctAnswers / (dayStats.correctAnswers + dayStats.wrongAnswers)) * 100)
        : 0,
      newWordsLearned: dayStats.newWordsLearned
    });
  }
  
  return chartData;
};

// Get difficult words analysis
export const getDifficultWords = (words) => {
  return words
    .filter(word => word.mistakeCount > 0)
    .sort((a, b) => (b.mistakeCount || 0) - (a.mistakeCount || 0))
    .slice(0, 5)
    .map(word => ({
      word: word.word,
      meaning: word.meaning,
      mistakes: word.mistakeCount || 0,
      accuracy: word.totalReviews > 0 
        ? Math.round(((word.totalReviews - word.mistakeCount) / word.totalReviews) * 100)
        : 0
    }));
};

// Format time in minutes and seconds
export const formatTime = (seconds) => {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
};

// Export progress data
export const exportProgressData = (words) => {
  const stats = getStatistics();
  return JSON.stringify({
    words: words,
    stats: stats,
    exportDate: new Date().toISOString(),
    version: '1.0'
  }, null, 2);
};

// Reset all statistics (for testing purposes)
export const resetStatistics = () => {
  localStorage.removeItem('learning-stats');
  return getStatistics();
};
