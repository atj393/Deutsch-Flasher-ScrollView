/**
 * AnalyticsDashboard Component - Flashcard Deutscher
 * 
 * Comprehensive learning analytics dashboard for Flashcard Deutscher.
 * Provides visual insights into study progress, learning patterns, and performance metrics.
 * 
 * Features:
 * - Overview tab: Key statistics and distribution charts
 * - Progress tab: Time-based progress tracking with interactive charts
 * - Analysis tab: Difficult words analysis and learning insights
 * - Data export functionality
 * - Responsive design for all devices
 * 
 * @param {Array} words - Array of flashcard words with learning data
 * @param {boolean} isVisible - Controls dashboard visibility
 * @param {Function} onClose - Callback function to close the dashboard
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { 
  getStatistics, 
  getChartData, 
  getDifficultWords, 
  formatTime,
  exportProgressData
} from './statisticsManager';

const AnalyticsDashboard = ({ words, isVisible, onClose }) => {
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [difficultWords, setDifficultWords] = useState([]);
  const [timeRange, setTimeRange] = useState(7);
  const [activeTab, setActiveTab] = useState('overview');

  // Load and refresh analytics data when dashboard becomes visible or data changes
  const loadAnalyticsData = useCallback(() => {
    const statistics = getStatistics();
    const chartDataRange = getChartData(timeRange);
    const difficult = getDifficultWords(words);
    
    setStats(statistics);
    setChartData(chartDataRange);
    setDifficultWords(difficult);
  }, [words, timeRange]);

  useEffect(() => {
    if (isVisible) {
      loadAnalyticsData();
    }
  }, [isVisible, loadAnalyticsData]);

  // Export user's learning progress as downloadable JSON file
  const handleExport = () => {
    const data = exportProgressData(words);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `flashcard-deutscher-progress-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isVisible || !stats) return null;

  const accuracyData = [
    { name: 'Correct', value: stats.totalStats.totalCorrectAnswers, color: '#4CAF50' },
    { name: 'Wrong', value: stats.totalStats.totalWrongAnswers, color: '#f44336' }
  ];

  const statusData = words.reduce((acc, word) => {
    acc[word.status] = (acc[word.status] || 0) + 1;
    return acc;
  }, {});

  const statusChartData = Object.entries(statusData).map(([status, count]) => ({
    name: status.charAt(0).toUpperCase() + status.slice(1),
    value: count,
    color: status === 'learned' ? '#4CAF50' : status === 'learning' ? '#FF9800' : '#2196F3'
  }));

  return (
    <div className="analytics-overlay">
      <div className="analytics-dashboard">
        <div className="analytics-header">
          <h2>📊 Flashcard Deutscher Analytics</h2>
          <button onClick={onClose} className="close-btn">×</button>
        </div>

        <div className="analytics-tabs">
          <button 
            className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button 
            className={`tab-btn ${activeTab === 'progress' ? 'active' : ''}`}
            onClick={() => setActiveTab('progress')}
          >
            Progress
          </button>
          <button 
            className={`tab-btn ${activeTab === 'analysis' ? 'active' : ''}`}
            onClick={() => setActiveTab('analysis')}
          >
            Analysis
          </button>
        </div>

        <div className="time-range-selector">
          <label>Time Range: </label>
          <select value={timeRange} onChange={(e) => setTimeRange(Number(e.target.value))}>
            <option value={7}>Last 7 days</option>
            <option value={14}>Last 14 days</option>
            <option value={30}>Last 30 days</option>
          </select>
          <button onClick={handleExport} className="export-btn">
            📥 Export Data
          </button>
        </div>

        <div className="analytics-content">
          {activeTab === 'overview' && (
            <div className="overview-tab">
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon">📚</div>
                  <div className="stat-content">
                    <h3>{stats.totalStats.wordsLearned}</h3>
                    <p>Words Learned</p>
                  </div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-icon">🔥</div>
                  <div className="stat-content">
                    <h3>{stats.streaks.current}</h3>
                    <p>Current Streak</p>
                    <small>Longest: {stats.streaks.longest} days</small>
                  </div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-icon">⏱️</div>
                  <div className="stat-content">
                    <h3>{formatTime(stats.totalStats.totalStudyTime)}</h3>
                    <p>Total Study Time</p>
                  </div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-icon">🎯</div>
                  <div className="stat-content">
                    <h3>{Math.round(stats.totalStats.averageAccuracy)}%</h3>
                    <p>Overall Accuracy</p>
                  </div>
                </div>
              </div>

              <div className="charts-grid">
                <div className="chart-container">
                  <h3>Word Status Distribution</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={statusChartData}
                        cx="50%"
                        cy="50%"
                        outerRadius={60}
                        dataKey="value"
                        label={({name, value}) => `${name}: ${value}`}
                      >
                        {statusChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="chart-container">
                  <h3>Answer Accuracy</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={accuracyData}
                        cx="50%"
                        cy="50%"
                        outerRadius={60}
                        dataKey="value"
                        label={({name, value}) => `${name}: ${value}`}
                      >
                        {accuracyData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'progress' && (
            <div className="progress-tab">
              <div className="chart-container large">
                <h3>Daily Study Progress</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="shortDate" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="wordsStudied" 
                      stroke="#2196F3" 
                      strokeWidth={2}
                      name="Words Studied"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="newWordsLearned" 
                      stroke="#4CAF50" 
                      strokeWidth={2}
                      name="New Words Learned"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="chart-container large">
                <h3>Study Time & Accuracy</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="shortDate" />
                    <YAxis yAxisId="left" orientation="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Bar 
                      yAxisId="left"
                      dataKey="timeSpent" 
                      fill="#FF9800" 
                      name="Study Time (minutes)"
                    />
                    <Line 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="accuracy" 
                      stroke="#4CAF50" 
                      strokeWidth={2}
                      name="Accuracy %"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {activeTab === 'analysis' && (
            <div className="analysis-tab">
              <div className="difficult-words-section">
                <h3>🔍 Most Challenging Words</h3>
                {difficultWords.length > 0 ? (
                  <div className="difficult-words-list">
                    {difficultWords.map((word, index) => (
                      <div key={index} className="difficult-word-card">
                        <div className="word-info">
                          <strong>{word.word}</strong>
                          <span className="meaning">{word.meaning}</span>
                        </div>
                        <div className="word-stats">
                          <span className="mistakes">❌ {word.mistakes} mistakes</span>
                          <span className={`accuracy ${word.accuracy < 50 ? 'low' : word.accuracy < 80 ? 'medium' : 'high'}`}>
                            {word.accuracy}% accuracy
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="no-data">No challenging words yet! Keep studying to see your progress.</p>
                )}
              </div>

              <div className="learning-insights">
                <h3>💡 Learning Insights</h3>
                <div className="insights-grid">
                  <div className="insight-card">
                    <h4>Study Consistency</h4>
                    <p>
                      {stats.streaks.current >= 3 
                        ? "🔥 Great job maintaining your study streak!" 
                        : "📅 Try to study daily to build momentum."
                      }
                    </p>
                  </div>
                  
                  <div className="insight-card">
                    <h4>Learning Efficiency</h4>
                    <p>
                      {stats.totalStats.averageAccuracy >= 80 
                        ? "🎯 Excellent accuracy! You're mastering the material." 
                        : stats.totalStats.averageAccuracy >= 60
                        ? "📈 Good progress! Keep practicing challenging words."
                        : "💪 Focus on reviewing difficult words more frequently."
                      }
                    </p>
                  </div>
                  
                  <div className="insight-card">
                    <h4>Study Volume</h4>
                    <p>
                      {stats.totalStats.totalSessions >= 10 
                        ? "📚 You're building great study habits!" 
                        : "⏰ Try to increase your study frequency for better retention."
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
