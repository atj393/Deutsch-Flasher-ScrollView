/**
 * SRS (Spaced Repetition System) Algorithm Implementation - Flashcard Deutscher
 * Based on the SuperMemo SM-2 algorithm used in Anki
 * 
 * This module provides intelligent spaced repetition functionality for optimal
 * German language learning retention and scheduling.
 */

/**
 * Calculate the next interval for a card based on the quality of response
 * @param {number} quality - Response quality (0=Hard/Thumbs Down, 1=Okay/Neutral, 2=Learned/Thumbs Up)
 * @param {number} currentInterval - Current interval in days
 * @param {number} easeFactor - Current ease factor (1.3-2.5)
 * @param {number} consecutiveCorrect - Number of consecutive correct answers
 * @returns {object} - {interval, easeFactor, consecutiveCorrect}
 */
export const calculateNextInterval = (quality, currentInterval, easeFactor, consecutiveCorrect) => {
  let newInterval = currentInterval;
  let newEaseFactor = easeFactor;
  let newConsecutiveCorrect = consecutiveCorrect;

  // Update ease factor based on quality
  if (quality === 0) {
    // Hard/Thumbs Down - decrease ease factor
    newEaseFactor = Math.max(1.3, easeFactor - 0.2);
  } else if (quality === 1) {
    // Okay/Neutral - slight decrease in ease factor
    newEaseFactor = Math.max(1.3, easeFactor - 0.05);
  } else {
    // Learned/Thumbs Up - increase ease factor
    newEaseFactor = Math.min(2.5, easeFactor + 0.1);
  }

  if (quality === 0) {
    // Hard/Failed recall - reset progress
    newConsecutiveCorrect = 0;
    newInterval = 1; // Reset to 1 day
  } else {
    // Successful recall (Okay or Learned)
    newConsecutiveCorrect += 1;
    
    if (newConsecutiveCorrect === 1) {
      newInterval = 1;
    } else if (newConsecutiveCorrect === 2) {
      newInterval = 6;
    } else {
      // For subsequent reviews, multiply by ease factor
      if (quality === 2) {
        // Learned/Thumbs Up - increase interval more
        newInterval = Math.round(currentInterval * newEaseFactor * 1.3);
      } else {
        // Okay/Neutral - normal interval increase
        newInterval = Math.round(currentInterval * newEaseFactor);
      }
    }
  }

  // Ensure minimum interval of 1 day
  newInterval = Math.max(1, newInterval);

  return {
    interval: newInterval,
    easeFactor: newEaseFactor,
    consecutiveCorrect: newConsecutiveCorrect
  };
};

/**
 * Calculate the next review date based on interval
 * @param {number} interval - Interval in days
 * @returns {string} - ISO date string for next review
 */
export const calculateNextReviewDate = (interval) => {
  // Validate input
  if (typeof interval !== 'number' || isNaN(interval) || interval < 0) {
    console.warn('Invalid interval provided to calculateNextReviewDate:', interval);
    interval = 1; // Default to 1 day
  }
  
  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + Math.round(interval));
  
  // Validate the resulting date
  if (isNaN(nextReview.getTime())) {
    console.warn('Invalid date created in calculateNextReviewDate');
    return new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 1 day from now
  }
  
  return nextReview.toISOString();
};

/**
 * Check if a card is due for review
 * @param {string} nextReviewDate - ISO date string
 * @returns {boolean} - True if card is due
 */
export const isCardDue = (nextReviewDate) => {
  if (!nextReviewDate) return true;
  const now = new Date();
  const reviewDate = new Date(nextReviewDate);
  return now >= reviewDate;
};

/**
 * Get cards that are due for review (only cards that have been studied before)
 * @param {Array} words - Array of word objects
 * @returns {Array} - Array of due words with their indices
 */
export const getDueCards = (words) => {
  return words
    .map((word, index) => ({ ...word, originalIndex: index }))
    .filter(word => {
      // Only include cards that have been studied at least once and are due
      return word.totalReviews > 0 && isCardDue(word.nextReview);
    })
    .sort((a, b) => {
      // Sort by next review date (oldest first)
      if (!a.nextReview && !b.nextReview) return 0;
      if (!a.nextReview) return -1;
      if (!b.nextReview) return 1;
      return new Date(a.nextReview) - new Date(b.nextReview);
    });
};

/**
 * Get statistics about card distribution
 * @param {Array} words - Array of word objects
 * @returns {object} - Statistics object
 */
export const getCardStats = (words) => {
  const stats = {
    total: words.length,
    new: 0,
    learning: 0,
    learned: 0,
    review: 0,
    due: 0,
    mature: 0 // Cards with interval >= 21 days
  };

  words.forEach(word => {
    // Count based on actual status field
    if (word.status === 'learning') {
      stats.learning++;
    } else if (word.status === 'learned') {
      stats.learned++;
    } else if (word.status === 'review') {
      stats.review++;
    } else {
      // Default or unknown status
      stats.new++;
    }

    // Count mature cards (learned with long intervals)
    if (word.status === 'learned' && word.interval >= 21) {
      stats.mature++;
    }

    // Only count cards as due if they have been studied before
    if (word.totalReviews > 0 && isCardDue(word.nextReview)) {
      stats.due++;
    }
  });

  return stats;
};

/**
 * Quality descriptions for UI
 */
export const QUALITY_DESCRIPTIONS = {
  0: { label: 'Hard', description: 'Difficult or incorrect', color: '#e74c3c' },
  1: { label: 'Okay', description: 'Correct with effort', color: '#f39c12' },
  2: { label: 'Learned', description: 'Easy and confident', color: '#27ae60' }
};

/**
 * Convert old format cards to new SRS format
 * @param {Array} words - Array of old format words
 * @returns {Array} - Array of new format words with SRS fields
 */
export const migrateWordsToSRS = (words) => {
  return words.map(word => {
    // If already has SRS fields, return as is but ensure new properties exist
    if (word.hasOwnProperty('nextReview')) {
      return {
        ...word,
        article: word.article || "", // Add article if missing
        type: word.type || "verb" // Add default type if missing
      };
    }

    // Convert old status to SRS format
    let interval = 1;
    let easeFactor = 2.5;
    let consecutiveCorrect = 0;
    let nextReview = null;

    if (word.status === 'learning') {
      consecutiveCorrect = 1;
      interval = 1;
      nextReview = calculateNextReviewDate(interval);
    } else if (word.status === 'learned') {
      consecutiveCorrect = 3;
      interval = 21;
      nextReview = calculateNextReviewDate(interval);
    }

    return {
      ...word,
      id: word.id || `word-${Math.random().toString(36).substr(2, 9)}`,
      article: word.article || "", // Add article property
      type: word.type || "verb", // Add type property with default
      nextReview,
      interval,
      easeFactor,
      consecutiveCorrect,
      createdDate: new Date().toISOString(),
      lastReviewed: null,
      totalReviews: word.count || 0,
      mistakeCount: 0
    };
  });
};
