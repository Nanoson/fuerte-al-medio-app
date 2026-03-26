const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) return console.error("Error conectando a DB", err);
    
    db.all("SELECT category, COUNT(*) as count FROM articles GROUP BY category", [], (err, rows) => {
        console.log("=== DB CATEGORY STATS ===");
        if (err) console.error(err);
        else console.table(rows);
        
        db.all("SELECT title, category, sources FROM articles WHERE category = 'Internacional' OR sources LIKE '%BBC%' OR sources LIKE '%País%' OR sources LIKE '%NYT%' LIMIT 5", [], (err, rows) => {
             console.log("\n=== INTERNATIONAL SAMPLES ===");
             if (err) console.error(err);
             else {
                 rows.forEach(r => {
                     console.log(`- [${r.category}] ${r.title.substring(0,40)}... | Sources: ${r.sources.substring(0, 60)}...`);
                 });
             }
             db.close();
        });
    });
});
