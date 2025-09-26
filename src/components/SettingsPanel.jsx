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
  showAnalytics,
  setShowAnalytics,
  resetData,
  setIsFlipped,
  setCurrentCardIndex,
  setSessionStartTime,
  setSessionStats
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

        {/* Study Mode Selection */}
        <div className="settings-section">
          <h3>Study Mode</h3>
          <div className="mode-selector">
            <button
              className={studyMode === "random" ? "active" : ""}
              onClick={() => handleModeChange("random")}
            >
              <span className="material-icons">shuffle</span>
              Random
            </button>
            <button
              className={studyMode === "new" ? "active" : ""}
              onClick={() => handleModeChange("new")}
            >
              <span className="material-icons">fiber_new</span>
              New
            </button>
            <button
              className={studyMode === "learning" ? "active" : ""}
              onClick={() => handleModeChange("learning")}
            >
              <span className="material-icons">school</span>
              Learning
            </button>
            <button
              className={studyMode === "review" ? "active" : ""}
              onClick={() => handleModeChange("review")}
            >
              <span className="material-icons">quiz</span>
              Review
            </button>
            <button
              className={studyMode === "learned" ? "active" : ""}
              onClick={() => handleModeChange("learned")}
            >
              <span className="material-icons">check_circle</span>
              Learned
            </button>
            <button
              className={studyMode === "browse" ? "active" : ""}
              onClick={() => handleModeChange("browse")}
            >
              <span className="material-icons">search</span>
              Browse
            </button>
          </div>
        </div>

        {/* Statistics */}
        <div className="settings-section stats-section">
          <h3>Progress</h3>
          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-number">{stats.new || 0}</span>
              <span className="stat-label">New</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">{stats.learning || 0}</span>
              <span className="stat-label">Learning</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">{stats.learned || 0}</span>
              <span className="stat-label">Learned</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">{stats.review || 0}</span>
              <span className="stat-label">Review</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">{stats.due || 0}</span>
              <span className="stat-label">Due</span>
            </div>
          </div>
        </div>

        {/* App Controls */}
        <div className="settings-section">
          <h3>App Controls</h3>
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
              <span className="control-label">Analytics</span>
              <button 
                className="control-button" 
                onClick={() => setShowAnalytics(true)}
              >
                <span className="material-icons">analytics</span>
                View Analytics
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

        {/* Keyboard Shortcuts Info */}
        <div className="settings-section">
          <h3>Keyboard Shortcuts</h3>
          <div className="shortcuts-list">
            <div className="shortcut-item">
              <span className="shortcut-key">Space</span>
              <span className="shortcut-desc">Flip Card</span>
            </div>
            <div className="shortcut-item">
              <span className="shortcut-key">↑</span>
              <span className="shortcut-desc">Mark as Learned</span>
            </div>
            <div className="shortcut-item">
              <span className="shortcut-key">↓</span>
              <span className="shortcut-desc">Mark for Review</span>
            </div>
            <div className="shortcut-item">
              <span className="shortcut-key">Right Shift</span>
              <span className="shortcut-desc">Reset to New</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SettingsPanel;