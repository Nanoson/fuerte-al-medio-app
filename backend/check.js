const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error("CONNECTION ERROR:", err);
    db.all("SELECT category, COUNT(*) as c FROM articles GROUP BY category", [], (e, r) => {
        if (e) console.log("QUERY ERROR:", e);
        else console.log("=== DB CATEGORIES ===", r);
        db.close();
    });
});
