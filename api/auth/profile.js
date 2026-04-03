const { getPool, verifyToken } = require('../_lib');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  const decoded = token ? verifyToken(token) : null;
  if (!decoded) return res.status(401).json({ error: 'Unauthorized' });

  const pool = getPool();
  try {
    const result = await pool.query(
      'SELECT id, email, username, role, reputation_score, prediction_accuracy FROM users WHERE id = $1',
      [decoded.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });

    const credits = await pool.query(
      'SELECT COALESCE(SUM(balance), 0) as total FROM fam_credits WHERE user_id = $1',
      [decoded.id]
    );
    const user = result.rows[0];
    res.json({ ...user, fam_balance: parseInt(credits.rows[0]?.total || 0) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    await pool.end();
  }
};
