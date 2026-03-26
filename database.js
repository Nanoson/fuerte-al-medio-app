const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'fuerte_al_medio.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error connecting to SQLite database:', err.message);
    } else {
        console.log('✅ Conectado a la Base de Datos Histórica (SQLite).');
        // Resguardamos las noticias raspadas de anoche (no hacer DROP) manteniendo la tabla y agregando columnas en vivo
        db.run(`
            CREATE TABLE IF NOT EXISTS articles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT,
                category TEXT,
                biasNeutralization INTEGER,
                date TEXT,
                summary TEXT,
                conflictPoints TEXT,
                sources TEXT,
                related TEXT,
                topicKey TEXT UNIQUE,
                likes INTEGER DEFAULT 0,
                dislikes INTEGER DEFAULT 0,
                userVotesCount INTEGER DEFAULT 0,
                userVotesSum INTEGER DEFAULT 0,
                comments TEXT DEFAULT '[]',
                importanceScore INTEGER DEFAULT 1,
                copete TEXT,
                imageUrl TEXT,
                youtubeQuery TEXT,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `, (err) => {
            if (err) {
                console.error("Error al verificar tabla:", err);
            } else {
                // Parcheo silencioso tolerante a fallos para sumar las métricas a nuestra base existente
                db.run(`ALTER TABLE articles ADD COLUMN userVotesCount INTEGER DEFAULT 0`, () => {});
                db.run(`ALTER TABLE articles ADD COLUMN userVotesSum INTEGER DEFAULT 0`, () => {});
                db.run(`ALTER TABLE articles ADD COLUMN importanceScore INTEGER DEFAULT 1`, () => {});
                db.run(`ALTER TABLE articles ADD COLUMN copete TEXT`, () => {});
                db.run(`ALTER TABLE articles ADD COLUMN imageUrl TEXT`, () => {});
                db.run(`ALTER TABLE articles ADD COLUMN youtubeQuery TEXT`, () => {});
                console.log('✅ Esquema V5 (Medios Visuales y Copete) estabilizado.');
            }
        });
    }
});

module.exports = db;
