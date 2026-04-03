import { getPool, ensureTables, generateId, signToken, bcrypt } from '../_lib.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, password, username } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  const pool = getPool();
  try {
    await ensureTables(pool);

    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ success: false, error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = generateId();
    const displayName = username || email.split('@')[0];

    await pool.query(
      'INSERT INTO users (id, email, username, password_hash) VALUES ($1, $2, $3, $4)',
      [userId, email, displayName, passwordHash]
    );
    await pool.query(
      'INSERT INTO fam_credits (id, user_id, balance, earned_from) VALUES ($1, $2, $3, $4)',
      [generateId(), userId, 5, 'signup']
    );

    const token = signToken(userId, email);
    res.json({ success: true, user: { id: userId, email, username: displayName, fam_balance: 5 }, token });
  } catch (err) {
    console.error('Signup error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  } finally {
    await pool.end();
  }
}
