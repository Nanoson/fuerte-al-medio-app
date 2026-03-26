require('dotenv').config();
const db = require('./database');

db.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('❌ Error conectando a Neon:', err.message);
        process.exit(1);
    } else {
        console.log('✅ PostgreSQL Connection Valid. Server Time:', res.rows[0].now);
        process.exit(0);
    }
});
