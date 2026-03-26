const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, 'backend', 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) return console.error("SQL_ERR:", err);
    db.all("SELECT category, COUNT(*) as c FROM articles GROUP BY category", [], (err, rows) => {
        console.log("=== DB CATEGORY DISTRIBUTION ===");
        console.log(rows);
        
        db.all("SELECT title, category FROM articles LIMIT 5", [], (e, r) => console.log("Recent Notes:", r));
    });
});
