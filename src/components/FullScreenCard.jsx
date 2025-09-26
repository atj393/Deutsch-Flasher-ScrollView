// src/components/FullScreenCard.jsx
import React, { useRef, useState, useEffect } from 'react';

const FullScreenCard = ({ 
  card, 
  isFlipped, 
  isVisible, 
  onFlip, 
  onRate, 
  onReset 
}) => {
  const touchStart = useRef(null);
  const touchEnd = useRef(null);

  const handleCardClick = (e) => {
    // Only flip if clicking directly on card content areas, not buttons
    const isButtonClick = e.target.closest('button') || e.target.closest('.insta-card-controls');
    
    if (!isButtonClick) {
      onFlip();
    }
  };

  // Touch gesture handlers for mobile swipe
  const handleTouchStart = (e) => {
    touchEnd.current = null;
    touchStart.current = e.targetTouches[0].clientY;
  };

  const handleTouchMove = (e) => {
    touchEnd.current = e.targetTouches[0].clientY;
  };

  const handleTouchEnd = () => {
    if (!touchStart.current || !touchEnd.current) return;
    
    const distance = touchStart.current - touchEnd.current;
    const isUpSwipe = distance > 50;
    const isDownSwipe = distance < -50;
    
    if (isUpSwipe && isVisible) {
      onRate(1); // Swipe up = Learned
    }
    if (isDownSwipe && isVisible) {
      onRate(0); // Swipe down = Review
    }
  };

  return (
    <div 
      className={`flashcard instagram-style ${isFlipped ? 'flipped' : ''}`}
      onClick={handleCardClick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="card-content">
        {/* Front of card - German */}
        <div className="front">
          <span className={`card-status status-${card.status || 'new'}`} title="Card status">
            {card.status || 'new'}
          </span>
          
          <p>
            {card.type && (
              <span className="word-type">({card.type})</span>
            )}
          </p>
          
          <div className="word-header">
            {card.article && card.article.trim() && (
              <span className="article">{card.article} </span>
            )}
            <span className="german-word">
              {card.word}
              <button
                className="copy-btn copy-superscript"
                onClick={(e) => {
                  e.stopPropagation();
                  const textToCopy = card.article ? 
                    `${card.article} ${card.word}` : 
                    card.word;
                  navigator.clipboard.writeText(textToCopy);
                }}
                title="Copy German word"
              >
                <span className="material-icons">content_copy</span>
              </button>
            </span>
          </div>
          
          <div className="german-sentence">
            {card.sentence}
            <button
              className="copy-btn copy-superscript"
              onClick={(e) => {
                e.stopPropagation();
                navigator.clipboard.writeText(card.sentence);
              }}
              title="Copy German sentence"
            >
              <span className="material-icons">content_copy</span>
            </button>
          </div>
        </div>
        
        {/* Back of card - English */}
        <div className="back">
          <div className="english-word">{card.meaning}</div>
          <div className="english-sentence">{card.sentenceMeaning}</div>
        </div>
      </div>
      
      {/* Rating buttons - visible when card is active */}
      {isVisible && (
        <div className="insta-card-controls">
          <div className="card-rating-buttons">
            <button
              className={`card-rating-btn rating-up ${card.status === 'learned' ? 'active' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                onRate(1);
              }}
              title="Learned - Easy and confident (↑ key)"
            >
              <span className="material-icons">thumb_up</span>
            </button>
            <button
              className="card-rating-btn flip-btn"
              onClick={(e) => {
                e.stopPropagation();
                onFlip();
              }}
              title="Flip Card (Space key)"
            >
              <span className="material-icons">flip</span>
            </button>
            <button
              className="card-rating-btn rating-reset"
              onClick={(e) => {
                e.stopPropagation();
                onReset();
              }}
              title="Reset to New state (Right Shift key)"
            >
              <span className="material-icons">refresh</span>
            </button>
            <button
              className={`card-rating-btn rating-down ${card.status === 'review' ? 'active' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                onRate(0);
              }}
              title="Needs Review - Needs more practice (↓ key)"
            >
              <span className="material-icons">thumb_down</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FullScreenCard;