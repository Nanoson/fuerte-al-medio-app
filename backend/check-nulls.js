require('dotenv').config({ path: __dirname + '/.env' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function checkNulls() {
    try {
        const { rows } = await pool.query(`SELECT id, title, summary FROM articles ORDER BY createdat DESC LIMIT 30;`);
        
        let nulls = 0;
        rows.forEach(r => {
            if (!r.summary || !r.title) {
                console.log(`❌ ALERTA: ID ${r.id} tiene titulo o resumen nulo.`);
                nulls++;
            }
        });

        if(nulls === 0) console.log("✅ No hay propiedades críticas nulas en las últimas 30 notas.");
    } catch (err) {
        console.error("❌ Error DB:", err.message);
    } finally {
        pool.end();
    }
}

checkNulls();
