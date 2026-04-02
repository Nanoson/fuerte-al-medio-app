require('dotenv').config({ path: './backend/.env' });
const db = require('./database');

async function run() {
    try {
        await db.query('ALTER TABLE articles ADD COLUMN cortita TEXT;');
        console.log('✅ Columna cortita añadida con éxito a la base de datos PostgreSQL Neon.');
    } catch(err) {
        if (err.message.includes('already exists') || err.message.includes('ya existe')) {
            console.log('🆗 La columna cortita ya existía en la base de datos.');
        } else {
            console.error('❌ Error al alterar la tabla:', err);
        }
    } finally {
        process.exit(0);
    }
}

run();
