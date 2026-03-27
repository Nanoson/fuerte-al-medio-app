require('dotenv').config({ path: __dirname + '/.env' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function checkNote() {
    try {
        const { rows } = await pool.query(`SELECT id, title, sources, createdat FROM articles WHERE id = 211;`);
        if(rows.length > 0) {
            console.log(JSON.stringify(rows[0], null, 2));
        } else {
            console.log("Nota 211 no encontrada.");
        }
    } catch (err) {
        console.error("Error DB:", err.message);
    } finally {
        pool.end();
    }
}

checkNote();
