require('dotenv').config();
const db = require('./database');

async function test() {
    try {
        const { rows } = await db.query('SELECT id, title, "imageUrl" FROM articles ORDER BY "updatedAt" DESC LIMIT 5');
        console.log('--- RECIENTES ---');
        rows.forEach(r => console.log(`ID: ${r.id} | Img: ${r.imageUrl ? 'SI -> ' + r.imageUrl.substring(0, 50) + '...' : 'VACIO'} | Title: ${r.title.substring(0, 30)}`));
        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
}
test();
