const pool = require('./database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { generateId } = require('./utils');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const SALT_ROUNDS = 10;

async function signup(email, password, username) {
  try {
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return { success: false, error: 'Email already registered' };
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const userId = generateId();

    await pool.query(
      `INSERT INTO users (id, email, username, password_hash, profile_public)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, email, username || email.split('@')[0], passwordHash, JSON.stringify({ bio: '', avatar: null })]
    );

    const creditId = generateId();
    await pool.query(
      `INSERT INTO fam_credits (id, user_id, balance, earned_from)
       VALUES ($1, $2, $3, $4)`,
      [creditId, userId, 5, 'signup']
    );

    const token = jwt.sign(
      { id: userId, email },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    return {
      success: true,
      user: { id: userId, email, username: username || email.split('@')[0], fam_balance: 5 },
      token
    };
  } catch (err) {
    console.error('Signup error:', err.message);
    return { success: false, error: 'Signup failed: ' + err.message };
  }
}

async function login(email, password) {
  try {
    const result = await pool.query(
      'SELECT id, email, username, password_hash FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return { success: false, error: 'Invalid email or password' };
    }

    const user = result.rows[0];
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return { success: false, error: 'Invalid email or password' };
    }

    // Get FAM balance
    const credits = await pool.query(
      'SELECT COALESCE(SUM(balance), 0) as total FROM fam_credits WHERE user_id = $1',
      [user.id]
    );
    const famBalance = parseInt(credits.rows[0]?.total || 5);

    const token = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    return {
      success: true,
      user: { id: user.id, email: user.email, username: user.username, fam_balance: famBalance },
      token
    };
  } catch (err) {
    console.error('Login error:', err.message);
    return { success: false, error: 'Login failed' };
  }
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'No token provided' });

  const user = verifyToken(token);
  if (!user) return res.status(403).json({ error: 'Invalid token' });

  req.user = user;
  next();
}

function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    const user = verifyToken(token);
    if (user) req.user = user;
  }

  next();
}

module.exports = { signup, login, verifyToken, authenticateToken, optionalAuth };
