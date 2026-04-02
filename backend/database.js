const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

pool.query(`
    CREATE TABLE IF NOT EXISTS articles (
        id SERIAL PRIMARY KEY,
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
        cortita TEXT,
        imageUrl TEXT,
        youtubeQuery TEXT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
`)
.then(() => {
    console.log('✅ Conectado a la Base de Datos Histórica en la Nube (PostgreSQL Neon).');
    console.log('✅ Esquema V5 (Medios Visuales y Copete) estabilizado.');
})
.catch(err => {
    console.error('Error al verificar tabla PG:', err);
});

module.exports = pool;
