// src/components/BrowsePage.jsx
import React, { useState, useEffect, useMemo } from 'react';

const BrowsePage = ({ 
  isOpen, 
  onClose, 
  words,
  theme
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchLanguage, setSearchLanguage] = useState("both"); // "de", "en", "both"
  const [filteredWords, setFilteredWords] = useState([]);

  // Filter words based on search term and language (words only, not sentences)
  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) {
      return words;
    }

    const term = searchTerm.toLowerCase().trim();
    
    return words.filter((word) => {
      if (searchLanguage === "de") {
        return (
          word.word.toLowerCase().includes(term) ||
          (word.article && word.article.toLowerCase().includes(term)) ||
          word.type.toLowerCase().includes(term)
        );
      } else if (searchLanguage === "en") {
        return (
          word.meaning.toLowerCase().includes(term)
        );
      } else {
        // both languages
        return (
          word.word.toLowerCase().includes(term) ||
          word.meaning.toLowerCase().includes(term) ||
          (word.article && word.article.toLowerCase().includes(term)) ||
          word.type.toLowerCase().includes(term)
        );
      }
    });
  }, [words, searchTerm, searchLanguage]);

  // Update filtered words when search results change
  useEffect(() => {
    setFilteredWords(searchResults);
  }, [searchResults]);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'learned': return '#22c55e';
      case 'review': return '#ef4444';
      case 'learning': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'learned': return 'Learned';
      case 'review': return 'Difficult';
      case 'learning': return 'Viewed';
      default: return 'New';
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="browse-overlay"
        onClick={handleBackdropClick}
      />
      
      {/* Browse Page */}
      <div className="browse-page">
        {/* Header */}
        <div className="browse-header">
          <div className="browse-title">
            <span className="material-icons">search</span>
            <h2>Browse & Search</h2>
          </div>
          <button className="browse-close-btn" onClick={onClose}>
            <span className="material-icons">close</span>
          </button>
        </div>

        {/* Search Section */}
        <div className="search-section">
          <div className="search-input-container">
            <span className="material-icons search-icon">search</span>
            <input
              type="text"
              placeholder="Search words and meanings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            {searchTerm && (
              <button 
                className="clear-search-btn"
                onClick={() => setSearchTerm("")}
              >
                <span className="material-icons">clear</span>
              </button>
            )}
          </div>

          {/* Language Filter */}
          <div className="language-filter">
            <button
              className={`lang-btn ${searchLanguage === 'both' ? 'active' : ''}`}
              onClick={() => setSearchLanguage('both')}
            >
              <span className="material-icons">translate</span>
              Both
            </button>
            <button
              className={`lang-btn ${searchLanguage === 'de' ? 'active' : ''}`}
              onClick={() => setSearchLanguage('de')}
            >
              🇩🇪 DE
            </button>
            <button
              className={`lang-btn ${searchLanguage === 'en' ? 'active' : ''}`}
              onClick={() => setSearchLanguage('en')}
            >
              🇺🇸 EN
            </button>
          </div>
        </div>

        {/* Results Section */}
        <div className="search-results">
          <div className="results-header">
            <span className="results-count">
              {filteredWords.length} {filteredWords.length === 1 ? 'word' : 'words'} found
            </span>
          </div>

          <div className="words-list">
            {filteredWords.length > 0 ? (
              filteredWords.map((word) => (
                <div key={word.id} className="word-item">
                  <div className="word-main">
                    <div className="word-german">
                      {word.article && <span className="article">{word.article} </span>}
                      <span className="german-word">{word.word}</span>
                      {word.type && <span className="word-type">({word.type})</span>}
                    </div>
                    <div className="word-english">{word.meaning}</div>
                  </div>
                  
                  <div className="word-sentences">
                    <div className="sentence-german">{word.sentence}</div>
                    <div className="sentence-english">{word.sentenceMeaning}</div>
                  </div>

                  <div className="word-status-badge">
                    <span 
                      className="status-dot"
                      style={{ backgroundColor: getStatusColor(word.status) }}
                    ></span>
                    <span className="status-text">{getStatusLabel(word.status)}</span>
                  </div>
                </div>
              ))
            ) : searchTerm ? (
              <div className="no-results">
                <span className="material-icons">search_off</span>
                <p>No words found for "{searchTerm}"</p>
                <p className="no-results-hint">
                  Try searching in {searchLanguage === 'de' ? 'English' : searchLanguage === 'en' ? 'German' : 'a different term'}
                </p>
              </div>
            ) : (
              <div className="browse-placeholder">
                <span className="material-icons">search</span>
                <p>Start typing to search through {words.length} words</p>
                <p className="browse-hint">Search in German, English, or both languages</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default BrowsePage;