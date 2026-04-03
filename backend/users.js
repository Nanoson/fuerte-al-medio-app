const pool = require('./database');
const { generateId } = require('./utils');

async function getUserProfile(userId) {
  try {
    const userResult = await pool.query(
      'SELECT id, email, username, profile_public, reputation_score, prediction_accuracy, created_at FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) return null;

    const user = userResult.rows[0];
    const credits = await pool.query(
      'SELECT COALESCE(SUM(balance), 0) as total FROM fam_credits WHERE user_id = $1',
      [userId]
    );

    return {
      ...user,
      fam_balance: parseInt(credits.rows[0]?.total || 0)
    };
  } catch (err) {
    console.error('Get user profile error:', err.message);
    return null;
  }
}

async function getPublicUserProfile(username) {
  try {
    const result = await pool.query(
      'SELECT id, username, profile_public, reputation_score, prediction_accuracy, created_at FROM users WHERE username = $1',
      [username]
    );
    return result.rows[0] || null;
  } catch (err) {
    return null;
  }
}

async function updateUserProfile(userId, updates) {
  try {
    const { username, bio, avatar } = updates;
    await pool.query(
      'UPDATE users SET username = $1, profile_public = $2, updated_at = NOW() WHERE id = $3',
      [username, JSON.stringify({ bio, avatar }), userId]
    );
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

async function getTopPredictors(limit = 10, offset = 0) {
  try {
    const result = await pool.query(
      `SELECT username, reputation_score, prediction_accuracy
       FROM users
       ORDER BY prediction_accuracy DESC, reputation_score DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return result.rows;
  } catch (err) {
    return [];
  }
}

async function getFamBalance(userId) {
  try {
    const result = await pool.query(
      'SELECT COALESCE(SUM(balance), 0) as total FROM fam_credits WHERE user_id = $1',
      [userId]
    );
    return parseInt(result.rows[0]?.total || 0);
  } catch (err) {
    return 0;
  }
}

async function claimDailyCredit(userId) {
  try {
    // Check if already claimed today
    const today = await pool.query(
      `SELECT id FROM fam_credits
       WHERE user_id = $1 AND earned_from = 'daily_read'
       AND created_at >= NOW() - INTERVAL '24 hours'`,
      [userId]
    );

    if (today.rows.length > 0) {
      return { success: false, error: 'Daily credit already claimed' };
    }

    const id = generateId();
    await pool.query(
      'INSERT INTO fam_credits (id, user_id, balance, earned_from) VALUES ($1, $2, $3, $4)',
      [id, userId, 1, 'daily_read']
    );
    return { success: true, credits_earned: 1 };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

module.exports = { getUserProfile, getPublicUserProfile, updateUserProfile, getTopPredictors, getFamBalance, claimDailyCredit };
