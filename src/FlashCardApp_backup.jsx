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

import React, { useState, useEffect, useCallback } from "react";
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
// Import initial words data from JSON file
import initialWordsData from "./data/initialWords.json";

const FlashCardApp = () => {
  // Function to transform JSON data into full word objects with SRS structure
  const createInitialWords = () => {
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
  };

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
          
          console.log("Loaded", loadedWords.length, "words from localStorage with migration");
        } else {
          console.log(
            "localStorage data incomplete, loading fresh from JSON..."
          );
          loadedWords = createInitialWords();
        }
      } catch (error) {
        console.log(
          "Error parsing localStorage data, loading fresh from JSON..."
        );
        loadedWords = createInitialWords();
      }
    } else {
      console.log(
        "No saved data, loading",
        initialWordsData.length,
        "words from JSON"
      );
      loadedWords = createInitialWords();
    }

    setWords(loadedWords);
    setStats(getCardStats(loadedWords));
    setFilteredWords(loadedWords); // Initialize filtered words for browse mode
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save to localStorage whenever words change
  useEffect(() => {
    if (words.length > 0) {
      localStorage.setItem("flashcards", JSON.stringify(words));
      setStats(getCardStats(words));
    }
  }, [words]);

  // Filter words based on search term for browse mode or status for other modes
  useEffect(() => {
    console.log("🔥 Filter useEffect triggered - words length:", words.length);
    if (words.length > 0 && studyMode !== "random") {
      let filtered;
      
      if (studyMode === "browse") {
        // Browse mode: filter by search term
        if (searchTerm.trim() === "") {
          filtered = [...words];
        } else {
          filtered = words.filter((word) => {
            const searchLower = searchTerm.toLowerCase();
            return (
              word.word.toLowerCase().includes(searchLower) ||
              word.meaning.toLowerCase().includes(searchLower) ||
              word.sentence.toLowerCase().includes(searchLower) ||
              word.sentenceMeaning.toLowerCase().includes(searchLower) ||
              (word.article && word.article.toLowerCase().includes(searchLower)) ||
              (word.type && word.type.toLowerCase().includes(searchLower)) ||
              (word.status && word.status.toLowerCase().includes(searchLower))
            );
          });
        }
      } else {
        // Status-based filtering for flashcard modes (excluding random)
        switch (studyMode) {
          case "learned":
            filtered = words.filter(word => word.status === "learned");
            break;
          case "learning":
            filtered = words.filter(word => word.status === "learning");
            break;
          case "review":
            filtered = words.filter(word => word.status === "review");
            break;
          case "new":
            filtered = words.filter(word => word.status === null);
            break;
          default:
            filtered = [...words];
        }
      }

      // Sort the filtered results (only for browse mode)
      if (studyMode === "browse") {
        filtered.sort((a, b) => {
          switch (sortBy) {
            case "alphabetical":
              return a.word.localeCompare(b.word);
            case "status":
              const statusOrder = { learning: 0, review: 1, learned: 2 };
              return statusOrder[a.status] - statusOrder[b.status];
            case "reviews":
              return b.totalReviews - a.totalReviews; // Most reviewed first
            case "recent":
              if (!a.lastReviewed && !b.lastReviewed) return 0;
              if (!a.lastReviewed) return 1;
              if (!b.lastReviewed) return -1;
              return new Date(b.lastReviewed) - new Date(a.lastReviewed);
            default:
              return a.word.localeCompare(b.word);
          }
        });
      }

      console.log("🔥 Setting filtered words - count:", filtered.length);
      setFilteredWords(filtered);
    }
  }, [searchTerm, words, studyMode, sortBy]);

  // Separate effect to handle random card selection - only when mode changes to random
  useEffect(() => {
    if (studyMode === "random" && words.length > 0 && cardHistory.length === 0) {
      console.log("🔥 Setting up random mode - creating single random card array");
      // For random mode, create an array with just one random card
      const getRandomCard = () => {
        const randomIndex = Math.floor(Math.random() * words.length);
        let randomCard = words[randomIndex];
        
        // If the card is new (status: null), automatically set it to learning
        if (randomCard.status === null) {
          console.log("🔥 Auto-setting new card to learning:", randomCard.word);
          randomCard = { ...randomCard, status: "learning" };
          
          // Update the main words array
          setWords(prevWords => 
            prevWords.map(word => 
              word.id === randomCard.id ? randomCard : word
            )
          );
        }
        
        return randomCard;
      };
      
      const firstCard = getRandomCard();
      setFilteredWords([firstCard]);
      setCurrentCardIndex(0);
      
      // Initialize history with the first card
      setCardHistory([firstCard]);
      setCurrentHistoryIndex(0);
    }
  }, [studyMode, words, cardHistory.length]); // Only runs when necessary

  // Reset card index only when filtering criteria changes (not when word data updates)
  useEffect(() => {
    console.log("🔥 Card index reset useEffect triggered - resetting to 0");
    setCurrentCardIndex(0);
  }, [searchTerm, studyMode, sortBy]);

  // Update word with direct status mapping
  const updateWordWithSRS = useCallback((wordId, quality) => {
    console.log("🔥 updateWordWithSRS called with wordId:", wordId, "quality:", quality);
    setWords((prevWords) => {
      return prevWords.map((word) => {
        if (word.id === wordId) {
          const srsResult = calculateNextInterval(
            quality,
            word.interval,
            word.easeFactor,
            word.consecutiveCorrect
          );

          const nextReview = calculateNextReviewDate(srsResult.interval);

          // Direct status mapping based on arrow key ratings
          // Up arrow (quality 1) = learned, Down arrow (quality 0) = review
          const statusMap = { 0: "review", 1: "learned" };
          const newStatus = statusMap[quality];
          const wasLearned = word.status === "learned";

          console.log("🔥 Updating word:", word.word, "from status:", word.status, "to status:", newStatus);

          // Record when a word is learned for the first time for analytics
          if (newStatus === "learned" && !wasLearned) {
            console.log("🔥 Word learned for first time - incrementing analytics");
            recordNewWordLearned();
          } else if (newStatus === "learned" && wasLearned) {
            console.log("🔥 Word was already learned - no analytics change");
          }

          return {
            ...word,
            ...srsResult,
            nextReview,
            status: newStatus,
            lastReviewed: new Date().toISOString(),
            totalReviews: word.totalReviews + 1,
            mistakeCount:
              quality < 1 ? word.mistakeCount + 1 : word.mistakeCount,
            count: word.count + 1,
          };
        }
        return word;
      });
    });
  }, []);

  // Navigate between cards
  const navigateCard = useCallback(
    (direction) => {
      if (studyMode === "random") {
        // In random mode, use history stack for navigation
        console.log("🔥 Random mode navigation - direction:", direction, "currentHistoryIndex:", currentHistoryIndex);
        
        if (direction === "prev") {
          // Go back in history
          if (currentHistoryIndex > 0) {
            const prevIndex = currentHistoryIndex - 1;
            const prevCard = cardHistory[prevIndex];
            console.log("🔥 Going back to previous card:", prevCard.word);
            
            setFilteredWords([prevCard]);
            setCurrentCardIndex(0);
            setCurrentHistoryIndex(prevIndex);
            setIsFlipped(false);
          } else {
            console.log("🔥 Already at the beginning of history");
          }
        } else if (direction === "next") {
          // Go forward in history or generate new card
          if (currentHistoryIndex < cardHistory.length - 1) {
            // Move forward in existing history
            const nextIndex = currentHistoryIndex + 1;
            const nextCard = cardHistory[nextIndex];
            console.log("🔥 Going forward to next card in history:", nextCard.word);
            
            setFilteredWords([nextCard]);
            setCurrentCardIndex(0);
            setCurrentHistoryIndex(nextIndex);
            setIsFlipped(false);
          } else {
            // Generate new random card and add to history
            console.log("🔥 Generating new random card");
            const getRandomCard = () => {
              const randomIndex = Math.floor(Math.random() * words.length);
              let randomCard = words[randomIndex];
              
              // If the card is new (status: null), automatically set it to learning
              if (randomCard.status === null) {
                console.log("🔥 Auto-setting new card to learning:", randomCard.word);
                randomCard = { ...randomCard, status: "learning" };
                
                // Update the main words array
                setWords(prevWords => 
                  prevWords.map(word => 
                    word.id === randomCard.id ? randomCard : word
                  )
                );
              }
              
              return randomCard;
            };
            
            const newCard = getRandomCard();
            console.log("🔥 New random card:", newCard.word);
            
            // Add to history and move to it
            const newHistory = [...cardHistory, newCard];
            const newIndex = newHistory.length - 1;
            
            setCardHistory(newHistory);
            setCurrentHistoryIndex(newIndex);
            setFilteredWords([newCard]);
            setCurrentCardIndex(0);
            setIsFlipped(false);
          }
        }
        return;
      }

      // Normal navigation for other modes
      const totalCards = filteredWords.length;

      if (direction === "next" && currentCardIndex < totalCards - 1) {
        setCurrentCardIndex(currentCardIndex + 1);
      } else if (direction === "prev" && currentCardIndex > 0) {
        setCurrentCardIndex(currentCardIndex - 1);
      }

      setIsFlipped(false);
    },
    [currentCardIndex, filteredWords, studyMode, words, cardHistory, currentHistoryIndex]
  );

  // Get current card based on filtered results
  const getCurrentCard = useCallback(() => {
    if (filteredWords.length > 0) {
      return filteredWords[currentCardIndex];
    }
    return null;
  }, [filteredWords, currentCardIndex]);

  // Navigate to specific word in browse mode
  const navigateToWord = useCallback((wordId) => {
    if (studyMode === "browse") {
      const index = filteredWords.findIndex(word => word.id === wordId);
      if (index !== -1) {
        setCurrentCardIndex(index);
        setIsFlipped(false);
      }
    }
  }, [studyMode, filteredWords]);

  // Handle quality rating and status setting (merged functionality)
  const handleQualityOrStatusRating = useCallback(
    (quality) => {
      console.log("🔥 handleQualityOrStatusRating called with quality:", quality, "currentCardIndex:", currentCardIndex);
      
      const currentCard = getCurrentCard();
      if (!currentCard) return;

      // Simple direct status assignment
      let newStatus;
      if (quality === 1) { // Thumbs up button (Up arrow)
        newStatus = "learned";
      } else if (quality === 0) { // Thumbs down button (Down arrow)
        newStatus = "review";
      }

      console.log("🔥 Setting card:", currentCard.word, "from", currentCard.status, "to", newStatus);
      
      if (studyMode === "browse") {
        console.log("🔥 In browse mode - updating status only");
        setWords((prevWords) => {
          return prevWords.map((word) => {
            if (word.id === currentCard.id) {
              return { ...word, status: newStatus };
            }
            return word;
          });
        });
      } else if (studyMode === "random") {
        console.log("🔥 In random mode - updating status without SRS");
        // In random mode: just update the status, don't use SRS
        setWords((prevWords) => {
          return prevWords.map((word) => {
            if (word.id === currentCard.id) {
              return { ...word, status: newStatus };
            }
            return word;
          });
        });
        
        // Update the card in history to reflect the new status
        setCardHistory((prevHistory) => {
          return prevHistory.map((historyCard, index) => {
            if (index === currentHistoryIndex && historyCard.id === currentCard.id) {
              return { ...historyCard, status: newStatus };
            }
            return historyCard;
          });
        });
        
        // Update the current displayed card
        setFilteredWords([{ ...currentCard, status: newStatus }]);
      } else {
        console.log("🔥 In flashcard mode - calling updateWordWithSRS");
        // In other flashcard modes: use SRS for rating
        updateWordWithSRS(currentCard.id, newStatus === "learned" ? 1 : 0);
      }
      console.log("🔥 handleQualityOrStatusRating finished - currentCardIndex should still be:", currentCardIndex);
    },
    [studyMode, updateWordWithSRS, getCurrentCard, currentCardIndex, currentHistoryIndex]
  );

  // Reset card to new state (no status)
  const resetCardToLearning = useCallback(() => {
    const currentCard = getCurrentCard();
    if (currentCard) {
      console.log("🔥 Resetting card to new state:", currentCard.word);
      
      // Update the main words array
      setWords((prevWords) => {
        return prevWords.map((word) => {
          if (word.id === currentCard.id) {
            return { ...word, status: null };
          }
          return word;
        });
      });
      
      if (studyMode === "random") {
        // Update the card in history to reflect the new status
        setCardHistory((prevHistory) => {
          return prevHistory.map((historyCard, index) => {
            if (index === currentHistoryIndex && historyCard.id === currentCard.id) {
              return { ...historyCard, status: null };
            }
            return historyCard;
          });
        });
        
        // Update the current displayed card
        setFilteredWords([{ ...currentCard, status: null }]);
      }
    }
  }, [getCurrentCard, studyMode, currentHistoryIndex]);

  // Toggle theme between light and dark
  const toggleTheme = useCallback(() => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
  }, [theme]);

  // Reset data to fresh JSON file data
  const resetData = useCallback(() => {
    if (
      window.confirm(
        "Reset all flashcard data to original? This will lose your progress!"
      )
    ) {
      localStorage.removeItem("flashcards");
      const freshWords = createInitialWords();
      setWords(freshWords);
      setStats(getCardStats(freshWords));
      setCurrentCardIndex(0);
      setIsFlipped(false);
      alert(
        "Data reset! Fresh vocabulary loaded with article and type information."
      );
    }
  }, []);

  // Load theme from localStorage on startup
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme && (savedTheme === "light" || savedTheme === "dark")) {
      setTheme(savedTheme);
    }
  }, []);

  // Keyboard event handler with rating and navigation shortcuts
  useEffect(() => {
    const handleKeyPress = (event) => {
      switch (event.key) {
        case "ArrowLeft":
          event.preventDefault();
          navigateCard("prev"); // Previous card
          return;
        case "ArrowRight":
          event.preventDefault();
          navigateCard("next"); // Next card
          return;
        case "ArrowUp":
          event.preventDefault();
          handleQualityOrStatusRating(1); // Thumbs up - Learned
          return;
        case "ArrowDown":
          event.preventDefault();
          handleQualityOrStatusRating(0); // Thumbs down - Needs Review/Toggle
          return;
        case "Shift":
          // Only trigger on right shift key
          if (event.location === KeyboardEvent.DOM_KEY_LOCATION_RIGHT) {
            event.preventDefault();
            resetCardToLearning(); // Reset to Learning state
          }
          return;
        case " ":
          event.preventDefault();
          setIsFlipped(!isFlipped); // Toggle card flip
          return;
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
      // In random mode, show position in history and total available cards
      return { 
        current: currentHistoryIndex + 1, 
        total: `${cardHistory.length} (${words.length} total)` 
      };
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
        <h1>Flashcard Deutscher</h1>
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          title={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
        >
          <span className="material-icons">
            {theme === "light" ? "dark_mode" : "light_mode"}
          </span>
        </button>
        <div className="mode-selector">
          <button
            className={studyMode === "random" ? "active" : ""}
            onClick={() => {
              setStudyMode("random");
              setCurrentCardIndex(0);
              setIsFlipped(false);
              setSessionStartTime(Date.now());
              setSessionStats({
                wordsStudied: 0,
                correctAnswers: 0,
                wrongAnswers: 0,
              });
              // Reset card history for new random session
              setCardHistory([]);
              setCurrentHistoryIndex(-1);
            }}
          >
            <span className="material-icons">shuffle</span>
            Random
          </button>
          <button
            className={studyMode === "new" ? "active" : ""}
            onClick={() => {
              setStudyMode("new");
              setCurrentCardIndex(0);
              setIsFlipped(false);
              setSessionStartTime(Date.now());
              setSessionStats({
                wordsStudied: 0,
                correctAnswers: 0,
                wrongAnswers: 0,
              });
            }}
          >
            <span className="material-icons">fiber_new</span>
            New ({stats.new || 0})
          </button>
          <button
            className={studyMode === "learning" ? "active" : ""}
            onClick={() => {
              setStudyMode("learning");
              setCurrentCardIndex(0);
              setIsFlipped(false);
              setSessionStartTime(Date.now());
              setSessionStats({
                wordsStudied: 0,
                correctAnswers: 0,
                wrongAnswers: 0,
              });
            }}
          >
            <span className="material-icons">school</span>
            Learning ({stats.learning || 0})
          </button>
          <button
            className={studyMode === "review" ? "active" : ""}
            onClick={() => {
              setStudyMode("review");
              setCurrentCardIndex(0);
              setIsFlipped(false);
              setSessionStartTime(Date.now());
              setSessionStats({
                wordsStudied: 0,
                correctAnswers: 0,
                wrongAnswers: 0,
              });
            }}
          >
            <span className="material-icons">refresh</span>
            Needs Review ({stats.review || 0})
          </button>
          <button
            className={studyMode === "learned" ? "active" : ""}
            onClick={() => {
              setStudyMode("learned");
              setCurrentCardIndex(0);
              setIsFlipped(false);
              setSessionStartTime(Date.now());
              setSessionStats({
                wordsStudied: 0,
                correctAnswers: 0,
                wrongAnswers: 0,
              });
            }}
          >
            <span className="material-icons">check_circle</span>
            Learned ({stats.learned || 0})
          </button>
          <button
            className={studyMode === "browse" ? "active" : ""}
            onClick={() => {
              setStudyMode("browse");
              setCurrentCardIndex(0);
              setIsFlipped(false);
              setSearchTerm("");
            }}
          >
            <span className="material-icons">search</span>
            Browse All
          </button>
          <button
            className="analytics-btn"
            onClick={() => setShowAnalytics(true)}
            title="View Learning Analytics"
          >
            <span className="material-icons">analytics</span>
            Analytics
          </button>
          <button
            className="reset-btn"
            onClick={resetData}
            title="Reset data to load fresh vocabulary with articles and types"
          >
            <span className="material-icons">refresh</span>
            Reset Data
          </button>
        </div>
        {studyMode !== "random" && filteredWords.length > 0 && (
          <div className="progress">
            Card {cardCount.current} of {cardCount.total}
            {studyMode === "browse" && searchTerm && (
              <span className="search-info"> (filtered)</span>
            )}
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

      {/* Analytics Dashboard - Comprehensive learning insights and progress tracking */}
          {studyMode === "browse" && (
            <div className="search-container">
              <input
                type="text"
                placeholder="Search words, meanings, types, articles, or status..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              <div className="search-controls">
                <label htmlFor="sort-select">Sort by:</label>
                <select
                  id="sort-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="sort-select"
                >
                  <option value="alphabetical">Alphabetical</option>
                  <option value="status">Status</option>
                  <option value="reviews">Most Reviewed</option>
                  <option value="recent">Recently Studied</option>
                </select>
              </div>
              <div className="search-results-info">
                {searchTerm && (
                  <span>
                    Found {filteredWords.length} of {words.length} cards
                    {filteredWords.length === 0 && " - try a different search term"}
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="stats-bar">
        <div className="stat">New: {stats.new || 0}</div>
        <div className="stat">Learning: {stats.learning || 0}</div>
        <div className="stat">Learned: {stats.learned || 0}</div>
        <div className="stat">Needs Review: {stats.review || 0}</div>
        <div className="stat">Due: {stats.due || 0}</div>
      </div>

      {filteredWords.length === 0 && studyMode !== "browse" ? (
        <div className="no-cards">
          <h2><span className="material-icons">inbox</span> No cards in this category</h2>
          <p>No cards found for the <strong>{studyMode}</strong> status.</p>
          <p>Try rating some cards to change their status, or switch to a different mode.</p>
          <div className="mode-suggestions">
            <button 
              onClick={() => {
                setStudyMode("random");
                setCurrentCardIndex(0);
                setSessionStartTime(Date.now());
              }}
              className="suggestion-btn"
            >
              <span className="material-icons">shuffle</span> Try Random Mode
            </button>
            <button 
              onClick={() => {
                setStudyMode("browse");
                setCurrentCardIndex(0);
                setSearchTerm("");
              }}
              className="suggestion-btn"
            >
              <span className="material-icons">search</span> Browse All Cards
            </button>
          </div>
        </div>
      ) : studyMode === "browse" && filteredWords.length === 0 && searchTerm ? (
        <div className="no-cards">
          <h2><span className="material-icons">search</span> No matching cards found</h2>
          <p>No cards match your search term: "<strong>{searchTerm}</strong>"</p>
          <p>Try searching for:</p>
          <ul>
            <li>German words (e.g., "Haus", "gehen")</li>
            <li>English meanings (e.g., "house", "to go")</li>
            <li>Word types (e.g., "noun", "verb")</li>
            <li>Articles (e.g., "der", "die", "das")</li>
            <li>Status (e.g., "learning", "learned", "needs review")</li>
          </ul>
          <button 
            onClick={() => setSearchTerm("")}
            className="suggestion-btn"
          >
            <span className="material-icons">clear</span> Clear Search
          </button>
        </div>
      ) : (
        currentCard && (
          <>
            <div className={`flashcard ${isFlipped ? "flipped" : ""}`}>
              <div className="card-content">
                {!isFlipped ? (
                  <div className="front">
                    <p>
                      {currentCard.type && (
                        <span className="word-type">({currentCard.type})</span>
                      )}
                      <span className={`card-status status-${currentCard.status || 'new'}`} title="Current card status">
                        Status: {currentCard.status || 'new'}
                      </span>
                    </p>
                    <div className="word-header">
                      {currentCard.article && currentCard.article.trim() && (
                        <span className="article">{currentCard.article} </span>
                      )}
                      <span className="german-word">{currentCard.word}</span>
                      <button
                        className="copy-btn"
                        onClick={() => {
                          const textToCopy = currentCard.article ? 
                            `${currentCard.article} ${currentCard.word}` : 
                            currentCard.word;
                          navigator.clipboard.writeText(textToCopy);
                        }}
                        title="Copy German word"
                      >
                        <span className="material-icons">content_copy</span>
                      </button>
                    </div>
                    <div className="german-sentence">
                      {currentCard.sentence}
                      <button
                        className="copy-btn sentence-copy"
                        onClick={() => navigator.clipboard.writeText(currentCard.sentence)}
                        title="Copy German sentence"
                      >
                        <span className="material-icons">content_copy</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="back">
                    <div className="english-word">{currentCard.meaning}</div>
                    <div className="english-sentence">
                      {currentCard.sentenceMeaning}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Rating buttons outside card content - always visible */}
              <div className="card-rating-buttons">
                <button
                  className={`card-rating-btn rating-up ${currentCard.status === 'learned' ? 'active' : ''}`}
                  onClick={() => handleQualityOrStatusRating(1)}
                  title="Learned - Easy and confident (↑ key)"
                >
                  <span className="material-icons">thumb_up</span>
                </button>
                <button
                  className="card-rating-btn rating-reset"
                  onClick={resetCardToLearning}
                  title="Reset to New state (Right Shift key)"
                >
                  <span className="material-icons">refresh</span>
                </button>
                <button
                  className={`card-rating-btn rating-down ${currentCard.status === 'review' ? 'active' : ''}`}
                  onClick={() => handleQualityOrStatusRating(0)}
                  title="Needs Review - Needs more practice (↓ key)"
                >
                  <span className="material-icons">thumb_down</span>
                </button>
              </div>
            </div>

            {/* Navigation Controls - Keep close to the card */}
            <div className="controls navigation-controls">
              <div className="control-group">
                <div className="simple-navigation">
                  <button
                    onClick={() => navigateCard("prev")}
                    className="nav-btn"
                    title={studyMode === "random" ? "Previous card in history (← key)" : "Previous card (← key)"}
                  >
                    ← Previous
                  </button>

                  <button
                    onClick={() => setIsFlipped(!isFlipped)}
                    className="nav-btn flip-btn"
                    title="Toggle card view (Space key)"
                  >
                    Flip Card
                  </button>

                  <button
                    onClick={() => navigateCard("next")}
                    className="nav-btn"
                    title={studyMode === "random" ? "Next random card (→ key)" : "Next card (→ key)"}
                  >
                    Next →
                  </button>
                </div>
              </div>
            </div>

            {/* Keyboard Shortcuts Guide - Complete keyboard controls */}
            <div className="keyboard-shortcuts-card">
              <div className="shortcuts-compact">
                <h4><span className="material-icons">keyboard</span> Keyboard Shortcuts:</h4>
                <div className="shortcuts-grid">
                  <div className="shortcut-section">
                    <strong><span className="material-icons">navigation</span> Navigation:</strong>
                    <span><kbd>←</kbd> Previous card</span>
                    <span><kbd>→</kbd> Next card</span>
                    <span><kbd>Space</kbd> Flip card</span>
                  </div>
                  <div className="shortcut-section">
                    <strong><span className="material-icons">assessment</span> Rating:</strong>
                    <span><kbd>↑</kbd> Learned <span className="emoji-hint"><span className="material-icons">thumb_up</span></span></span>
                    <span><kbd>↓</kbd> Needs Review <span className="emoji-hint"><span className="material-icons">thumb_down</span></span></span>
                    <span><kbd>Right Shift</kbd> Reset <span className="emoji-hint"><span className="material-icons">refresh</span></span></span>
                  </div>
                </div>
                <small>
                  <span className="material-icons">lightbulb</span> {studyMode === "browse" ? "Browse mode: Set card status manually" : `${studyMode} mode: New cards have no status until first rated - Up (Learned) or Down (Learning/Review)`}
                </small>
              </div>
            </div>

            {/* Word List for Browse mode */}
            {studyMode === "browse" && (
              <div className="word-list-container">
                <h3>Word List ({filteredWords.length} words)</h3>
                <div className="word-list">
                  {filteredWords.map((word, index) => (
                    <div
                      key={word.id}
                      className={`word-list-item ${index === currentCardIndex ? 'active' : ''}`}
                      onClick={() => navigateToWord(word.id)}
                    >
                      <div className="word-list-main">
                        <span className="word-list-german">
                          {word.article && word.article.trim() && (
                            <span className="word-list-article">{word.article} </span>
                          )}
                          {word.word}
                        </span>
                        <span className="word-list-meaning">{word.meaning}</span>
                      </div>
                      <div className="word-list-meta">
                        <span className={`word-list-status status-${word.status || 'new'}`}>
                          {word.status || 'new'}
                        </span>
                        <span className="word-list-type">{word.type}</span>
                        <span className="word-list-reviews">{word.totalReviews} reviews</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )
      )}
        </>
      ) : (
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
          getCurrentCard={getCurrentCard}
          stats={stats}
          showAnalytics={showAnalytics}
          setShowAnalytics={setShowAnalytics}
          resetData={resetData}
          setCurrentCardIndex={setCurrentCardIndex}
          setSessionStartTime={setSessionStartTime}
          setSessionStats={setSessionStats}
        />
      )}

      {/* Analytics Dashboard - Comprehensive learning insights and progress tracking */}
      <AnalyticsDashboard
        words={words}
        isVisible={showAnalytics}
        onClose={() => setShowAnalytics(false)}
      />
    </div>
  );
};

export default FlashCardApp;
