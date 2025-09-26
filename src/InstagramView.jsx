// src/InstagramView.jsx
import React, { useState, useEffect, useRef } from 'react';
import './InstagramView.css';
import BurgerMenu from './components/BurgerMenu';
import SettingsPanel from './components/SettingsPanel';
import FullScreenCard from './components/FullScreenCard';

const InstagramView = ({ 
  filteredWords, 
  words, 
  setWords, 
  isFlipped, 
  setIsFlipped, 
  handleQualityOrStatusRating, 
  resetCardToLearning, 
  studyMode, 
  setStudyMode,
  theme, 
  toggleTheme,
  stats,
  showAnalytics,
  setShowAnalytics,
  resetData,
  setCurrentCardIndex,
  setSessionStartTime,
  setSessionStats,
  searchTerm,
  setSearchTerm,
  sortBy,
  setSortBy
}) => {
  // Track which card is currently visible
  const [visibleCardId, setVisibleCardId] = useState(null);
  // Settings panel state
  const [isSettingsPanelOpen, setIsSettingsPanelOpen] = useState(false);
  // Track flipped state for each card separately
  const [flippedCards, setFlippedCards] = useState(new Set());
  const observers = useRef(new Map());
  
  // Touch/swipe handling state
  const [touchStart, setTouchStart] = useState({ x: 0, y: 0 });
  const [touchEnd, setTouchEnd] = useState({ x: 0, y: 0 });
  
  // Set initial visible card
  useEffect(() => {
    if (filteredWords.length > 0 && !visibleCardId) {
      setVisibleCardId(filteredWords[0].id);
    }
  }, [filteredWords, visibleCardId]);
  
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
  
  // Find the currently visible card object
  const currentCard = filteredWords.find(card => card.id === visibleCardId) || filteredWords[0];
  
  // Get current card index for navigation
  const getCurrentCardIndex = () => {
    return filteredWords.findIndex(card => card.id === visibleCardId);
  };
  
  // Navigate to specific card by index
  const navigateToCard = (index) => {
    if (index >= 0 && index < filteredWords.length) {
      const targetCard = filteredWords[index];
      const cardElement = document.querySelector(`[data-card-id="${targetCard.id}"]`);
      if (cardElement) {
        cardElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setVisibleCardId(targetCard.id);
        // Update parent component's current card index if needed
        if (setCurrentCardIndex) {
          setCurrentCardIndex(index);
        }
      }
    }
  };
  
  // Navigate to next card
  const navigateNext = () => {
    const currentIndex = getCurrentCardIndex();
    if (currentIndex < filteredWords.length - 1) {
      navigateToCard(currentIndex + 1);
    } else {
      // Loop back to first card
      navigateToCard(0);
    }
  };
  
  // Navigate to previous card
  const navigatePrevious = () => {
    const currentIndex = getCurrentCardIndex();
    if (currentIndex > 0) {
      navigateToCard(currentIndex - 1);
    } else {
      // Loop to last card
      navigateToCard(filteredWords.length - 1);
    }
  };
  
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
  
  // Touch event handlers for swipe navigation
  const handleTouchStart = (e) => {
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    });
  };
  
  const handleTouchMove = (e) => {
    setTouchEnd({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    });
  };
  
  const handleTouchEnd = () => {
    if (!touchStart.x || !touchEnd.x) return;
    
    const deltaX = touchStart.x - touchEnd.x;
    const deltaY = touchStart.y - touchEnd.y;
    const minSwipeDistance = 50;
    
    // Only handle horizontal swipes (ignore if vertical movement is too large)
    if (Math.abs(deltaY) > Math.abs(deltaX)) return;
    
    if (Math.abs(deltaX) > minSwipeDistance) {
      if (deltaX > 0) {
        // Swiped left - go to next card
        navigateNext();
      } else {
        // Swiped right - go to previous card
        navigatePrevious();
      }
    }
  };
  
  // Check if current card is flipped
  const isCurrentCardFlipped = visibleCardId ? flippedCards.has(visibleCardId) : false;
  
  // Handle key presses (maintain keyboard shortcuts)
  useEffect(() => {
    const handleKeyPress = (event) => {
      // Close settings panel on ESC
      if (event.key === "Escape" && isSettingsPanelOpen) {
        event.preventDefault();
        setIsSettingsPanelOpen(false);
        return;
      }

      // Don't handle other shortcuts if settings panel is open
      if (isSettingsPanelOpen) return;

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
          handleQualityOrStatusRating(1); // Learned
          return;
        case "ArrowDown":
          event.preventDefault();
          handleQualityOrStatusRating(0); // Review
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
  }, [handleQualityOrStatusRating, resetCardToLearning, handleCardFlip, isSettingsPanelOpen, navigateNext, navigatePrevious]);
  
  return (
    <div 
      className="instagram-view-container"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Burger Menu Button */}
      <BurgerMenu 
        isOpen={isSettingsPanelOpen}
        onClick={() => setIsSettingsPanelOpen(!isSettingsPanelOpen)}
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
        showAnalytics={showAnalytics}
        setShowAnalytics={setShowAnalytics}
        resetData={resetData}
        setIsFlipped={setIsFlipped}
        setCurrentCardIndex={setCurrentCardIndex}
        setSessionStartTime={setSessionStartTime}
        setSessionStats={setSessionStats}
      />
      
      {/* Cards */}
      {filteredWords.map(card => (
        <div 
          key={card.id} 
          className={`insta-card-wrapper ${card.id === visibleCardId ? 'active' : ''}`}
          data-card-id={card.id}
        >
          <FullScreenCard
            card={card}
            isFlipped={flippedCards.has(card.id)}
            isVisible={card.id === visibleCardId}
            onFlip={handleCardFlip}
            onRate={handleQualityOrStatusRating}
            onReset={resetCardToLearning}
          />
          
          {/* Scroll indicator */}
          <div className="scroll-indicator">
            <span className="material-icons">expand_more</span>
          </div>
        </div>
      ))}
      
      {/* Navigation Controls */}
      <div className="navigation-arrows">
        <button 
          className="nav-arrow nav-arrow-left"
          onClick={navigatePrevious}
          title="Previous card (← key or swipe right)"
        >
          <span className="material-icons">chevron_left</span>
        </button>
        <button 
          className="nav-arrow nav-arrow-right"
          onClick={navigateNext}
          title="Next card (→ key or swipe left)"
        >
          <span className="material-icons">chevron_right</span>
        </button>
      </div>
      
      {/* Card Progress Indicator */}
      <div className="card-progress-indicator">
        <span className="progress-text">
          {getCurrentCardIndex() + 1} / {filteredWords.length}
        </span>
        <div className="progress-bar">
          <div 
            className="progress-fill"
            style={{ width: `${((getCurrentCardIndex() + 1) / filteredWords.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default InstagramView;