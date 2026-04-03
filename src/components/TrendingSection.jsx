import React, { useState, useEffect } from 'react';
import '../styles/trending.css';

const TrendingSection = ({ limit = 20 }) => {
  const [trending, setTrending] = useState([]);
  const [activeTab, setActiveTab] = useState('reactions');
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState(24);

  useEffect(() => {
    fetchTrending();
  }, [activeTab, timeframe]);

  const fetchTrending = async () => {
    setLoading(true);
    try {
      let url = '';

      if (activeTab === 'reactions') {
        url = `/api/trending/reactions?limit=${limit}&hours=${timeframe}`;
      } else if (activeTab === 'shares') {
        url = `/api/trending/shares?limit=${limit}&hours=${timeframe}`;
      }

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setTrending(data);
      }
    } catch (error) {
      console.error('Error fetching trending:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTrendingScore = (item) => {
    if (activeTab === 'reactions') {
      return item.reaction_count;
    } else if (activeTab === 'shares') {
      return item.share_count;
    }
    return 0;
  };

  const getTopReaction = (item) => {
    if (activeTab === 'reactions' && item.reaction_breakdown) {
      const entries = Object.entries(item.reaction_breakdown);
      if (entries.length > 0) {
        return entries.sort((a, b) => b[1] - a[1])[0][0];
      }
    }
    return null;
  };

  const getTopPlatform = (item) => {
    if (activeTab === 'shares' && item.platform_breakdown) {
      const entries = Object.entries(item.platform_breakdown);
      if (entries.length > 0) {
        return entries.sort((a, b) => b[1] - a[1])[0][0];
      }
    }
    return null;
  };

  const getMetricLabel = () => {
    if (activeTab === 'reactions') return 'reactions';
    return 'shares';
  };

  if (loading) {
    return <div className="trending-loading">Loading trending...</div>;
  }

  return (
    <div className="trending-section">
      <div className="trending-header">
        <h2>🔥 Trending Now</h2>

        <div className="trending-controls">
          <div className="tab-selector">
            <button
              className={`tab ${activeTab === 'reactions' ? 'active' : ''}`}
              onClick={() => setActiveTab('reactions')}
            >
              😊 Reactions
            </button>
            <button
              className={`tab ${activeTab === 'shares' ? 'active' : ''}`}
              onClick={() => setActiveTab('shares')}
            >
              🔗 Shares
            </button>
          </div>

          <select
            value={timeframe}
            onChange={(e) => setTimeframe(parseInt(e.target.value))}
            className="timeframe-select"
          >
            <option value={24}>Last 24h</option>
            <option value={48}>Last 48h</option>
            <option value={72}>Last 3 days</option>
          </select>
        </div>
      </div>

      <div className="trending-list">
        {trending.length > 0 ? (
          trending.map((item, idx) => (
            <div key={item.article_id || idx} className="trending-item">
              <div className="item-rank">
                <span className="rank-number">#{idx + 1}</span>
              </div>

              <div className="item-content">
                <div className="item-title">Article #{item.article_id}</div>

                <div className="item-metrics">
                  {activeTab === 'reactions' && item.reaction_breakdown && (
                    <div className="metric-breakdown">
                      {Object.entries(item.reaction_breakdown)
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 3)
                        .map(([reaction, count]) => (
                          <span key={reaction} className="metric-item">
                            {getReactionEmoji(reaction)} {count}
                          </span>
                        ))}
                    </div>
                  )}

                  {activeTab === 'shares' && item.platform_breakdown && (
                    <div className="metric-breakdown">
                      {Object.entries(item.platform_breakdown)
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 3)
                        .map(([platform, count]) => (
                          <span key={platform} className="metric-item">
                            {getPlatformEmoji(platform)} {count}
                          </span>
                        ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="item-score">
                <div className="score-value">
                  {getTrendingScore(item)}
                </div>
                <div className="score-label">
                  {getMetricLabel()}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="trending-empty">
            <p>No trending {getMetricLabel()} yet. Start engaging!</p>
          </div>
        )}
      </div>

      {trending.length > 0 && (
        <div className="trending-footer">
          <p className="footer-text">
            {activeTab === 'reactions'
              ? '😊 Articles that spark the most reactions'
              : '🔗 Articles being shared the most across platforms'}
          </p>
        </div>
      )}
    </div>
  );
};

const getReactionEmoji = (reaction) => {
  const map = {
    'like': '👍',
    'love': '❤️',
    'laugh': '😂',
    'wow': '😮',
    'angry': '😠'
  };
  return map[reaction] || '👍';
};

const getPlatformEmoji = (platform) => {
  const map = {
    'twitter': '𝕏',
    'whatsapp': '💬',
    'telegram': '✈️',
    'facebook': 'f',
    'link': '🔗'
  };
  return map[platform] || '🔗';
};

export default TrendingSection;
