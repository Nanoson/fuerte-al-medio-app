require('dotenv').config({ path: __dirname + '/.env' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function checkLatest() {
    try {
        const { rows } = await pool.query(`SELECT id, title, createdat, importancescore FROM articles ORDER BY createdat DESC LIMIT 10;`);
        
        console.log("📅 ÚLTIMOS 10 ARTÍCULOS EN LA BASE DE DATOS:");
        rows.forEach(r => {
            console.log(`- [${new Date(r.createdat).toLocaleString('es-AR')}] Importancia: ${r.importancescore} | ${r.title.substring(0, 60)}`);
        });

    } catch (err) {
        console.error("❌ Error DB:", err.message);
    } finally {
        pool.end();
    }
}

checkLatest();
