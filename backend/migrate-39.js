require('dotenv').config({ path: __dirname + '/.env' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function migrate() {
    try {
        console.log("🛠️ Inyectando columna 'relevancescore' (Por Defecto: 50) en PostgreSQL...");
        // Add column if it doesn't exist
        await pool.query(`ALTER TABLE articles ADD COLUMN IF NOT EXISTS relevancescore INTEGER DEFAULT 50;`);
        
        console.log("✅ Migración Estructural Completada!");
    } catch (err) {
        console.error("❌ Error DB:", err.message);
    } finally {
        pool.end();
    }
}

migrate();
