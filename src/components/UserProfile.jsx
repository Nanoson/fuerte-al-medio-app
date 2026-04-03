import React, { useState, useEffect } from 'react';
import '../styles/profile.css';

const UserProfile = ({ userId, isCurrentUser = false, onClose }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});

  useEffect(() => {
    fetchProfile();
  }, [userId, isCurrentUser]);

  const fetchProfile = async () => {
    try {
      let endpoint;
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      if (isCurrentUser) {
        endpoint = '/api/auth/profile';
      } else {
        // Fetch by username - need to adjust based on userId being username or ID
        endpoint = `/api/user/profile/${userId}`;
      }

      const response = await fetch(endpoint, { headers });
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        setEditData(data.profile_public || {});
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(editData)
      });

      if (response.ok) {
        const updated = await response.json();
        setProfile({ ...profile, profile_public: editData });
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  if (loading) {
    return <div className="profile-loading">Loading profile...</div>;
  }

  if (!profile) {
    return <div className="profile-error">Profile not found</div>;
  }

  return (
    <div className="user-profile">
      <div className="profile-header">
        <div className="profile-avatar">
          {editData.avatar ? (
            <img src={editData.avatar} alt={profile.username} />
          ) : (
            <div className="avatar-placeholder">
              {profile.username?.charAt(0).toUpperCase() || '?'}
            </div>
          )}
        </div>

        <div className="profile-info">
          <h2 className="profile-username">{profile.username}</h2>
          <p className="profile-email">{profile.email}</p>

          <div className="profile-stats">
            <div className="stat">
              <span className="stat-label">Prediction Accuracy</span>
              <span className="stat-value">{profile.prediction_accuracy?.toFixed(1) || 0}%</span>
            </div>
            <div className="stat">
              <span className="stat-label">Reputation</span>
              <span className="stat-value">{profile.reputation_score || 0}</span>
            </div>
            {profile.fam_balance !== undefined && (
              <div className="stat">
                <span className="stat-label">FAM Credits</span>
                <span className="stat-value credit-value">💰 {profile.fam_balance}</span>
              </div>
            )}
          </div>
        </div>

        {isCurrentUser && (
          <button
            className="edit-btn"
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? 'Cancel' : 'Edit Profile'}
          </button>
        )}

        {onClose && (
          <button className="close-btn" onClick={onClose}>✕</button>
        )}
      </div>

      <div className="profile-content">
        {isEditing && isCurrentUser ? (
          <div className="profile-edit">
            <div className="edit-section">
              <label>Bio</label>
              <textarea
                value={editData.bio || ''}
                onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                placeholder="Tell us about yourself..."
                maxLength={300}
              />
              <span className="char-count">
                {(editData.bio || '').length}/300
              </span>
            </div>

            <div className="edit-section">
              <label>Avatar URL</label>
              <input
                type="url"
                value={editData.avatar || ''}
                onChange={(e) => setEditData({ ...editData, avatar: e.target.value })}
                placeholder="https://example.com/avatar.jpg"
              />
            </div>

            <div className="edit-section">
              <label>Interests</label>
              <input
                type="text"
                value={(editData.interests || []).join(', ')}
                onChange={(e) =>
                  setEditData({
                    ...editData,
                    interests: e.target.value.split(',').map(i => i.trim())
                  })
                }
                placeholder="e.g., Politics, Economics, Technology"
              />
            </div>

            <button className="save-btn" onClick={handleUpdateProfile}>
              Save Changes
            </button>
          </div>
        ) : (
          <div className="profile-view">
            {editData.bio && (
              <div className="bio-section">
                <h3>Bio</h3>
                <p>{editData.bio}</p>
              </div>
            )}

            {editData.interests && editData.interests.length > 0 && (
              <div className="interests-section">
                <h3>Interests</h3>
                <div className="interests-list">
                  {editData.interests.map((interest, idx) => (
                    <span key={idx} className="interest-tag">
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {isCurrentUser && (
              <div className="profile-actions">
                <h3>Account</h3>
                <div className="action-group">
                  <p>Member since {new Date(profile.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile;
