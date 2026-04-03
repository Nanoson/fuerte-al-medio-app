import React, { useState } from 'react';
import Leaderboard from './Leaderboard';
import TrendingSection from './TrendingSection';
import '../styles/sidebar.css';

export default function Sidebar() {
  const [activeTab, setActiveTab] = useState('trending');

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <button
          className={`tab-button ${activeTab === 'trending' ? 'active' : ''}`}
          onClick={() => setActiveTab('trending')}
        >
          🔥 Trending
        </button>
        <button
          className={`tab-button ${activeTab === 'leaderboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('leaderboard')}
        >
          🏆 Predictores
        </button>
      </div>

      <div className="sidebar-content">
        {activeTab === 'trending' && (
          <div className="trending-container">
            <h3>Tendencias Ahora</h3>
            <TrendingSection compact={true} />
          </div>
        )}

        {activeTab === 'leaderboard' && (
          <div className="leaderboard-container">
            <h3>Top Predictores</h3>
            <Leaderboard compact={true} limit={10} />
          </div>
        )}
      </div>

      <div className="sidebar-fam-info">
        <div className="fam-card">
          <span className="fam-icon">💰</span>
          <div className="fam-text">
            <p className="fam-label">FAM Credits</p>
            <p className="fam-subtitle">Gana tokens por participar</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
