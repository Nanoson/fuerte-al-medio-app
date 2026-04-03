const pool = require('./database');
const { generateId } = require('./utils');

async function addReaction(articleId, userId, reactionType) {
  try {
    const existing = await pool.query(
      'SELECT id, reaction_type FROM reactions WHERE article_id = $1 AND user_id = $2',
      [articleId, userId]
    );

    if (existing.rows.length > 0) {
      if (existing.rows[0].reaction_type === reactionType) {
        await pool.query('DELETE FROM reactions WHERE article_id = $1 AND user_id = $2', [articleId, userId]);
        return { success: true, action: 'removed' };
      } else {
        await pool.query(
          'UPDATE reactions SET reaction_type = $1 WHERE article_id = $2 AND user_id = $3',
          [reactionType, articleId, userId]
        );
        return { success: true, action: 'changed' };
      }
    }

    const id = generateId();
    await pool.query(
      'INSERT INTO reactions (id, article_id, user_id, reaction_type) VALUES ($1, $2, $3, $4)',
      [id, articleId, userId, reactionType]
    );
    return { success: true, action: 'added' };
  } catch (err) {
    console.error('Add reaction error:', err.message);
    return { success: false, error: err.message };
  }
}

async function getArticleReactions(articleId) {
  try {
    const result = await pool.query(
      `SELECT reaction_type, COUNT(*) as count
       FROM reactions WHERE article_id = $1
       GROUP BY reaction_type`,
      [articleId]
    );
    const reactions = { like: 0, love: 0, laugh: 0, wow: 0, angry: 0 };
    result.rows.forEach(row => { reactions[row.reaction_type] = parseInt(row.count); });
    return { success: true, reactions };
  } catch (err) {
    return { success: false, reactions: {} };
  }
}

async function getUserReaction(articleId, userId) {
  try {
    const result = await pool.query(
      'SELECT reaction_type FROM reactions WHERE article_id = $1 AND user_id = $2',
      [articleId, userId]
    );
    return result.rows.length > 0 ? result.rows[0].reaction_type : null;
  } catch (err) {
    return null;
  }
}

async function getTrendingReactions(hours = 24, limit = 10) {
  try {
    const result = await pool.query(
      `SELECT article_id, COUNT(*) as reaction_count
       FROM reactions
       WHERE created_at > NOW() - INTERVAL '${hours} hours'
       GROUP BY article_id
       ORDER BY reaction_count DESC
       LIMIT $1`,
      [limit]
    );
    return result.rows;
  } catch (err) {
    return [];
  }
}

module.exports = { addReaction, getArticleReactions, getUserReaction, getTrendingReactions };
