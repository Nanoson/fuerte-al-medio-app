require('dotenv').config({ path: __dirname + '/.env' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function purgeToxic() {
    try {
        console.log("🧹 Iniciando purga de artículos corruptos con NULL en PostgreSQL...");
        const res = await pool.query(`DELETE FROM articles WHERE summary IS NULL OR title IS NULL;`);
        console.log(`✅ ¡Éxito! Eliminados ${res.rowCount} artículos fantasma que ocasionaban fallos mortales en la iteración de React.`);
    } catch (err) {
        console.error("❌ Error DB:", err.message);
    } finally {
        pool.end();
    }
}

purgeToxic();
