// src/components/SettingsPanel.jsx
import React, { useState } from 'react';

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
  
  const [expandedMode, setExpandedMode] = useState(null);
  
  const toggleDescription = (mode) => {
    setExpandedMode(expandedMode === mode ? null : mode);
  };
  
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
    
    // Close the settings panel and show the cards immediately
    onClose();
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
            <p className="section-desc">All modes now use intelligent SRS scheduling for optimal learning efficiency</p>
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
                <div className="mode-header">
                  <h4>Smart Random (SRS)</h4>
                  <button 
                    className="info-toggle"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleDescription('random');
                    }}
                  >
                    <span className="material-icons">
                      {expandedMode === 'random' ? 'expand_less' : 'info_outline'}
                    </span>
                  </button>
                </div>
                <div className="mode-stats">SRS Algorithm • {stats.due || 0} due • {stats.overdue || 0} overdue</div>
                {expandedMode === 'random' && (
                  <p className="mode-description">Intelligent spaced repetition - prioritizes overdue and due cards while mixing in new words for optimal learning</p>
                )}
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
                <div className="mode-header">
                  <h4>New Words (SRS)</h4>
                  <button 
                    className="info-toggle"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleDescription('new');
                    }}
                  >
                    <span className="material-icons">
                      {expandedMode === 'new' ? 'expand_less' : 'info_outline'}
                    </span>
                  </button>
                </div>
                <div className="mode-stats">Systematic order • {stats.new || 0} cards available</div>
                {expandedMode === 'new' && (
                  <p className="mode-description">Fresh vocabulary ordered systematically - oldest first to ensure consistent learning progression through new material</p>
                )}
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
                <div className="mode-header">
                  <h4>Viewed Words (SRS)</h4>
                  <button 
                    className="info-toggle"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleDescription('learning');
                    }}
                  >
                    <span className="material-icons">
                      {expandedMode === 'learning' ? 'expand_less' : 'info_outline'}
                    </span>
                  </button>
                </div>
                <div className="mode-stats">SRS prioritized • {stats.learning || 0} cards to rate</div>
                {expandedMode === 'learning' && (
                  <p className="mode-description">Intelligent review of learning cards - prioritizes overdue and difficult words first, then by SRS schedule</p>
                )}
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
                <div className="mode-header">
                  <h4>Difficult Words (SRS)</h4>
                  <button 
                    className="info-toggle"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleDescription('review');
                    }}
                  >
                    <span className="material-icons">
                      {expandedMode === 'review' ? 'expand_less' : 'info_outline'}
                    </span>
                  </button>
                </div>
                <div className="mode-stats">Priority by difficulty • {stats.review || 0} cards to improve</div>
                {expandedMode === 'review' && (
                  <p className="mode-description">Smart review of problem words - overdue cards first, then by mistake count and difficulty level for focused practice</p>
                )}
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
                <div className="mode-header">
                  <h4>Learned Words (SRS)</h4>
                  <button 
                    className="info-toggle"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleDescription('learned');
                    }}
                  >
                    <span className="material-icons">
                      {expandedMode === 'learned' ? 'expand_less' : 'info_outline'}
                    </span>
                  </button>
                </div>
                <div className="mode-stats">Maintenance mode • {stats.learned || 0} cards learned</div>
                {expandedMode === 'learned' && (
                  <p className="mode-description">Maintenance review of mastered words - due cards first for spaced repetition, then recent learning for reinforcement</p>
                )}
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