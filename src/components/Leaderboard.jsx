import React, { useState, useEffect } from 'react';
import '../styles/leaderboard.css';

const Leaderboard = ({ compact = false, limit = 10 }) => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('all-time');

  useEffect(() => {
    fetchLeaderboard();
  }, [limit]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/user/leaderboard?limit=${limit}&offset=0`);
      if (response.ok) {
        const data = await response.json();
        setLeaderboard(data);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMedalEmoji = (position) => {
    switch (position) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return '⭐';
    }
  };

  if (loading) {
    return <div className="leaderboard-loading">Loading leaderboard...</div>;
  }

  if (compact) {
    return (
      <div className="leaderboard-compact">
        <h3>Top Predictors</h3>
        <div className="leaderboard-list-compact">
          {leaderboard.slice(0, 5).map((user, idx) => (
            <div key={user.id} className="leaderboard-item-compact">
              <span className="position">{getMedalEmoji(idx + 1)}</span>
              <span className="username">{user.username}</span>
              <span className="accuracy">{user.prediction_accuracy?.toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="leaderboard">
      <div className="leaderboard-header">
        <h2>Prediction Leaderboard</h2>
        <div className="leaderboard-controls">
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="timeframe-select"
          >
            <option value="all-time">All Time</option>
            <option value="monthly">This Month</option>
            <option value="weekly">This Week</option>
          </select>
        </div>
      </div>

      <div className="leaderboard-table-wrapper">
        <table className="leaderboard-table">
          <thead>
            <tr>
              <th className="rank">Rank</th>
              <th className="user">Predictor</th>
              <th className="accuracy">Accuracy</th>
              <th className="reputation">Reputation</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((user, idx) => (
              <tr key={user.id} className={`rank-${idx + 1}`}>
                <td className="rank">
                  <span className="medal">{getMedalEmoji(idx + 1)}</span>
                  <span className="rank-num">{idx + 1}</span>
                </td>
                <td className="user">
                  <div className="user-info">
                    <div className="avatar">
                      {user.username?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <span className="username">{user.username}</span>
                  </div>
                </td>
                <td className="accuracy">
                  <span className="accuracy-badge">
                    {user.prediction_accuracy?.toFixed(1) || 0}%
                  </span>
                </td>
                <td className="reputation">
                  <span className="reputation-score">
                    ⭐ {user.reputation_score || 0}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {leaderboard.length === 0 && (
        <div className="leaderboard-empty">
          <p>No predictors yet. Be the first to start predicting!</p>
        </div>
      )}

      <div className="leaderboard-footer">
        <p className="footer-text">
          Rankings are based on prediction accuracy. Make more predictions and improve your score!
        </p>
      </div>
    </div>
  );
};

export default Leaderboard;
