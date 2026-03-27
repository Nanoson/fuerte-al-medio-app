require('dotenv').config({ path: __dirname + '/.env' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function checkToxicArticles() {
    console.log("🔍 Escaneando Base de Datos buscando Artículos Tóxicos...");
    try {
        const { rows } = await pool.query(`SELECT id, title, authorId, createdat FROM articles ORDER BY createdat DESC LIMIT 30;`);
        
        const validIds = [
            "cuesta_pol", "herrera_mer", "conti_dep", "lemoine_esp",
            "valmont_pol", "sanchez_gen", "rossi_pol", "beltran_mer",
            "gomez_dep", "vega_esp", "mendez_pol", "paz_mer",
            "cruz_dep", "rios_esp", "blanco_pol", "vidal_mer"
        ];
        
        console.log(`\n📅 Últimas 5 Notas (Para ver si Scrapeó estando apagada):`);
        rows.slice(0,5).forEach(r => console.log(`   - [${new Date(r.createdat).toLocaleString('es-AR')}] ${r.title}`));
        
        console.log(`\n⚠️ Analizando Author IDs en últimas 30 notas:`);
        let toxicFound = 0;
        rows.forEach(r => {
            if (!validIds.includes(r.authorid)) {
                console.log(`   ❌ TÓXICO DETECTADO: ID: ${r.id} | Author: "${r.authorid}" | Nota: ${r.title.substring(0,30)}`);
                toxicFound++;
            }
        });

        if(toxicFound === 0) console.log("   ✅ Ningún artículo tóxico detectado por campo AuthorId.");
        
    } catch (err) {
        console.error("❌ Error DB:", err.message);
    } finally {
        pool.end();
    }
}

checkToxicArticles();
