const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('c:/Users/msonzini/.gemini/antigravity/scratch/fuerte_al_medio/backend/database.sqlite', sqlite3.OPEN_READONLY, (err) => {
    if (err) return console.error("DB Error:", err);
    
    db.all("SELECT category, COUNT(*) as count FROM articles GROUP BY category", [], (err, rows) => {
        console.log("=== DB CATEGORY DISTRIBUTION ===");
        console.table(rows);
    });
});
