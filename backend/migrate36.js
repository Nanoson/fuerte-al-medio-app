require('dotenv').config({ path: __dirname + '/.env' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function migrate() {
    console.log("Iniciando Migración de Base de Datos - Fase 36...");
    try {
        try {
            await pool.query('ALTER TABLE articles ADD COLUMN views INTEGER DEFAULT 0;');
            console.log("✅ Columna 'views' agregada a articles.");
        } catch(e) { console.log("⚠️ Columna 'views' ya existe."); }
        
        try {
            await pool.query('ALTER TABLE articles ADD COLUMN reading_time_secs INTEGER DEFAULT 0;');
            console.log("✅ Columna 'reading_time_secs' agregada a articles.");
        } catch(e) { console.log("⚠️ Columna 'reading_time_secs' ya existe."); }

        await pool.query(`
            CREATE TABLE IF NOT EXISTS feedback (
                id SERIAL PRIMARY KEY,
                context_id TEXT,
                user_name TEXT,
                message TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log("✅ Tabla 'feedback' operativa.");

        await pool.query(`
            CREATE TABLE IF NOT EXISTS analytics (
                id SERIAL PRIMARY KEY,
                metric_type TEXT, 
                target_id TEXT,
                count INTEGER DEFAULT 0,
                UNIQUE(metric_type, target_id)
            );
        `);
        console.log("✅ Tabla 'analytics' operativa.");

        console.log("🎉 Migración Fase 36 completada exitosamente.");
    } catch (err) {
        console.error("❌ Error Crítico:", err);
    } finally {
        pool.end();
    }
}

migrate();
