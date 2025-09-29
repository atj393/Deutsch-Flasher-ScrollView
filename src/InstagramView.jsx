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
  setSortBy,
  markCardAsViewed
}) => {
  // Track which card is currently visible
  const [visibleCardId, setVisibleCardId] = useState(null);
  // Settings panel state
  const [isSettingsPanelOpen, setIsSettingsPanelOpen] = useState(false);
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
  
  // Find the currently visible card object
  const currentCard = filteredWords.find(card => card.id === visibleCardId) || filteredWords[0];
  
  // Get current card index for navigation
  const getCurrentCardIndex = () => {
    return filteredWords.findIndex(card => card.id === visibleCardId);
  };
  
  // Complete swipe animation after touch ends
  const completeSwipeAnimation = (direction) => {
    if (!nextCardId) return;
    
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
    if (index >= 0 && index < filteredWords.length) {
      const targetCard = filteredWords[index];
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
    if (filteredWords.length > 0 && !visibleCardId) {
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
        if (absTransform > 50 && !nextCardId) {
          const currentIndex = getCurrentCardIndex();
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
          
          setNextCardId(filteredWords[nextIndex].id);
          setSwipeDirection(direction);
        }
      }
      
      setTouchEnd({
        x: e.targetTouches[0].clientX,
        y: currentY,
      });
    };

    const handleTouchEndNonPassive = () => {
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

  // Cleanup animation timeout on unmount
  useEffect(() => {
    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, []);
  
  return (
    <div 
      ref={containerRef}
      className="instagram-view-container"
    >
      {/* Study Mode Indicator */}
      <div className="study-mode-indicator">
        <div className={`mode-badge ${studyMode}`}>
          <span className="material-icons">
            {studyMode === 'random' && 'shuffle'}
            {studyMode === 'new' && 'auto_awesome'}
            {studyMode === 'learning' && 'visibility'}
            {studyMode === 'review' && 'priority_high'}
            {studyMode === 'learned' && 'task_alt'}
            {studyMode === 'browse' && 'explore'}
          </span>
          <span className="mode-text">
            {studyMode === 'random' && 'Random'}
            {studyMode === 'new' && 'New'}
            {studyMode === 'learning' && 'Viewed'}
            {studyMode === 'review' && 'Difficult'}
            {studyMode === 'learned' && 'Learned'}
            {studyMode === 'browse' && 'Browse'}
          </span>
        </div>
      </div>

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
              onRate={handleQualityOrStatusRating}
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