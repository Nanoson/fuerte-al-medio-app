require('dotenv').config({ path: __dirname + '/.env' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function purgeZombie() {
    try {
        console.log("🧹 Desintegrando Artículo Zombi ID 211 en PostgreSQL...");
        const res = await pool.query(`DELETE FROM articles WHERE id = 211;`);
        console.log(`✅ ¡Éxito! Eliminada la falsa noticia sobre el Halving de Bitcoin.`);
    } catch (err) {
        console.error("❌ Error DB:", err.message);
    } finally {
        pool.end();
    }
}

purgeZombie();
