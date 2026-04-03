const pool = require('./database');
const { generateId } = require('./utils');

async function recordShare(articleId, userId, platform) {
  try {
    const id = generateId();
    await pool.query(
      'INSERT INTO shares (id, article_id, user_id, platform) VALUES ($1, $2, $3, $4)',
      [id, articleId, userId || null, platform]
    );
    return { success: true };
  } catch (err) {
    console.error('Record share error:', err.message);
    return { success: false, error: err.message };
  }
}

async function getShareCount(articleId) {
  try {
    const result = await pool.query(
      'SELECT COUNT(*) as count FROM shares WHERE article_id = $1',
      [articleId]
    );
    return parseInt(result.rows[0]?.count || 0);
  } catch (err) {
    return 0;
  }
}

async function getShareBreakdown(articleId) {
  try {
    const result = await pool.query(
      `SELECT platform, COUNT(*) as count
       FROM shares WHERE article_id = $1
       GROUP BY platform`,
      [articleId]
    );
    const breakdown = {};
    result.rows.forEach(row => { breakdown[row.platform] = parseInt(row.count); });
    return breakdown;
  } catch (err) {
    return {};
  }
}

async function getTrendingShares(hours = 24, limit = 10) {
  try {
    const result = await pool.query(
      `SELECT article_id, COUNT(*) as share_count
       FROM shares
       WHERE created_at > NOW() - INTERVAL '${hours} hours'
       GROUP BY article_id
       ORDER BY share_count DESC
       LIMIT $1`,
      [limit]
    );
    return result.rows;
  } catch (err) {
    return [];
  }
}

module.exports = { recordShare, getShareCount, getShareBreakdown, getTrendingShares };
