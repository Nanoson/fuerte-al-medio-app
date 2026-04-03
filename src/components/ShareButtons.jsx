import React, { useState } from 'react';
import '../styles/share.css';

const ShareButtons = ({ articleId, articleTitle, articleUrl = null, compact = false }) => {
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const baseUrl = articleUrl || `${window.location.origin}?article=${articleId}`;
  const encodedUrl = encodeURIComponent(baseUrl);
  const encodedTitle = encodeURIComponent(articleTitle);

  const shareOptions = [
    {
      platform: 'twitter',
      icon: '𝕏',
      label: 'Twitter',
      url: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`
    },
    {
      platform: 'whatsapp',
      icon: '💬',
      label: 'WhatsApp',
      url: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`
    },
    {
      platform: 'telegram',
      icon: '✈️',
      label: 'Telegram',
      url: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`
    },
    {
      platform: 'facebook',
      icon: 'f',
      label: 'Facebook',
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`
    }
  ];

  const handleShare = async (platform) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = token
        ? { Authorization: `Bearer ${token}` }
        : {};

      // Record the share
      await fetch(`/api/articles/${articleId}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        body: JSON.stringify({ platform })
      });

      // Open share link
      const option = shareOptions.find((o) => o.platform === platform);
      if (option) {
        window.open(option.url, '_blank', 'width=600,height=400');
      }
    } catch (error) {
      console.error('Error sharing:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(baseUrl);
      setCopied(true);

      // Record the share
      const token = localStorage.getItem('token');
      const headers = token
        ? { Authorization: `Bearer ${token}` }
        : {};

      await fetch(`/api/articles/${articleId}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        body: JSON.stringify({ platform: 'link' })
      });

      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error copying link:', error);
    }
  };

  if (compact) {
    return (
      <div className="share-buttons-compact">
        <button
          className="share-btn-icon"
          onClick={handleCopyLink}
          title="Copy link"
          disabled={loading}
        >
          🔗
        </button>
        {shareOptions.slice(0, 3).map((option) => (
          <button
            key={option.platform}
            className="share-btn-icon"
            onClick={() => handleShare(option.platform)}
            title={option.label}
            disabled={loading}
          >
            {option.icon}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="share-buttons">
      <div className="share-header">
        <h4>Share This Article</h4>
      </div>

      <div className="share-button-group">
        {shareOptions.map((option) => (
          <button
            key={option.platform}
            className="share-btn"
            onClick={() => handleShare(option.platform)}
            disabled={loading}
            title={`Share on ${option.label}`}
          >
            <span className="share-icon">{option.icon}</span>
            <span className="share-label">{option.label}</span>
          </button>
        ))}
      </div>

      <div className="share-divider">or</div>

      <button
        className="share-btn-link"
        onClick={handleCopyLink}
        disabled={loading}
      >
        <span className="link-icon">🔗</span>
        <span className="link-text">
          {copied ? '✓ Copied to clipboard' : 'Copy link'}
        </span>
      </button>

      {copied && <p className="share-success">Link copied! Ready to share.</p>}
    </div>
  );
};

export default ShareButtons;
