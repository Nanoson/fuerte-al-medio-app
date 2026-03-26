const dotenv = require('dotenv');
const { Pool } = require('pg');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function migrateAuthors() {
    console.log('[MIGRATION] Iniciando inyección de Identidad Editorial...');

    try {
        console.log('[MIGRATION] Alterando tabla articles...');
        await db.query(`ALTER TABLE articles ADD COLUMN IF NOT EXISTS authorId TEXT`);
        
        console.log('[MIGRATION] Ejecutando asignaciones retroactivas...');
        
        const updates = [
            { cat: 'Espectáculos', author: 'lemoine_esp' },
            { cat: 'Deportes', author: 'conti_dep' },
            { cat: 'Mercados', author: 'herrera_mer' },
            { cat: 'Política', author: 'cuesta_pol' },
            { cat: 'Economía y Negocios', author: 'cuesta_pol' },
            { cat: 'Internacional', author: 'cuesta_pol' }
        ];

        let totalUpdated = 0;

        for (const u of updates) {
            const result = await db.query(`UPDATE articles SET authorId = $1 WHERE category = $2 AND authorId IS NULL`, [u.author, u.cat]);
            console.log(`[MIGRATION] ${result.rowCount} notas de '${u.cat}' firmadas por ${u.author}`);
            totalUpdated += result.rowCount;
        }

        const wildcard = await db.query(`UPDATE articles SET authorId = $1 WHERE authorId IS NULL`, ['cuesta_pol']);
        console.log(`[MIGRATION] ${wildcard.rowCount} notas huérfanas firmadas por cuesta_pol`);
        totalUpdated += wildcard.rowCount;

        console.log(`\n[MIGRATION EXITOSA] Total de Notas Históricas Firmadas: ${totalUpdated}`);
    } catch (err) {
        console.error('[FATAL ERROR]', err);
    } finally {
        await db.end();
        process.exit(0);
    }
}

migrateAuthors();
