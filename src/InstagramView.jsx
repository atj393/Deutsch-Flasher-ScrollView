// src/InstagramView.jsx
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { v4 as uuidv4 } from "uuid";
import {
  calculateNextInterval,
  calculateNextReviewDate,
} from "./srsAlgorithm";
import './InstagramView.css';
import './components/BrowsePage.css';
import BurgerMenu from './components/BurgerMenu';
import SearchButton from './components/SearchButton';
import SettingsPanel from './components/SettingsPanel';
import BrowsePage from './components/BrowsePage';
import FullScreenCard from './components/FullScreenCard';
import initialWordsData from "./data/initialWords.json";

const InstagramView = () => {
  // Create initial words once per session using useMemo to prevent recreation
  const initialWords = useMemo(() => {
    console.log("Loading initial words data - this should only happen once per session");
    return initialWordsData.map((wordData) => ({
      id: uuidv4(),
      word: wordData.word,
      article: wordData.article || "",
      type: wordData.type,
      sentence: wordData.sentence,
      meaning: wordData.meaning,
      sentenceMeaning: wordData.sentenceMeaning,
      count: 0,
      status: null, // No default status - assigned when first rated
      // SRS fields
      nextReview: null,
      interval: 1,
      easeFactor: 2.5,
      consecutiveCorrect: 0,
      createdDate: new Date().toISOString(),
      lastReviewed: null,
      totalReviews: 0,
      mistakeCount: 0,
    }));
  }, []); // Empty dependency array ensures this only runs once per component mount

  // Function to get fresh copy of initial words (for resets)
  const createInitialWords = useCallback(() => {
    console.log("Creating fresh copy of initial words");
    return initialWords.map(word => ({ ...word, id: uuidv4() }));
  }, [initialWords]);

  // Core application state
  const [words, setWords] = useState([]);
  // eslint-disable-next-line no-unused-vars
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  // eslint-disable-next-line no-unused-vars
  const [isFlipped, setIsFlipped] = useState(false);
  const [studyMode, setStudyMode] = useState(() => {
    // Load study mode from localStorage or default to "random"
    const savedStudyMode = localStorage.getItem("studyMode");
    return savedStudyMode || "random";
  });
  const [stats, setStats] = useState({});
  const [theme, setTheme] = useState("light");
  const [filteredWords, setFilteredWords] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy] = useState("alphabetical"); // eslint-disable-line no-unused-vars
  // eslint-disable-next-line no-unused-vars
  const [sessionStartTime, setSessionStartTime] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [sessionStats, setSessionStats] = useState({
    wordsStudied: 0,
    correctAnswers: 0,
    wrongAnswers: 0,
  });

  // Prevent double-click ratings
  const lastRatingTime = useRef(0);
  
  // Load and migrate data from localStorage on startup
  useEffect(() => {
    const savedData = localStorage.getItem("flashcards");
    let loadedWords;

    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);

        // Check if saved data has the correct number of words and all required properties
        const hasCorrectCount = parsedData.length === initialWordsData.length;
        const hasRequiredProperties = parsedData.every(
          (word) =>
            word.hasOwnProperty("article") && word.hasOwnProperty("type")
        );

        if (hasCorrectCount && hasRequiredProperties) {
          loadedWords = parsedData;
          
          // Migrate existing data: convert any cards with default 'learning' status to null
          loadedWords = loadedWords.map(word => {
            if (word.status === 'learning' && word.totalReviews === 0) {
              return { ...word, status: null };
            }
            return word;
          });
          
          setWords(loadedWords);
        } else {
          console.log("Data structure mismatch, loading fresh data");
          setWords(createInitialWords());
        }
      } catch (error) {
        console.error("Error parsing saved data:", error);
        setWords(createInitialWords());
      }
    } else {
      setWords(createInitialWords());
    }
  }, [createInitialWords]);

  // Save to localStorage whenever words change
  useEffect(() => {
    if (words.length > 0) {
      localStorage.setItem("flashcards", JSON.stringify(words));
    }
  }, [words]);

  // Save study mode to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("studyMode", studyMode);
  }, [studyMode]);

  // Filter words based on study mode
  useEffect(() => {
    if (words.length === 0) return;

    let filtered = [...words];

    if (studyMode === "random") {
      // Smart SRS-based Random Mode
      const today = new Date();
      
      // Categorize cards by SRS priority
      const overdueCards = words.filter(word => 
        word.nextReview && new Date(word.nextReview) < today && word.totalReviews > 0
      );
      
      const dueCards = words.filter(word => 
        word.nextReview && 
        new Date(word.nextReview).toDateString() === today.toDateString() && 
        word.totalReviews > 0
      );
      
      const newCards = words.filter(word => 
        word.status === null || word.totalReviews === 0
      );
      
      const futureCards = words.filter(word => 
        word.nextReview && new Date(word.nextReview) > today && word.totalReviews > 0
      );
      
      // Prioritize cards with weighted random selection
      const prioritizedCards = [
        ...overdueCards,     // Show ALL overdue cards first
        ...overdueCards,     // Double weight for overdue
        ...dueCards,         // Show due cards
        ...newCards,         // Mix in new cards
        ...futureCards.slice(0, Math.ceil(futureCards.length * 0.1)) // Only 10% of future cards
      ];
      
      // Shuffle the prioritized list to maintain randomness within priorities
      filtered = prioritizedCards.sort(() => Math.random() - 0.5);
      
      // If no prioritized cards, fall back to all cards
      if (filtered.length === 0) {
        filtered = words.sort(() => Math.random() - 0.5);
      }
      
      // Always ensure we have all cards available in random mode for continuous learning
      // Add any missing cards that weren't included in priorities
      const includedIds = new Set(filtered.map(card => card.id));
      const missingCards = words.filter(word => !includedIds.has(word.id));
      if (missingCards.length > 0) {
        // Add missing cards with lower priority (at the end)
        filtered = [...filtered, ...missingCards.sort(() => Math.random() - 0.5)];
      }
    } else if (studyMode === "new") {
      // New Words: Pure new cards + SRS priority for unrated cards
      const newCards = words.filter((word) => word.status === null || word.totalReviews === 0);
      
      // Sort new cards by creation date (oldest first) to ensure systematic learning
      filtered = newCards.sort((a, b) => {
        const dateA = new Date(a.createdDate || 0);
        const dateB = new Date(b.createdDate || 0);
        return dateA - dateB;
      });
      
    } else if (studyMode === "learning") {
      // Viewed Words: SRS-smart ordering for cards in learning phase
      const learningCards = words.filter((word) => word.status === "learning");
      
      // Prioritize by SRS schedule and difficulty
      filtered = learningCards.sort((a, b) => {
        const today = new Date();
        
        // Cards due/overdue get highest priority
        const aIsDue = a.nextReview && new Date(a.nextReview) <= today;
        const bIsDue = b.nextReview && new Date(b.nextReview) <= today;
        
        if (aIsDue && !bIsDue) return -1;
        if (!aIsDue && bIsDue) return 1;
        
        // Among due cards, prioritize by how overdue they are
        if (aIsDue && bIsDue) {
          const aOverdue = today - new Date(a.nextReview);
          const bOverdue = today - new Date(b.nextReview);
          return bOverdue - aOverdue; // More overdue first
        }
        
        // For non-due cards, prioritize by difficulty (lower ease factor = harder = higher priority)
        const aEase = a.easeFactor || 2.5;
        const bEase = b.easeFactor || 2.5;
        return aEase - bEase; // Lower ease factor (harder) first
      });
      
    } else if (studyMode === "review") {
      // Difficult Words: SRS-smart ordering for review cards
      const reviewCards = words.filter((word) => word.status === "review");
      
      // Prioritize difficult cards by SRS metrics
      filtered = reviewCards.sort((a, b) => {
        const today = new Date();
        
        // Overdue difficult cards get absolute priority
        const aIsDue = a.nextReview && new Date(a.nextReview) <= today;
        const bIsDue = b.nextReview && new Date(b.nextReview) <= today;
        
        if (aIsDue && !bIsDue) return -1;
        if (!aIsDue && bIsDue) return 1;
        
        // Among due cards, sort by difficulty metrics
        if (aIsDue && bIsDue) {
          // More mistakes = higher priority
          const aMistakes = a.mistakeCount || 0;
          const bMistakes = b.mistakeCount || 0;
          if (aMistakes !== bMistakes) return bMistakes - aMistakes;
          
          // Lower ease factor = harder = higher priority
          const aEase = a.easeFactor || 2.5;
          const bEase = b.easeFactor || 2.5;
          return aEase - bEase;
        }
        
        // For future cards, still prioritize by difficulty
        const aMistakes = a.mistakeCount || 0;
        const bMistakes = b.mistakeCount || 0;
        if (aMistakes !== bMistakes) return bMistakes - aMistakes;
        
        return (a.easeFactor || 2.5) - (b.easeFactor || 2.5);
      });
      
    } else if (studyMode === "learned") {
      // Learned Words: SRS-based maintenance review
      const learnedCards = words.filter((word) => word.status === "learned");
      
      // Focus on learned cards that need maintenance review
      filtered = learnedCards.sort((a, b) => {
        const today = new Date();
        
        // Due learned cards get priority (maintenance review)
        const aIsDue = a.nextReview && new Date(a.nextReview) <= today;
        const bIsDue = b.nextReview && new Date(b.nextReview) <= today;
        
        if (aIsDue && !bIsDue) return -1;
        if (!aIsDue && bIsDue) return 1;
        
        // Among due cards, prioritize by interval (shorter intervals = need more review)
        if (aIsDue && bIsDue) {
          const aInterval = a.interval || 1;
          const bInterval = b.interval || 1;
          return aInterval - bInterval; // Shorter interval first
        }
        
        // For future cards, show recently learned first (shorter intervals)
        const aInterval = a.interval || 1;
        const bInterval = b.interval || 1;
        return aInterval - bInterval;
      });
    }

    setFilteredWords(filtered);

    // Ensure visible card is still valid after filtering
    if (filtered.length > 0) {
      const currentCardExists = filtered.some(card => card.id === visibleCardId);
      if (!currentCardExists) {
        console.log('⚠️ Current card no longer in filtered list, switching to first available card');
        setVisibleCardId(filtered[0].id);
      }
    }

    // Update stats whenever words or filtering changes
    const today = new Date();
    const newStats = {
      new: words.filter((word) => word.status === null || word.totalReviews === 0).length,
      learning: words.filter((word) => word.status === "learning").length,
      review: words.filter((word) => word.status === "review").length,
      learned: words.filter((word) => word.status === "learned").length,
      due: words.filter((word) => 
        word.nextReview && new Date(word.nextReview) <= today && word.totalReviews > 0
      ).length,
      overdue: words.filter((word) => 
        word.nextReview && new Date(word.nextReview) < today && word.totalReviews > 0
      ).length,
    };
    setStats(newStats);
  }, [searchTerm, words, studyMode, sortBy]);

  // Load theme from localStorage on startup
  useEffect(() => {
    const savedTheme = localStorage.getItem("flashcard-theme");
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  // Track which card is currently visible
  const [visibleCardId, setVisibleCardId] = useState(null);
  // Settings panel state
  const [isSettingsPanelOpen, setIsSettingsPanelOpen] = useState(false);
  // Browse page state
  const [isBrowsePageOpen, setIsBrowsePageOpen] = useState(false);
  // Track flipped state for each card separately
  const [flippedCards, setFlippedCards] = useState(new Set());
  // Track which cards have already been marked as viewed to prevent duplicates
  const [viewedCardIds, setViewedCardIds] = useState(new Set());
  const observers = useRef(new Map());
  
  // Touch/swipe handling state
  const [touchStart, setTouchStart] = useState({ x: 0, y: 0, time: 0 });
  const [touchEnd, setTouchEnd] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);
  
  // Instagram-style swipe animation state
  const [currentTransform, setCurrentTransform] = useState(0);
  const [isSwipingActive, setIsSwipingActive] = useState(false);
  const [nextCardId, setNextCardId] = useState(null);
  const [swipeDirection, setSwipeDirection] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const animationTimeoutRef = useRef(null);
  
  // Prevent body scrolling when settings panel is open
  useEffect(() => {
    if (isSettingsPanelOpen) {
      // Add class to prevent body scrolling
      document.body.classList.add('settings-open');
      // Store original overflow style
      const originalStyle = document.body.style.overflow;
      
      return () => {
        // Clean up when component unmounts or settings close
        document.body.classList.remove('settings-open');
        document.body.style.overflow = originalStyle;
      };
    } else {
      // Remove class when settings close
      document.body.classList.remove('settings-open');
    }
  }, [isSettingsPanelOpen]);

  // Prevent body scrolling when browse page is open
  useEffect(() => {
    if (isBrowsePageOpen) {
      // Add class to prevent body scrolling
      document.body.classList.add('browse-open');
      // Store original overflow style
      const originalStyle = document.body.style.overflow;
      
      return () => {
        // Clean up when component unmounts or browse page closes
        document.body.classList.remove('browse-open');
        document.body.style.overflow = originalStyle;
      };
    } else {
      // Remove class when browse page closes
      document.body.classList.remove('browse-open');
    }
  }, [isBrowsePageOpen]);
  
  // Mark card as viewed (moves from fresh to in-progress)
  const markCardAsViewed = useCallback((wordId) => {
    setWords(prevWords => 
      prevWords.map(word => {
        if (word.id !== wordId) return word;
        
        // Only update if it's a fresh card (status is null)
        if (word.status === null) {
          console.log('Marking card as viewed:', word.word, 'status: null -> learning');
          return {
            ...word,
            status: "learning", // Move to Viewed state
            lastReviewed: new Date().toISOString(),
          };
        }
        
        return word;
      })
    );
  }, []);

  const updateWordWithSRS = useCallback((wordId, quality, isToggle = false) => {
    setWords(prevWords => 
      prevWords.map(word => {
        if (word.id !== wordId) return word;
        
        // Handle toggle vs normal rating
        let newStatus;
        if (isToggle) {
          // Toggle: reset to learning state
          newStatus = "learning";
          console.log('🔄 Toggle pressed - resetting to learning:', word.word);
        } else {
          // Normal rating: set based on quality
          if (quality === 1) {
            newStatus = "learned"; // Thumbs up = Learned
            console.log('👍 Thumbs up pressed - marking as learned:', word.word);
          } else if (quality === 0) {
            newStatus = "review"; // Thumbs down = Needs Review
            console.log('👎 Thumbs down pressed - marking as difficult:', word.word);
          }
        }

        // Calculate SRS values
        const updatedWord = {
          ...word,
          status: newStatus,
          lastReviewed: new Date().toISOString(),
          totalReviews: (word.totalReviews || 0) + 1,
        };

        if (!isToggle) {
          const currentInterval = word.interval || 1;
          const currentEaseFactor = word.easeFactor || 2.5;
          const currentConsecutiveCorrect = word.consecutiveCorrect || 0;
          
          const srsResult = calculateNextInterval(
            quality, 
            currentInterval, 
            currentEaseFactor, 
            currentConsecutiveCorrect
          );
          
          const nextReview = calculateNextReviewDate(srsResult.interval);
          
          updatedWord.interval = srsResult.interval;
          updatedWord.nextReview = nextReview;
          updatedWord.consecutiveCorrect = srsResult.consecutiveCorrect;
          updatedWord.easeFactor = srsResult.easeFactor;
          
          // Update mistake count
          if (quality < 1) {
            updatedWord.mistakeCount = (word.mistakeCount || 0) + 1;
          }
        }
        
        return updatedWord;
      })
    );
  }, []);

  // Handle quality rating and status setting with toggle support
  const handleQualityOrStatusRating = useCallback(
    (quality) => {
      // Prevent double-clicks within 1000ms
      const now = Date.now();
      if (now - lastRatingTime.current < 1000) {
        console.log('⚠️ Rating blocked - too fast! Time since last:', now - lastRatingTime.current, 'ms');
        return;
      }
      lastRatingTime.current = now;
      console.log('✅ Processing rating:', quality);

      const currentCard = filteredWords.find(card => card.id === visibleCardId) || filteredWords[0];
      if (!currentCard) return;

      updateWordWithSRS(currentCard.id, quality, false);

      // Update session stats for all ratings
      setSessionStats(prev => ({
        ...prev,
        wordsStudied: prev.wordsStudied + 1,
        correctAnswers: prev.correctAnswers + (quality >= 1 ? 1 : 0),
        wrongAnswers: prev.wrongAnswers + (quality < 1 ? 1 : 0),
      }));

      // No auto-navigation - stay on current card
      // The card will update its visual state to show the new rating
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [studyMode, updateWordWithSRS, visibleCardId, filteredWords]
  );

  // Handle toggle functionality - reset card to learning state without navigation
  const handleToggleRating = useCallback(
    (quality) => {
      const currentCard = filteredWords.find(card => card.id === visibleCardId) || filteredWords[0];
      if (!currentCard) return;

      // Check if this is actually a toggle (card is in target state)
      const isActualToggle = 
        (quality === 1 && currentCard.status === 'learned') ||
        (quality === 0 && currentCard.status === 'review');

      if (isActualToggle) {
        // Reset to learning state
        updateWordWithSRS(currentCard.id, quality, true);
        console.log('🔄 Toggling card back to learning state:', currentCard.word);
        // No auto-navigation for toggles
      } else {
        // Not a toggle, treat as normal rating
        handleQualityOrStatusRating(quality);
      }
    },
    [filteredWords, visibleCardId, updateWordWithSRS, handleQualityOrStatusRating]
  );

  // Reset card to new state (no status)
  const resetCardToLearning = useCallback(() => {
    const currentCard = filteredWords.find(card => card.id === visibleCardId) || filteredWords[0];
    if (!currentCard) return;

    setWords(prevWords =>
      prevWords.map(word =>
        word.id === currentCard.id
          ? {
              ...word,
              status: null, // Reset to new/no status
              consecutiveCorrect: 0,
              mistakeCount: 0,
              totalReviews: 0,
              nextReview: null,
              lastReviewed: null,
              easeFactor: 2.5,
              interval: 1,
            }
          : word
      )
    );
  }, [filteredWords, visibleCardId]);

  // Toggle theme between light and dark
  const toggleTheme = useCallback(() => {
    setTheme(prev => {
      const newTheme = prev === "light" ? "dark" : "light";
      localStorage.setItem("flashcard-theme", newTheme);
      return newTheme;
    });
  }, []);

  // Reset data to fresh JSON file data
  const resetData = useCallback(() => {
    const confirmReset = window.confirm(
      "Are you sure you want to reset all progress? This will restore the original word list and clear all your learning progress."
    );
    
    if (confirmReset) {
      setWords(createInitialWords());
      setCurrentCardIndex(0);
      setIsFlipped(false);
      setSearchTerm("");
      localStorage.removeItem("flashcards");
      alert("Data has been reset to the original state.");
    }
  }, [createInitialWords]);

  // Get current card index for navigation
  const getCurrentCardIndex = () => {
    if (!filteredWords.length || !visibleCardId) return -1;
    return filteredWords.findIndex(card => card.id === visibleCardId);
  };

  // Get learning progress (how many cards have been studied at least once)
  const getLearningProgress = () => {
    if (!words.length) return { studied: 0, total: words.length };
    const studiedCards = words.filter(word => word.totalReviews > 0);
    return { 
      studied: studiedCards.length, 
      total: words.length 
    };
  };
  
  // Complete swipe animation after touch ends
  const completeSwipeAnimation = (direction) => {
    if (!nextCardId || !filteredWords.length) return;
    
    const targetCard = filteredWords.find(card => card.id === nextCardId);
    if (!targetCard) return;
    
    // Set final transform positions for smooth completion
    const finalTransform = direction === 'next' ? -window.innerHeight : window.innerHeight;
    setCurrentTransform(finalTransform);
    
    // Switch to the new card after animation completes
    animationTimeoutRef.current = setTimeout(() => {
      setVisibleCardId(nextCardId);
      
      // Update parent component's current card index
      const newIndex = filteredWords.findIndex(card => card.id === nextCardId);
      if (setCurrentCardIndex && newIndex >= 0) {
        setCurrentCardIndex(newIndex);
      }
      
      // Reset flip state for new card
      setFlippedCards(prev => {
        const newSet = new Set(prev);
        newSet.delete(nextCardId);
        return newSet;
      });
      
      // Reset animation state
      setCurrentTransform(0);
      setNextCardId(null);
      setSwipeDirection(null);
      setIsAnimating(false);
      
      console.log('Navigated to card:', targetCard.word);
    }, 350); // Match CSS transition duration
  };
  
  // Snap back to original position if swipe wasn't strong enough
  const snapBackToOriginal = () => {
    setCurrentTransform(0);
    setIsAnimating(true);
    
    // Clean up after snap back animation
    setTimeout(() => {
      setNextCardId(null);
      setSwipeDirection(null);
      setIsAnimating(false);
    }, 350);
  };
  
  // Navigate to specific card (for programmatic navigation)
  const navigateToCard = (index) => {
    if (index >= 0 && index < filteredWords.length && filteredWords[index]) {
      const targetCard = filteredWords[index];
      if (targetCard && targetCard.id) {
        setVisibleCardId(targetCard.id);
        
        if (setCurrentCardIndex) {
          setCurrentCardIndex(index);
        }
        
        setFlippedCards(prev => {
          const newSet = new Set(prev);
          newSet.delete(targetCard.id);
          return newSet;
        });
      }
    }
  };
  
  // Navigate to next card
  const navigateNext = () => {
    const currentIndex = getCurrentCardIndex();
    console.log('navigateNext called - current index:', currentIndex, 'total cards:', filteredWords.length);
    if (currentIndex < filteredWords.length - 1) {
      navigateToCard(currentIndex + 1, 'next');
    } else {
      // Loop back to first card
      navigateToCard(0, 'next');
    }
  };
  
  // Navigate to previous card
  const navigatePrevious = () => {
    const currentIndex = getCurrentCardIndex();
    console.log('navigatePrevious called - current index:', currentIndex, 'total cards:', filteredWords.length);
    if (currentIndex > 0) {
      navigateToCard(currentIndex - 1, 'previous');
    } else {
      // Loop to last card
      navigateToCard(filteredWords.length - 1, 'previous');
    }
  };
  
  // Set initial visible card
  useEffect(() => {
    if (filteredWords.length > 0 && filteredWords[0] && filteredWords[0].id && !visibleCardId) {
      setVisibleCardId(filteredWords[0].id);
    }
  }, [filteredWords, visibleCardId]);

  // Mark card as viewed when it becomes visible (only once per card)
  useEffect(() => {
    if (visibleCardId && markCardAsViewed && !viewedCardIds.has(visibleCardId)) {
      // Find the current card to check its status
      const currentCard = filteredWords.find(card => card.id === visibleCardId);
      
      // Only mark as viewed if it's a fresh card (status is null)
      if (currentCard && currentCard.status === null) {
        console.log('Marking card as viewed for first time:', currentCard.word);
        markCardAsViewed(visibleCardId);
        
        // Add to viewed set to prevent multiple calls
        setViewedCardIds(prev => new Set(prev).add(visibleCardId));
      }
    }
  }, [visibleCardId, markCardAsViewed, filteredWords, viewedCardIds]);
  
  // Prevent body scrolling when component is mounted
  useEffect(() => {
    // Store original styles
    const originalStyle = window.getComputedStyle(document.body);
    const originalOverflow = originalStyle.overflow;
    const originalPosition = originalStyle.position;
    
    // Prevent scrolling
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.height = '100%';
    
    // Cleanup function to restore original styles
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.position = originalPosition;
      document.body.style.width = '';
      document.body.style.height = '';
    };
  }, []);

  // Add non-passive touch event listeners to prevent scrolling
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchStartNonPassive = (e) => {
      // Don't handle touch events when modals are open
      if (isSettingsPanelOpen || isBrowsePageOpen) {
        return;
      }
      
      // Only prevent default for significant swipes, allow taps to work
      const startTime = Date.now();
      setTouchStart({
        x: e.targetTouches[0].clientX,
        y: e.targetTouches[0].clientY,
        time: startTime,
      });
      setTouchEnd({ x: 0, y: 0 });
      setCurrentTransform(0);
      setIsSwipingActive(false); // Don't set to true immediately
    };

    const handleTouchMoveNonPassive = (e) => {
      // Don't handle touch events when modals are open
      if (isSettingsPanelOpen || isBrowsePageOpen) {
        return;
      }
      
      if (!touchStart.x && !touchStart.y) return;
      
      const currentY = e.targetTouches[0].clientY;
      const deltaY = currentY - touchStart.y;
      const absY = Math.abs(deltaY);
      
      // Only start preventing default and swiping if movement is significant
      if (absY > 10) {
        e.preventDefault();
        setIsSwipingActive(true);
        
        // Update real-time transform following finger
        const dampingFactor = 0.7; // Makes swipe feel more controlled
        const transform = deltaY * dampingFactor;
        
        // Limit transform to reasonable bounds
        const maxTransform = window.innerHeight * 0.8;
        const boundedTransform = Math.max(-maxTransform, Math.min(maxTransform, transform));
        
        setCurrentTransform(boundedTransform);
        
        // Prepare next card when swipe is significant
        const absTransform = Math.abs(boundedTransform);
        if (absTransform > 50 && !nextCardId && filteredWords.length > 0) {
          const currentIndex = getCurrentCardIndex();
          
          // Only proceed if we have a valid current index
          if (currentIndex >= 0) {
            let nextIndex;
            let direction;
            
            if (boundedTransform < 0) {
              // Swiping up - next card
              nextIndex = currentIndex < filteredWords.length - 1 ? currentIndex + 1 : 0;
              direction = 'up';
            } else {
              // Swiping down - previous card
              nextIndex = currentIndex > 0 ? currentIndex - 1 : filteredWords.length - 1;
              direction = 'down';
            }
            
            // Ensure the next card exists before trying to access its id
            if (filteredWords[nextIndex] && filteredWords[nextIndex].id) {
              setNextCardId(filteredWords[nextIndex].id);
              setSwipeDirection(direction);
            }
          }
        }
      }
      
      setTouchEnd({
        x: e.targetTouches[0].clientX,
        y: currentY,
      });
    };

    const handleTouchEndNonPassive = () => {
      // Don't handle touch events when modals are open
      if (isSettingsPanelOpen || isBrowsePageOpen) {
        return;
      }
      
      const endTime = Date.now();
      const touchDuration = endTime - (touchStart.time || 0);
      const deltaY = touchEnd.y - touchStart.y;
      const absY = Math.abs(deltaY);
      
      // Check if this was a tap (short duration, minimal movement)
      const isTap = touchDuration < 300 && absY < 10;
      
      if (isTap && !isSwipingActive) {
        // This was a tap - trigger card flip
        console.log('Detected tap - flipping card');
        handleCardFlip();
        setCurrentTransform(0);
        return;
      }
      
      if (!isSwipingActive) return;
      
      setIsSwipingActive(false);
      
      const swipeThreshold = 80; // Minimum distance to trigger navigation
      
      console.log('Touch end - transform:', currentTransform);
      
      if (Math.abs(currentTransform) > swipeThreshold) {
        // Complete the swipe animation
        setIsAnimating(true);
        
        if (currentTransform < 0) {
          // Swiped up - go to next
          console.log('Completing swipe up - navigating to next card');
          completeSwipeAnimation('next');
        } else {
          // Swiped down - go to previous
          console.log('Completing swipe down - navigating to previous card');
          completeSwipeAnimation('previous');
        }
      } else {
        // Snap back to original position
        console.log('Snapping back to original position');
        snapBackToOriginal();
      }
    };

    // Add non-passive event listeners
    container.addEventListener('touchstart', handleTouchStartNonPassive, { passive: false });
    container.addEventListener('touchmove', handleTouchMoveNonPassive, { passive: false });
    container.addEventListener('touchend', handleTouchEndNonPassive, { passive: false });

    return () => {
      container.removeEventListener('touchstart', handleTouchStartNonPassive);
      container.removeEventListener('touchmove', handleTouchMoveNonPassive);
      container.removeEventListener('touchend', handleTouchEndNonPassive);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [touchStart, touchEnd, navigateNext, navigatePrevious]);
  
  // Set up intersection observers for each card
  useEffect(() => {
    // Clean up previous observers
    observers.current.forEach(observer => observer.disconnect());
    observers.current = new Map();
    
    // Create observers for all cards
    const cardElements = document.querySelectorAll('.insta-card-wrapper');
    cardElements.forEach(card => {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting && entry.intersectionRatio > 0.7) {
              const cardId = card.dataset.cardId;
              setVisibleCardId(cardId);
              // Reset flip state when a new card becomes visible
              setIsFlipped(false);
            }
          });
        },
        { threshold: 0.7 } // 70% of card must be visible
      );
      
      observer.observe(card);
      observers.current.set(card.dataset.cardId, observer);
    });
    
    return () => {
      observers.current.forEach(observer => observer.disconnect());
    };
  }, [filteredWords]);

  
  // Handle card flipping for the currently visible card
  const handleCardFlip = () => {
    if (visibleCardId) {
      setFlippedCards(prev => {
        const newSet = new Set(prev);
        if (newSet.has(visibleCardId)) {
          newSet.delete(visibleCardId);
        } else {
          newSet.add(visibleCardId);
        }
        return newSet;
      });
    }
  };
  
  // Touch event handlers are now handled in useEffect with non-passive listeners
  
  // Handle key presses (maintain keyboard shortcuts)
  useEffect(() => {
    const handleKeyPress = (event) => {
      // Close browse page on ESC (priority)
      if (event.key === "Escape" && isBrowsePageOpen) {
        event.preventDefault();
        setIsBrowsePageOpen(false);
        return;
      }

      // Close settings panel on ESC
      if (event.key === "Escape" && isSettingsPanelOpen) {
        event.preventDefault();
        setIsSettingsPanelOpen(false);
        return;
      }

      // Don't handle other shortcuts if any panel is open
      if (isSettingsPanelOpen || isBrowsePageOpen) return;

      // Navigation and interaction key handling
      switch (event.key) {
        case "ArrowLeft":
          event.preventDefault();
          navigatePrevious();
          return;
        case "ArrowRight":
          event.preventDefault();
          navigateNext();
          return;
        case "ArrowUp":
          event.preventDefault();
          handleToggleRating(1); // Learned
          return;
        case "ArrowDown":
          event.preventDefault();
          handleToggleRating(0); // Review
          return;
        case "Shift":
          if (event.location === KeyboardEvent.DOM_KEY_LOCATION_RIGHT) {
            event.preventDefault();
            resetCardToLearning(); 
          }
          return;
        case " ":
          event.preventDefault();
          handleCardFlip();
          return;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleQualityOrStatusRating, resetCardToLearning, handleCardFlip, isSettingsPanelOpen, isBrowsePageOpen, navigateNext, navigatePrevious]);

  // Cleanup animation timeout on unmount
  useEffect(() => {
    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, []);
  
  return (
    <div className={`app ${theme}`}>
      <div 
        ref={containerRef}
        className="instagram-view-container"
      >
      {/* App Title */}
      <div className="app-title">
        <h1>Flashcard Deutscher</h1>
      </div>

      {/* Search Button */}
      <SearchButton 
        onClick={() => setIsBrowsePageOpen(true)}
      />

      {/* Burger Menu Button */}
      <BurgerMenu 
        isOpen={isSettingsPanelOpen}
        onClick={() => setIsSettingsPanelOpen(!isSettingsPanelOpen)}
      />

      {/* Browse Page */}
      <BrowsePage
        isOpen={isBrowsePageOpen}
        onClose={() => setIsBrowsePageOpen(false)}
        words={words}
        theme={theme}
      />

      {/* Settings Panel */}
      <SettingsPanel
        isOpen={isSettingsPanelOpen}
        onClose={() => setIsSettingsPanelOpen(false)}
        studyMode={studyMode}
        setStudyMode={setStudyMode}
        theme={theme}
        toggleTheme={toggleTheme}
        stats={stats}
        resetData={resetData}
        setIsFlipped={setIsFlipped}
        setCurrentCardIndex={setCurrentCardIndex}
        setSessionStartTime={setSessionStartTime}
        setSessionStats={setSessionStats}
      />
      
      {/* Current Card with Real-time Transform */}
      {(() => {
        const activeCard = filteredWords.find(card => card.id === visibleCardId);
        if (!activeCard) return null;
        
        const cardStyle = {
          transform: `translateY(${currentTransform}px)`,
        };
        
        let cardClass = 'insta-card-wrapper active';
        if (isSwipingActive) {
          cardClass += ' swiping';
        } else if (isAnimating) {
          cardClass += ' animating';
        }
        
        return (
          <div 
            key={activeCard.id} 
            className={cardClass}
            style={cardStyle}
            data-card-id={activeCard.id}
          >
            <FullScreenCard
              card={activeCard}
              isFlipped={flippedCards.has(activeCard.id)}
              isVisible={true}
              onFlip={handleCardFlip}
              onRate={handleToggleRating}
              onReset={resetCardToLearning}
            />
          </div>
        );
      })()}
      
      {/* Next Card for Instagram-style Overlap */}
      {nextCardId && (() => {
        const nextCard = filteredWords.find(card => card.id === nextCardId);
        if (!nextCard) return null;
        
        // Position next card based on swipe direction
        let nextCardTransform = 0;
        let nextCardClass = 'insta-card-wrapper';
        
        if (swipeDirection === 'up') {
          nextCardTransform = window.innerHeight + currentTransform;
          nextCardClass += ' next-up';
        } else if (swipeDirection === 'down') {
          nextCardTransform = -window.innerHeight + currentTransform;
          nextCardClass += ' next-down';
        }
        
        if (isSwipingActive) {
          nextCardClass += ' swiping';
        } else if (isAnimating) {
          nextCardClass += ' animating slide-in';
        }
        
        const nextCardStyle = {
          transform: `translateY(${nextCardTransform}px)`,
        };
        
        return (
          <div 
            key={`next-${nextCard.id}`} 
            className={nextCardClass}
            style={nextCardStyle}
            data-card-id={nextCard.id}
          >
            <FullScreenCard
              card={nextCard}
              isFlipped={false}
              isVisible={false}
              onFlip={() => {}}
              onRate={() => {}}
              onReset={() => {}}
            />
          </div>
        );
      })()}
      
      {/* Card Progress Indicator */}
      <div className="card-progress-indicator">
        <span className="progress-text">
          {studyMode === "random" ? (
            `${getLearningProgress().studied} / ${getLearningProgress().total}`
          ) : (
            `${getCurrentCardIndex() + 1} / ${filteredWords.length}`
          )}
        </span>
        <div className="progress-bar">
          <div 
            className="progress-fill"
            style={{ 
              width: studyMode === "random" 
                ? `${(getLearningProgress().studied / getLearningProgress().total) * 100}%`
                : `${((getCurrentCardIndex() + 1) / filteredWords.length) * 100}%`
            }}
          />
        </div>
      </div>
    </div>
    </div>
  );
};

export default InstagramView;