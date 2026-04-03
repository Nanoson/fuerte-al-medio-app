import { getPool, ensureTables, signToken, bcrypt } from '../_lib.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  const pool = getPool();
  try {
    await ensureTables(pool);

    const result = await pool.query(
      'SELECT id, email, username, password_hash FROM users WHERE email = $1',
      [email]
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ success: false, error: 'Invalid email or password' });

    const credits = await pool.query(
      'SELECT COALESCE(SUM(balance), 0) as total FROM fam_credits WHERE user_id = $1',
      [user.id]
    );
    const famBalance = parseInt(credits.rows[0]?.total || 5);

    const token = signToken(user.id, user.email);
    res.json({ success: true, user: { id: user.id, email: user.email, username: user.username, fam_balance: famBalance }, token });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  } finally {
    await pool.end();
  }
}
