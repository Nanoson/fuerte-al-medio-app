// One-time seed endpoint to create the admin user
// Accessible at: /api/seed-admin
const { getPool, ensureTables, generateId, signToken, bcrypt } = require('./_lib');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const pool = getPool();
  try {
    await ensureTables(pool);

    // Check if admin already exists
    const existing = await pool.query("SELECT id FROM users WHERE email = 'admin@fuerte.com'");
    if (existing.rows.length > 0) {
      return res.json({ success: true, message: 'Admin user already exists', email: 'admin@fuerte.com' });
    }

    const passwordHash = await bcrypt.hash('ADMIN', 10);
    const adminId = generateId();

    await pool.query(
      "INSERT INTO users (id, email, username, password_hash, role) VALUES ($1, $2, $3, $4, $5)",
      [adminId, 'admin@fuerte.com', 'ADMIN', passwordHash, 'admin']
    );
    await pool.query(
      'INSERT INTO fam_credits (id, user_id, balance, earned_from) VALUES ($1, $2, $3, $4)',
      [generateId(), adminId, 1000, 'admin_allocation']
    );

    const token = signToken(adminId, 'admin@fuerte.com');
    res.json({
      success: true,
      message: 'Admin user created successfully',
      credentials: { email: 'admin@fuerte.com', password: 'ADMIN' },
      token
    });
  } catch (err) {
    console.error('Seed admin error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  } finally {
    await pool.end();
  }
};
