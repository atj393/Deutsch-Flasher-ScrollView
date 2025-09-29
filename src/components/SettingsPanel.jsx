// src/components/SettingsPanel.jsx
import React from 'react';

const SettingsPanel = ({ 
  isOpen, 
  onClose, 
  studyMode, 
  setStudyMode,
  theme,
  toggleTheme,
  stats,
  resetData,
  setIsFlipped,
  setCurrentCardIndex,
  setSessionStartTime,
  setSessionStats,
  setCardHistory,
  setCurrentHistoryIndex
}) => {
  
  const handleModeChange = (mode) => {
    setStudyMode(mode);
    setCurrentCardIndex(0);
    setIsFlipped(false);
    setSessionStartTime(Date.now());
    setSessionStats({
      wordsStudied: 0,
      correctAnswers: 0,
      wrongAnswers: 0,
    });
    
    // Reset card history for random mode
    if (mode === 'random' && setCardHistory && setCurrentHistoryIndex) {
      setCardHistory([]);
      setCurrentHistoryIndex(-1);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <>
      {/* Overlay */}
      <div 
        className={`settings-overlay ${isOpen ? 'open' : ''}`}
        onClick={handleBackdropClick}
      />
      
      {/* Settings Panel */}
      <div className={`settings-panel ${isOpen ? 'open' : ''}`}>
        <div className="panel-header">
          <h2>Settings</h2>
          <button className="close-btn" onClick={onClose}>
            <span className="material-icons">close</span>
          </button>
        </div>

        {/* Progress Section - Moved to Top */}
        <div className="settings-section stats-section">
          <div className="section-header">
            <h3><span className="material-icons">analytics</span> Your Progress</h3>
            <p className="section-desc">Current learning statistics</p>
          </div>
          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-number">{stats.new || 0}</span>
              <span className="stat-label">New</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">{stats.learning || 0}</span>
              <span className="stat-label">Viewed</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">{stats.learned || 0}</span>
              <span className="stat-label">Learned</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">{stats.review || 0}</span>
              <span className="stat-label">Difficult</span>
            </div>
            <div className="stat-card due-card">
              <span className="stat-number">{stats.due || 0}</span>
              <span className="stat-label">Due Today</span>
            </div>
            {(stats.overdue || 0) > 0 && (
              <div className="stat-card overdue-card">
                <span className="stat-number">{stats.overdue || 0}</span>
                <span className="stat-label">Overdue</span>
              </div>
            )}
          </div>
        </div>

        {/* Study Modes Section - Enhanced */}
        <div className="settings-section study-modes-section">
          <div className="section-header">
            <h3><span className="material-icons">gps_fixed</span> Study Modes</h3>
            <p className="section-desc">Choose your learning approach - each mode uses SRS algorithm</p>
          </div>
          <div className="mode-grid study-modes">
            <button
              className={`mode-card ${studyMode === "random" ? "active" : ""}`}
              onClick={() => handleModeChange("random")}
            >
              <div className="mode-icon random">
                <span className="material-icons">shuffle</span>
              </div>
              <div className="mode-info">
                <h4>Smart Random (SRS)</h4>
                <p>Intelligent spaced repetition - prioritizes overdue and due cards while mixing in new words for optimal learning</p>
                <div className="mode-stats">SRS Algorithm • {stats.due || 0} due • {stats.overdue || 0} overdue</div>
              </div>
            </button>
            
            <button
              className={`mode-card ${studyMode === "new" ? "active" : ""}`}
              onClick={() => handleModeChange("new")}
            >
              <div className="mode-icon new">
                <span className="material-icons">auto_awesome</span>
              </div>
              <div className="mode-info">
                <h4>New Words</h4>
                <p>Shows ONLY words you've never seen before - completely fresh vocabulary that you haven't viewed yet</p>
                <div className="mode-stats">Never viewed • {stats.new || 0} cards available</div>
              </div>
            </button>
            
            <button
              className={`mode-card ${studyMode === "learning" ? "active" : ""}`}
              onClick={() => handleModeChange("learning")}
            >
              <div className="mode-icon learning">
                <span className="material-icons">visibility</span>
              </div>
              <div className="mode-info">
                <h4>Viewed Words</h4>
                <p>Shows ONLY words you've seen but haven't rated yet - cards that moved from new to viewed state</p>
                <div className="mode-stats">Seen but unrated • {stats.learning || 0} cards to rate</div>
              </div>
            </button>
            
            <button
              className={`mode-card ${studyMode === "review" ? "active" : ""}`}
              onClick={() => handleModeChange("review")}
            >
              <div className="mode-icon review">
                <span className="material-icons">priority_high</span>
              </div>
              <div className="mode-info">
                <h4>Difficult Words</h4>
                <p>Shows ONLY words you marked as difficult with thumbs down - your problem areas that need extra work</p>
                <div className="mode-stats">Need practice • {stats.review || 0} cards to improve</div>
              </div>
            </button>
            
            <button
              className={`mode-card ${studyMode === "learned" ? "active" : ""}`}
              onClick={() => handleModeChange("learned")}
            >
              <div className="mode-icon learned">
                <span className="material-icons">task_alt</span>
              </div>
              <div className="mode-info">
                <h4>Learned Words</h4>
                <p>Shows ONLY words you marked as learned with thumbs up - vocabulary you've successfully mastered</p>
                <div className="mode-stats">Mastered • {stats.learned || 0} cards learned</div>
              </div>
            </button>
          </div>
        </div>

        {/* App Controls */}
        <div className="settings-section">
          <h3><span className="material-icons">settings</span> App Controls</h3>
          <div className="control-group">
            <div className="control-item">
              <span className="control-label">Theme</span>
              <button className="control-button" onClick={toggleTheme}>
                <span className="material-icons">
                  {theme === "light" ? "dark_mode" : "light_mode"}
                </span>
                {theme === "light" ? "Dark" : "Light"}
              </button>
            </div>
            
            <div className="control-item">
              <span className="control-label">Reset Data</span>
              <button className="control-button" onClick={resetData}>
                <span className="material-icons">refresh</span>
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SettingsPanel;