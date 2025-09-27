/**
 * Flashcard Deutscher - Main Application Component
 *
 * A sophisticated German language learning platform featuring:
 * - AI-powered Spaced Repetition System (SRS)
 * - Comprehensive learning analytics
 * - Interactive flashcard interface
 * - Progress tracking and insights
 *
 * Built with React and modern web technologies for optimal learning experience.
 */

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { v4 as uuidv4 } from "uuid";
import {
  calculateNextInterval,
  calculateNextReviewDate,
  getCardStats,
} from "./srsAlgorithm";
// Import analytics functionality for comprehensive learning tracking
import { recordNewWordLearned } from "./statisticsManager";
import AnalyticsDashboard from "./AnalyticsDashboard";
// Import Instagram view component
import InstagramView from "./InstagramView";
// Import components
import BurgerMenu from "./components/BurgerMenu";
import SettingsPanel from "./components/SettingsPanel";
// Import initial words data from JSON file
import initialWordsData from "./data/initialWords.json";

const FlashCardApp = () => {
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

  const [words, setWords] = useState([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [studyMode, setStudyMode] = useState("random"); // 'random', 'learned', 'learning', 'new', or 'browse'
  const [stats, setStats] = useState({});
  const [theme, setTheme] = useState("light"); // 'light' or 'dark'
  // Browse mode search functionality (kept for InstagramView filtering)
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredWords, setFilteredWords] = useState([]);
  const [sortBy, setSortBy] = useState("alphabetical"); // 'alphabetical', 'status', 'reviews', 'recent'
  // Analytics and session tracking state
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [sessionStats, setSessionStats] = useState({
    wordsStudied: 0,
    correctAnswers: 0,
    wrongAnswers: 0,
  });
  // Card history stack for random mode navigation
  const [cardHistory, setCardHistory] = useState([]); // Stack of previously viewed cards
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState(-1); // Current position in history

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
          // This handles the case where cards were created before the status system change
          loadedWords = loadedWords.map(word => {
            // If a card has never been reviewed and has 'learning' status, reset it to null
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

  // Filter words based on search term for browse mode or status for other modes
  useEffect(() => {
    if (words.length === 0) return;

    let filtered = [...words];

    // Study mode filtering
    if (studyMode === "random") {
      // For random mode, we want all words but will select randomly
      filtered = words;
    } else if (studyMode === "new") {
      filtered = words.filter((word) => word.status === null);
    } else if (studyMode === "learning") {
      filtered = words.filter((word) => word.status === "review");
    } else if (studyMode === "learned") {
      filtered = words.filter((word) => word.status === "learned");
    } else if (studyMode === "browse") {
      // Browse mode: filter by search term if provided
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim();
        filtered = words.filter((word) => {
          return (
            word.word.toLowerCase().includes(term) ||
            word.meaning.toLowerCase().includes(term) ||
            (word.article && word.article.toLowerCase().includes(term)) ||
            word.type.toLowerCase().includes(term) ||
            word.sentence.toLowerCase().includes(term) ||
            word.sentenceMeaning.toLowerCase().includes(term) ||
            (word.status || "new").toLowerCase().includes(term)
          );
        });
      }
      
      // Apply sorting for browse mode
      filtered.sort((a, b) => {
        if (sortBy === "alphabetical") {
          return a.word.localeCompare(b.word);
        } else if (sortBy === "status") {
          const statusOrder = { new: 0, review: 1, learned: 2 };
          const statusA = statusOrder[a.status || "new"];
          const statusB = statusOrder[b.status || "new"];
          return statusA - statusB;
        } else if (sortBy === "reviews") {
          return (b.totalReviews || 0) - (a.totalReviews || 0);
        } else if (sortBy === "recent") {
          return new Date(b.lastReviewed || b.createdDate) - new Date(a.lastReviewed || a.createdDate);
        }
        return 0;
      });
    }

    setFilteredWords(filtered);

    // Update stats whenever words or filtering changes
    const newStats = {
      new: words.filter((word) => word.status === null).length,
      review: words.filter((word) => word.status === "review").length,
      learned: words.filter((word) => word.status === "learned").length,
      due: words.filter(
        (word) =>
          word.nextReview && new Date(word.nextReview) <= new Date()
      ).length,
    };
    setStats(newStats);
  }, [searchTerm, words, studyMode, sortBy]);

  // Separate effect to handle random card selection - only when mode changes to random
  useEffect(() => {
    if (studyMode === "random" && words.length > 0 && cardHistory.length === 0) {
      // Initialize random mode with first random card
      const availableWords = words.filter(word => word.status !== "learned" || Math.random() < 0.3);
      const wordsToUse = availableWords.length > 0 ? availableWords : words;
      const randomIndex = Math.floor(Math.random() * wordsToUse.length);
      const randomWord = wordsToUse[randomIndex];
      const globalIndex = words.findIndex(word => word.id === randomWord.id);
      
      setCurrentCardIndex(globalIndex);
      setCardHistory([globalIndex]);
      setCurrentHistoryIndex(0);
    }
  }, [studyMode, words, cardHistory.length]); // Only runs when necessary

  // Reset card index only when filtering criteria changes (not when word data updates)
  useEffect(() => {
    if (studyMode !== "random") {
      setCurrentCardIndex(0);
    }
  }, [searchTerm, studyMode, sortBy]);

  // Update word with direct status mapping
  const updateWordWithSRS = useCallback((wordId, quality) => {
    setWords(prevWords => 
      prevWords.map(word => {
        if (word.id !== wordId) return word;
        
        // Direct status mapping based on quality
        let newStatus;
        if (quality === 1) {
          newStatus = "learned"; // Thumbs up = Learned
        } else if (quality === 0) {
          newStatus = "review"; // Thumbs down = Needs Review
        }
        
        // Calculate SRS values
        const updatedWord = {
          ...word,
          status: newStatus,
          lastReviewed: new Date().toISOString(),
          totalReviews: (word.totalReviews || 0) + 1,
        };

        // Apply SRS algorithm with correct parameters
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
        
        return updatedWord;
      })
    );

    // Record statistics
    if (quality >= 1) {
      recordNewWordLearned();
    }
  }, []);

  // Navigate between cards
  const navigateCard = useCallback(
    (direction) => {
      if (studyMode === "random") {
        if (direction === "prev") {
          // Go back in history
          if (currentHistoryIndex > 0) {
            const newHistoryIndex = currentHistoryIndex - 1;
            setCurrentHistoryIndex(newHistoryIndex);
            setCurrentCardIndex(cardHistory[newHistoryIndex]);
          }
        } else if (direction === "next") {
          if (currentHistoryIndex < cardHistory.length - 1) {
            // Move forward in existing history
            const newHistoryIndex = currentHistoryIndex + 1;
            setCurrentHistoryIndex(newHistoryIndex);
            setCurrentCardIndex(cardHistory[newHistoryIndex]);
          } else {
            // Generate new random card
            const availableWords = words.filter(word => word.status !== "learned" || Math.random() < 0.3);
            const wordsToUse = availableWords.length > 0 ? availableWords : words;
            const randomIndex = Math.floor(Math.random() * wordsToUse.length);
            const randomWord = wordsToUse[randomIndex];
            const globalIndex = words.findIndex(word => word.id === randomWord.id);
            
            // Add to history
            const newHistory = [...cardHistory.slice(0, currentHistoryIndex + 1), globalIndex];
            const newHistoryIndex = newHistory.length - 1;
            
            setCardHistory(newHistory);
            setCurrentHistoryIndex(newHistoryIndex);
            setCurrentCardIndex(globalIndex);
          }
        }
      } else {
        // Sequential navigation for other modes
        if (direction === "prev") {
          setCurrentCardIndex((prev) => 
            prev > 0 ? prev - 1 : filteredWords.length - 1
          );
        } else if (direction === "next") {
          setCurrentCardIndex((prev) => 
            prev < filteredWords.length - 1 ? prev + 1 : 0
          );
        }
      }
      setIsFlipped(false);
    },
    [currentCardIndex, filteredWords, studyMode, words, cardHistory, currentHistoryIndex]
  );

  // Get current card based on filtered results
  const getCurrentCard = useCallback(() => {
    if (studyMode === "random") {
      return words[currentCardIndex] || words[0];
    }
    return filteredWords[currentCardIndex] || filteredWords[0];
  }, [filteredWords, currentCardIndex]);

  // Navigate to specific word in browse mode
  const navigateToWord = useCallback((wordId) => {
    if (studyMode === "browse") {
      const wordIndex = filteredWords.findIndex((word) => word.id === wordId);
      if (wordIndex !== -1) {
        setCurrentCardIndex(wordIndex);
        setIsFlipped(false);
      }
    }
  }, [studyMode, filteredWords]);

  // Handle quality rating and status setting (merged functionality)
  const handleQualityOrStatusRating = useCallback(
    (quality) => {
      const currentCard = getCurrentCard();
      if (!currentCard) return;

      updateWordWithSRS(currentCard.id, quality);

      // Update session stats
      setSessionStats(prev => ({
        ...prev,
        wordsStudied: prev.wordsStudied + 1,
        correctAnswers: prev.correctAnswers + (quality >= 1 ? 1 : 0),
        wrongAnswers: prev.wrongAnswers + (quality < 1 ? 1 : 0),
      }));

      // Auto-navigate in study modes (not browse mode)
      if (studyMode !== "browse") {
        setTimeout(() => {
          if (studyMode === "random") {
            // For random mode, always move forward (generate new or use history)
            navigateCard("next");
          } else {
            // For sequential modes, move to next card
            const nextIndex = currentCardIndex + 1;
            if (nextIndex < filteredWords.length) {
              setCurrentCardIndex(nextIndex);
            } else if (filteredWords.length > 1) {
              // Loop back to first card if we're at the end
              setCurrentCardIndex(0);
            }
          }
          setIsFlipped(false);
        }, 500);
      }
    },
    [studyMode, updateWordWithSRS, getCurrentCard, currentCardIndex, currentHistoryIndex]
  );

  // Reset card to new state (no status)
  const resetCardToLearning = useCallback(() => {
    const currentCard = getCurrentCard();
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

    // Auto-navigate in random mode
    if (studyMode === "random") {
      setTimeout(() => {
        navigateCard("next");
        setIsFlipped(false);
      }, 300);
    }
  }, [getCurrentCard, studyMode, currentHistoryIndex]);

  // Toggle theme between light and dark
  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === "light" ? "dark" : "light");
  }, [theme]);

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

  // Load theme from localStorage on startup
  useEffect(() => {
    const savedTheme = localStorage.getItem("flashcard-theme");
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  // Keyboard event handler with rating and navigation shortcuts
  useEffect(() => {
    const handleKeyPress = (event) => {
      // Don't handle shortcuts if user is typing in an input
      if (event.target.tagName === "INPUT" || event.target.tagName === "TEXTAREA") {
        return;
      }

      switch (event.key) {
        case "ArrowLeft":
          event.preventDefault();
          navigateCard("prev");
          break;
        case "ArrowRight":
          event.preventDefault();
          navigateCard("next");
          break;
        case " ":
          event.preventDefault();
          setIsFlipped((prev) => !prev);
          break;
        case "ArrowUp":
          event.preventDefault();
          handleQualityOrStatusRating(1); // Learned
          break;
        case "ArrowDown":
          event.preventDefault();
          handleQualityOrStatusRating(0); // Review
          break;
        case "Shift":
          if (event.location === KeyboardEvent.DOM_KEY_LOCATION_RIGHT) {
            event.preventDefault();
            resetCardToLearning(); 
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [
    navigateCard,
    isFlipped,
    handleQualityOrStatusRating,
    resetCardToLearning,
  ]);

  const getCurrentCardCount = () => {
    if (studyMode === "random") {
      return { current: currentHistoryIndex + 1, total: "∞" };
    }
    return { current: currentCardIndex + 1, total: filteredWords.length };
  };

  if (words.length === 0) {
    return <div className="app">Loading...</div>;
  }

  const currentCard = getCurrentCard();
  const cardCount = getCurrentCardCount();

  return (
    <div className={`app ${theme}`}>
      <div className="header">
        {/* Left side - App Title */}
        <div className="header-left">
          <h1>Flashcard Deutscher</h1>
        </div>

        {/* Right side - Burger Menu */}
        <div className="header-right">
          <BurgerMenu 
            isOpen={showAnalytics}
            onClick={() => setShowAnalytics(!showAnalytics)}
          />
        </div>
        {showAnalytics && (
          <div className="session-info">
            <span className="session-timer">
              Session: {Math.floor((Date.now() - sessionStartTime) / 60000)} min
            </span>
            <span className="session-stats">
              Studied: {sessionStats.wordsStudied} | Correct:{" "}
              {sessionStats.correctAnswers}
            </span>
          </div>
        )}
      </div>

      {/* Instagram View - Main and only view */}
      <InstagramView
        words={words}
        setWords={setWords}
        filteredWords={filteredWords}
        currentCard={getCurrentCard()}
        setIsFlipped={setIsFlipped}
        isFlipped={isFlipped}
        studyMode={studyMode}
        setStudyMode={setStudyMode}
        theme={theme}
        toggleTheme={toggleTheme}
        handleQualityOrStatusRating={handleQualityOrStatusRating}
        resetCardToLearning={resetCardToLearning}
        stats={stats}
        showAnalytics={showAnalytics}
        setShowAnalytics={setShowAnalytics}
        resetData={resetData}
        setCurrentCardIndex={setCurrentCardIndex}
        setSessionStartTime={setSessionStartTime}
        setSessionStats={setSessionStats}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        sortBy={sortBy}
        setSortBy={setSortBy}
      />

      {/* Settings Panel - Navigation and configuration options */}
      <SettingsPanel
        isOpen={showAnalytics}
        onClose={() => setShowAnalytics(false)}
        studyMode={studyMode}
        setStudyMode={setStudyMode}
        theme={theme}
        toggleTheme={toggleTheme}
        stats={stats}
        showAnalytics={showAnalytics}
        setShowAnalytics={setShowAnalytics}
        resetData={resetData}
        setIsFlipped={setIsFlipped}
        setCurrentCardIndex={setCurrentCardIndex}
        setSessionStartTime={setSessionStartTime}
        setSessionStats={setSessionStats}
        setCardHistory={setCardHistory}
        setCurrentHistoryIndex={setCurrentHistoryIndex}
      />
      
      {/* Analytics Dashboard - Comprehensive learning insights and progress tracking */}
      <AnalyticsDashboard
        words={words}
        isVisible={showAnalytics && studyMode === 'analytics'}
        onClose={() => setShowAnalytics(false)}
      />
    </div>
  );
};

export default FlashCardApp;