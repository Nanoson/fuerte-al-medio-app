require('dotenv').config();
const db = require('./database');

async function test() {
    try {
        console.log("Checking DB for Tecnología...");
        const res = await db.query("SELECT id, title, category, createdat FROM articles WHERE category = 'Tecnología' ORDER BY createdat DESC LIMIT 5");
        console.log("Tecnología articles:", res.rows);
        
        const allCats = await db.query("SELECT category, COUNT(*) FROM articles GROUP BY category");
        console.log("All categories counts:", allCats.rows);
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
test();
