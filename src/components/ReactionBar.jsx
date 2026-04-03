import React, { useState, useEffect } from 'react';
import '../styles/reactions.css';

const ReactionBar = ({ articleId, compact = false }) => {
  const [reactions, setReactions] = useState({});
  const [userReaction, setUserReaction] = useState(null);
  const [loading, setLoading] = useState(false);

  const reactionEmojis = [
    { type: 'like', emoji: '👍', label: 'Like' },
    { type: 'love', emoji: '❤️', label: 'Love' },
    { type: 'laugh', emoji: '😂', label: 'Laugh' },
    { type: 'wow', emoji: '😮', label: 'Wow' },
    { type: 'angry', emoji: '😠', label: 'Angry' }
  ];

  useEffect(() => {
    fetchReactions();
    checkUserReaction();
  }, [articleId]);

  const fetchReactions = async () => {
    try {
      const response = await fetch(`/api/articles/${articleId}/reactions`);
      if (response.ok) {
        const data = await response.json();
        setReactions(data.counts || {});
      }
    } catch (error) {
      console.error('Error fetching reactions:', error);
    }
  };

  const checkUserReaction = async () => {
    try {
      const response = await fetch(`/api/articles/${articleId}/my-reaction`);
      if (response.ok) {
        const data = await response.json();
        setUserReaction(data.reaction);
      }
    } catch (error) {
      console.error('Error checking user reaction:', error);
    }
  };

  const handleReaction = async (reactionType) => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please log in to react to articles');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/articles/${articleId}/react`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ reactionType })
      });

      if (response.ok) {
        // Update local state optimistically
        setUserReaction(reactionType);
        setReactions((prev) => ({
          ...prev,
          [reactionType]: (prev[reactionType] || 0) + 1
        }));

        // Refresh from server
        await new Promise((resolve) => setTimeout(resolve, 500));
        await fetchReactions();
      }
    } catch (error) {
      console.error('Error adding reaction:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalReactions = Object.values(reactions).reduce((a, b) => a + b, 0);

  if (compact) {
    return (
      <div className="reaction-bar-compact">
        <div className="reaction-summary">
          {totalReactions > 0 && (
            <span className="reaction-count">{totalReactions} reactions</span>
          )}
        </div>
        <div className="reaction-buttons-compact">
          {reactionEmojis.map((reaction) => (
            <button
              key={reaction.type}
              className={`reaction-btn-compact ${userReaction === reaction.type ? 'active' : ''}`}
              title={reaction.label}
              onClick={() => handleReaction(reaction.type)}
              disabled={loading}
            >
              <span className="emoji">{reaction.emoji}</span>
              {reactions[reaction.type] > 0 && (
                <span className="count">{reactions[reaction.type]}</span>
              )}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="reaction-bar">
      <div className="reaction-header">
        <h4>Reactions</h4>
        {totalReactions > 0 && (
          <span className="total-count">{totalReactions} total</span>
        )}
      </div>

      <div className="reaction-buttons">
        {reactionEmojis.map((reaction) => (
          <button
            key={reaction.type}
            className={`reaction-btn ${userReaction === reaction.type ? 'active' : ''}`}
            onClick={() => handleReaction(reaction.type)}
            disabled={loading}
            title={reaction.label}
          >
            <span className="emoji">{reaction.emoji}</span>
            <span className="label">{reaction.label}</span>
            {reactions[reaction.type] > 0 && (
              <span className="reaction-count">{reactions[reaction.type]}</span>
            )}
          </button>
        ))}
      </div>

      {totalReactions > 0 && (
        <div className="reaction-breakdown">
          {reactionEmojis.map((reaction) => {
            const count = reactions[reaction.type] || 0;
            if (count === 0) return null;

            const percentage = (count / totalReactions) * 100;
            return (
              <div key={reaction.type} className="reaction-stat">
                <span className="emoji">{reaction.emoji}</span>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
                <span className="percentage">{Math.round(percentage)}%</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ReactionBar;
