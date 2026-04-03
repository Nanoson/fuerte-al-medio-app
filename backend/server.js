const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const db = require('./database');
require('dotenv').config();

const { fetchAllNews, scrapeArticleBody } = require('./scraper');
const { groupArticles } = require('./clustering');
const { neutralizeArticles, neutralizeTrends } = require('./neutralizer');
const { fetchMarkets } = require('./markets');
const { fetchSocialTrends } = require('./trends');
const auth = require('./auth');
const users = require('./users');

const Parser = require('rss-parser');
const rssParser = new Parser();

async function getLiveTrends() {
    try {
        let feed = await rssParser.parseURL('https://trends.google.com/trending/rss?geo=AR');
        return feed.items.map(item => item.title).slice(0, 15);
    } catch(e) {
        console.error("Trends RSS Error:", e.message);
        return [];
    }
}

const app = express();
app.use(cors());
app.use(express.json());

// ---------------------------------------------------
// REST API - COTIZACIONES & LECTURA
// ---------------------------------------------------
app.get('/api/markets', async (req, res) => {
    const data = await fetchMarkets();
    res.json(data);
});

// Endpoint Público/Cron para forzar despertar del clúster (Hibernation Bypass)
app.get('/api/force-scrape', async (req, res) => {
    console.log("⚡ INYECCIÓN CLOUD: Activando Scraper forzado vía /api/force-scrape (Cron-job.org)");
    runScrapingCycle(); // Corremos el ciclo en background de manera no-bloqueante
    res.json({ success: true, message: "Scraping cycle deployed to background workers." });
});

const formatRowToArticle = (row) => ({
    id: row.id,
    authorId: row.authorid || 'cuesta_pol',
    title: row.title,
    category: row.category,
    biasNeutralization: row.biasneutralization,
    date: row.date,
    summary: row.summary,
    conflictPoints: row.conflictpoints,
    sources: typeof row.sources === 'string' ? JSON.parse(row.sources) : (row.sources || []),
    related: typeof row.related === 'string' ? JSON.parse(row.related) : (row.related || []),
    topicKey: row.topickey,
    likes: row.likes,
    dislikes: row.dislikes,
    userVotesCount: row.uservotescount,
    userVotesSum: row.uservotessum,
    comments: typeof row.comments === 'string' ? JSON.parse(row.comments) : (row.comments || []),
    importanceScore: row.importancescore,
    relevanceScore: row.relevancescore || 50,
    copete: row.copete,
    cortita: row.cortita,
    imageUrl: row.imageurl,
    youtubeQuery: row.youtubequery,
    createdAt: row.createdat,
    updatedAt: row.updatedat
});

let apiNewsCache = { data: null, timestamp: 0 };
const CACHE_TTL_MS = 60 * 1000;

app.get('/api/news', async (req, res) => {
    try {
        const articleId = req.query.articleId;
        
        const now = Date.now();
        if (!articleId && apiNewsCache.data && (now - apiNewsCache.timestamp < CACHE_TTL_MS)) {
            return res.json(apiNewsCache.data);
        }

        let queryStr = `
            SELECT * FROM articles WHERE category != 'OPINIONES DE LECTORES' AND createdat >= NOW() - INTERVAL '3 days'
            UNION ALL
            (SELECT * FROM articles WHERE category = 'OPINIONES DE LECTORES' ORDER BY createdat DESC LIMIT 60)
        `;
        let params = [];

        if (articleId && !isNaN(parseInt(articleId))) {
            queryStr += ` UNION ALL SELECT * FROM articles WHERE id = $1`;
            params = [parseInt(articleId)];
        }

        const finalQuery = `SELECT * FROM (${queryStr}) AS t ORDER BY updatedat DESC`;
        const { rows } = await db.query(finalQuery, params);
        const formattedData = rows.map(formatRowToArticle);

        if (!articleId) {
            apiNewsCache.data = formattedData;
            apiNewsCache.timestamp = now;
        }

        res.json(formattedData);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/search', async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) return res.json([]);
        const { rows } = await db.query(`SELECT * FROM articles WHERE title ILIKE $1 OR summary ILIKE $1 OR copete ILIKE $1 ORDER BY updatedat DESC LIMIT 150`, [`%${q}%`]);
        res.json(rows.map(formatRowToArticle));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ---------------------------------------------------
// REST API - OPINIONES DE LECTORES
// ---------------------------------------------------
app.post('/api/opinions', async (req, res) => {
    const { alias, title, body } = req.body;
    try {
        if (!alias || !title || !body) return res.status(400).json({error: "Los campos Nombre/Alias, Título y Cuerpo son estrictamente obligatorios"});
        if (body.trim().length < 15) return res.status(400).json({error: "La nota es demasiado corta. Debe tener al menos 15 caracteres."});
        if (body.length > 1200) return res.status(400).json({error: "Límite de 1200 caracteres excedido"});
        
        const profanityRegex = /\b(puto|puta|putos|putas|pelotudo|pelotuda|boludo|boluda|mierda|carajo|forro|forra|concha|mongolico|mogólico|mogolica|trola|trolo|trolazo|tarado|tarada|idiota|imbecil|imbécil|pito|choto|chota|verga|culo|orto)\b/i;
        if (profanityRegex.test(body) || profanityRegex.test(title) || profanityRegex.test(alias)) {
            return res.status(400).json({error: "Lenguaje Inapropiado: No se admiten insultos, agresiones ni palabras obscenas."});
        }
        
        await db.query(`
            INSERT INTO articles (title, category, authorId, biasNeutralization, date, summary, conflictPoints, sources, related, topicKey, importanceScore, copete, cortita, imageUrl, youtubeQuery, relevancescore)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        `, [
            title,
            'OPINIONES DE LECTORES',
            'lector_invitado',
            50,
            new Date().toLocaleDateString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' }),
            body,
            "Opinión personal del lector.",
            "[]",
            "[]",
            "opinion_" + Date.now() + Math.random().toString(36).substring(7),
            1,
            alias || "Anónimo",
            null,
            null,
            null,
            50
        ]);
        res.json({success: true});
    } catch(err) {
        console.error("Error posteando opinion:", err);
        res.status(500).json({error: err.message});
    }
});

// ---------------------------------------------------
// REST API - VOTOS CÍVICOS E HILOS TWITTER-LIKE
// ---------------------------------------------------
app.post('/api/news/:id/action', async (req, res) => {
    const { id } = req.params;
    const { type, commentObj, score } = req.body; 

    try {
        if (type === 'vote' && typeof score === 'number') {
            // Fase 48: Votos modificables (Deltas)
            const isChange = req.body.isChange || false;
            const deltaCount = req.body.deltaCount !== undefined ? req.body.deltaCount : (isChange ? 0 : 1);
            // Si es un cambio o undo, el 'score' que viene del cliente es la diferencia (scoreDelta) entre el voto nuevo y el viejo.
            await db.query(`UPDATE articles SET userVotesCount = GREATEST(COALESCE(userVotesCount, 0) + $1, 0), userVotesSum = COALESCE(userVotesSum, 0) + $2 WHERE id = $3`, [deltaCount, Number(score), Number(id)]);
            res.json({ success: true });
        } else if (type === 'comment' && commentObj) {
            const { rows } = await db.query(`SELECT comments FROM articles WHERE id = $1`, [id]);
            if(rows.length > 0) {
                const row = rows[0];
                let commentsArr = typeof row.comments === 'string' ? JSON.parse(row.comments) : (row.comments || []);
                commentsArr.push({ 
                    id: commentObj.id || Date.now().toString() + Math.random().toString(36).substr(2,5),
                    parentId: commentObj.parentId || null,
                    name: commentObj.name || 'Anónimo', 
                    text: commentObj.text, 
                    date: new Date().toISOString() 
                });
                await db.query(`UPDATE articles SET comments = $1 WHERE id = $2`, [JSON.stringify(commentsArr), id]);
                res.json({ success: true, comments: commentsArr });
            } else {
                res.status(404).json({ error: 'News not found' });
            }
        }
    } catch (err) {
        console.error("Action Error:", err.message);
        res.status(500).json({ error: err.message });
    }
});

// ---------------------------------------------------
// REST API - ANALÍTICAS & FEEDBACK (FASE 36)
// ---------------------------------------------------
app.post('/api/track', async (req, res) => {
    const { type, articleId, timeSpent, targetId } = req.body;
    try {
        if (type === 'article_view' && articleId) {
            await db.query(`UPDATE articles SET views = COALESCE(views, 0) + 1, reading_time_secs = COALESCE(reading_time_secs, 0) + $1 WHERE id = $2`, [timeSpent || 0, articleId]);
        } else if (type === 'author_click' && targetId) {
            await db.query(`INSERT INTO analytics (metric_type, target_id, count) VALUES ('author_click', $1, 1) ON CONFLICT (metric_type, target_id) DO UPDATE SET count = analytics.count + 1`, [targetId]);
        }
        res.json({ success: true });
    } catch (error) {
        console.error("Tracker Error:", error.message);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/feedback', async (req, res) => {
    const { contextId, userName, message } = req.body;
    try {
        await db.query(`INSERT INTO feedback (context_id, user_name, message) VALUES ($1, $2, $3)`, [contextId || 'general', userName || 'Anónimo', message]);
        res.json({ success: true });
    } catch (error) {
        console.error("Feedback Error:", error.message);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/dashboard', async (req, res) => {
    try {
        const totalArticles = await db.query(`SELECT COUNT(*) as count FROM articles`);
        const totalViews = await db.query(`SELECT SUM(views) as total FROM articles`);
        const totalReadTime = await db.query(`SELECT SUM(reading_time_secs) as total FROM articles`);
        const totalVotes = await db.query(`SELECT SUM(userVotesCount) as total FROM articles`);
        
        const topArticles = await db.query(`SELECT id, title, views, category FROM articles ORDER BY views DESC LIMIT 6`);
        const topAuthors = await db.query(`SELECT target_id, count FROM analytics WHERE metric_type = 'author_click' ORDER BY count DESC LIMIT 6`);
        const recentFeedback = await db.query(`SELECT id, context_id, user_name, message, created_at FROM feedback ORDER BY created_at DESC LIMIT 10`);
        
        // Fase 44: Agregaciones Avanzadas y Time-Series (Hotfix - Mapeo de Columnas Nativas y DATE_TRUNC)
        const avgVote = await db.query(`SELECT CAST(SUM(userVotesSum) AS FLOAT)/SUM(userVotesCount) as avg_score FROM articles WHERE userVotesCount > 0`);
        const viewsByDay = await db.query(`SELECT DATE_TRUNC('day', createdAt) as day, SUM(views) as total_views FROM articles GROUP BY DATE_TRUNC('day', createdAt) ORDER BY day DESC LIMIT 14`);
        const timeByDay = await db.query(`SELECT DATE_TRUNC('day', createdAt) as day, SUM(reading_time_secs) as total_time FROM articles GROUP BY DATE_TRUNC('day', createdAt) ORDER BY day DESC LIMIT 14`);
        const articlesByDay = await db.query(`SELECT DATE_TRUNC('day', createdAt) as day, COUNT(*) as count FROM articles GROUP BY DATE_TRUNC('day', createdAt) ORDER BY day DESC LIMIT 14`);
        const topVoted = await db.query(`SELECT id, title, userVotesCount, CAST(userVotesSum AS FLOAT)/userVotesCount as "objScore", category FROM articles WHERE userVotesCount > 0 ORDER BY userVotesCount DESC LIMIT 10`);

        // Sumar todos los comentarios extraídos de la columna JSON (Estimación vía longitud string o asumiendo ~1 por entrada)
        const commentsQuery = await db.query(`SELECT id, title, category, comments FROM articles WHERE comments IS NOT NULL AND comments != '[]'`);
        let totalComments = 0;
        let allCommentsData = [];
        commentsQuery.rows.forEach(r => {
            const arr = typeof r.comments === 'string' ? JSON.parse(r.comments) : (r.comments || []);
            totalComments += arr.length;
            if (arr.length > 0) {
                allCommentsData.push({ id: r.id, title: r.title, category: r.category, commentCount: arr.length });
            }
        });
        allCommentsData.sort((a,b) => b.commentCount - a.commentCount);
        const topCommented = allCommentsData.slice(0, 10);

        res.json({
            metrics: {
                articles: parseInt(totalArticles.rows[0].count) || 0,
                views: parseInt(totalViews.rows[0].total) || 0,
                readTime: parseInt(totalReadTime.rows[0].total) || 0,
                votes: parseInt(totalVotes.rows[0]?.total) || 0,
                avgVotePerc: Math.round(parseFloat(avgVote.rows[0]?.avg_score || 0)) || 0,
                comments: totalComments
            },
            viewsByDay: viewsByDay.rows,
            timeByDay: timeByDay.rows,
            articlesByDay: articlesByDay.rows,
            topVoted: topVoted.rows,
            topCommented: topCommented,
            topArticles: topArticles.rows,
            topAuthors: topAuthors.rows,
            feedback: recentFeedback.rows
        });
    } catch (error) {
        console.error("Dashboard Error:", error.message);
        res.status(500).json({ error: error.message });
    }
});

// ---------------------------------------------------
// EL RECOLECTOR (SCRAPER + AI NEUTRALIZER)
// ---------------------------------------------------
const runScrapingCycle = async () => {
    console.log(`\n[${new Date().toISOString()}] 🚀 Iniciando ciclo de Recolección de Portales...`);
    let rawArticles = [];
    let globalTrends = [];
    try {
        // FASE 56/59: Suspensión TOTAL de Tendencias Automáticas Requerida por el Editor
        // globalTrends = await getLiveTrends();
        globalTrends = []; 
        console.log(`📈 Tendencias Manuales Suspendidas (Cobertura Universal Activada).`);
        // 1. Raspar los 24 portales masivos
        rawArticles = await fetchAllNews();
        console.log(`✅ Extracción completada. Evaluando ${rawArticles.length} titulares crudos.`);
    } catch (error) {
        console.error(`⚠️ Error al raspar portales:`, error.message);
        return; // Stop the cycle if scraping fails
    }

    if(rawArticles.length === 0) {
        console.log(`⚠️ No se encontraron artículos para procesar.`);
        return;
    }

    let clusters = groupArticles(rawArticles);
    
    // FASE 56: GARANTÍA ABSOLUTA DE LAS PORTADAS DE LOS 3 GRANDES
    // Jerarquía Matemática: Las notas marcadas como `(Portada)` tienen Prioridad Cero sobre todo lo demás para ser Ingeridas por la IA.
    clusters.sort((a,b) => {
        const aHasPortada = a.articles.some(art => art.source?.name?.includes('(Portada)'));
        const bHasPortada = b.articles.some(art => art.source?.name?.includes('(Portada)'));
        
        // Prioridad 1: Que esté físicamente en la Portada de los diarios grandes (Infobae, Clarín, La Nación)
        if (aHasPortada && !bHasPortada) return -1;
        if (!aHasPortada && bHasPortada) return 1;

        // Prioridad 2: Volumen de Fuentes (Como siempre)
        const uniqueA = new Set(a.articles.map(art => art.source.name)).size;
        const uniqueB = new Set(b.articles.map(art => art.source.name)).size;
        if (uniqueB !== uniqueA) return uniqueB - uniqueA;
        return b.articles.length - a.articles.length;
    });

    console.log(`✅ Procesado: Se generaron ${clusters.length} tópicos súper-puestos.`);

    // Optimización extrema de Token-Cost: Bajamos de 80 a 25 el techo de clusters redactados por la IA.
    const topClusters = clusters.slice(0, 25);
    console.log(`🗞️ Ingeriendo la matriz del Top ${topClusters.length} de racimos noticiosos...`);

    // Helper anti-bloqueo: Retraso estratégico para prevenir baneos '429 Rate Limit' de Gemini (Límite orgánico 15 RPM)
    const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

    for(let i=0; i < topClusters.length; i++) {
        let targetCluster = topClusters[i];
        
        // Pausa obligatoria de 4 segundos entre notas para respetar el umbral de Google AI
        await sleep(4000); 

        console.log(`\n📰 [${i+1}/${topClusters.length}] Extrayendo: ${targetCluster.mainTitle.substring(0, 60)}... (Fuentes: ${targetCluster.articles.length})`);
        
        // Extraer maximo 3 notas por tema para no reventar el token limit de la IA
        const topSources = targetCluster.articles.slice(0, 3);
        let clusterImage = null;
        
        for(let art of topSources) {
            // Prioridad absoluta: Utilizar el atributo fotográfico prístino alojado nativamente en el Payload del RSS
            if (art.imageUrl && !clusterImage) clusterImage = art.imageUrl;
            
            const data = await scrapeArticleBody(art.link);
            if (data.isZombie) {
                console.log(`        🛑 Meta-Zombie Abortado: ${art.link}`);
                art.content = ""; // Marcado para purga silente
                continue;
            }
            art.content = data.text;
            
            // Refuerzo pasivo: Invocar DOM Scraping de la capa og:image si falló la estructura base
            if (data.imageUrl && !clusterImage) clusterImage = data.imageUrl;
        }
        targetCluster.articles = topSources;
        targetCluster.clusterImage = clusterImage;

        try {
            // Interceptores de Categoría: Fuerzan el Vertical si la IA falla
            let isInternacional = targetCluster.articles.some(a => ['BBC', 'New York', 'País', 'Tercera'].some(kw => a.source.name && a.source.name.includes(kw)));
            let isMercados = targetCluster.articles.some(a => ['Yahoo', 'Bloomberg', 'Financial'].some(kw => a.source.name && a.source.name.includes(kw)));
            
            // Fase 78: Interceptor Tecnología & Cripto
            let isTecnologia = targetCluster.articles.some(a => 
                ['TechCrunch', 'The Verge', 'Ars Technica', 'Wired', 'Hacker News', 'a16z', 'CoinDesk', 'Cointelegraph', 'The Block'].some(kw => a.source.name && a.source.name.includes(kw)) ||
                ['bitcoin', 'cripto', 'crypto', 'ethereum', 'tecnología', 'inteligencia artificial'].some(kw => a.title.toLowerCase().includes(kw))
            );

            const finalNews = await neutralizeArticles(targetCluster, globalTrends);
            if (finalNews) {
                if (isInternacional) finalNews.category = 'Internacional';
                if (isMercados) finalNews.category = 'Mercados';
                if (isTecnologia) finalNews.category = 'Tecnología';

                await db.query(`
                    INSERT INTO articles (title, category, authorId, biasNeutralization, date, summary, conflictPoints, sources, related, topicKey, importanceScore, copete, cortita, imageUrl, youtubeQuery, relevancescore, imagecaption)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
                    ON CONFLICT(topicKey) DO UPDATE SET 
                        title=EXCLUDED.title, authorId=EXCLUDED.authorId, summary=EXCLUDED.summary, conflictPoints=EXCLUDED.conflictPoints, importanceScore=EXCLUDED.importanceScore, copete=EXCLUDED.copete, cortita=EXCLUDED.cortita, imageUrl=EXCLUDED.imageUrl, youtubeQuery=EXCLUDED.youtubeQuery, relevancescore=EXCLUDED.relevancescore, imagecaption=EXCLUDED.imagecaption, updatedAt=CURRENT_TIMESTAMP
                `, [
                    finalNews.title,
                    finalNews.category,
                    finalNews.authorId || 'valmont_pol',
                    finalNews.biasNeutralization,
                    new Date().toLocaleDateString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' }),
                    finalNews.summary,
                    finalNews.conflictPoints,
                    JSON.stringify(finalNews.sources),
                    JSON.stringify([]),
                    finalNews.topicKey,
                    new Set(targetCluster.articles.map(a => a.source.name)).size,
                    finalNews.copete || finalNews.Copete || null,
                    finalNews.cortita || null,
                    targetCluster.clusterImage || null,
                    finalNews.youtubeQuery || null,
                    finalNews.relevanceScore || 50,
                    finalNews.imageCaption || null
                ]);
                console.log(`✨ Guardado en PostgreSQL [Firma: ${finalNews.authorId}]: "${finalNews.title.substring(0, 40)}..."`);
            }
        } catch (error) {
            console.error(`⚠️ Error neural en cluster ${i}:`, error.message);
        }
    }
    
    // -------------------------------------------------------------
    // FASE 41/59: BLOQUE SOCIOLÓGICO Y TENDENCIAS REDDIT (SUSPENDIDO)
    // El Jefe Editorial solicitó suspender temporalmente el scraping empírico de Redes Sociales.
    // -------------------------------------------------------------
    /*
    try {
        const globalSocialTrends = await fetchSocialTrends();
        console.log(`\n🗣️ Procesando Cerebro Analítico de Ethan Hayes (${globalSocialTrends.length} debates en total)...`);
        
        for (let j = 0; j < globalSocialTrends.length; j++) {
            let trendData = globalSocialTrends[j];
            const finalTrend = await neutralizeTrends(trendData);
            
            if (finalTrend) {
                await db.query(`
                    INSERT INTO articles (title, category, authorId, biasNeutralization, date, summary, conflictPoints, sources, related, topicKey, importanceScore, copete, cortita, imageUrl, youtubeQuery, relevancescore)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
                    ON CONFLICT(topicKey) DO UPDATE SET 
                        title=EXCLUDED.title, authorId=EXCLUDED.authorId, summary=EXCLUDED.summary, conflictPoints=EXCLUDED.conflictPoints, importanceScore=EXCLUDED.importanceScore, copete=EXCLUDED.copete, cortita=EXCLUDED.cortita, imageUrl=EXCLUDED.imageUrl, youtubeQuery=EXCLUDED.youtubeQuery, relevancescore=EXCLUDED.relevancescore, updatedAt=CURRENT_TIMESTAMP
                `, [
                    finalTrend.title,
                    finalTrend.category,
                    finalTrend.authorId || 'hayes_soc',
                    finalTrend.biasNeutralization,
                    new Date().toLocaleDateString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' }),
                    finalTrend.summary,
                    finalTrend.conflictPoints,
                    JSON.stringify(finalTrend.sources), // Guardamos los comentarios crudos aquí
                    JSON.stringify([]),
                    finalTrend.topicKey,
                    new Set(finalTrend.sources.map(s => s.name)).size, 
                    finalTrend.copete || "Métricas sociales analizadas",
                    null,
                    null, // Las tendencias no tienen porta hero images obligatorias
                    null,
                    finalTrend.relevanceScore || 65
                ]);
                console.log(`   └─✨ Informe de Tendencia Indexado: "${finalTrend.title.substring(0, 40)}..."`);
            }
            // Anti-Rate Limit local (Protegemos API de Gemini)
            await new Promise(resolve => setTimeout(resolve, 4000));
        }
    } catch (error) {
         console.error(`⚠️ Falla sistémica en el motor de Tendencias Sociales:`, error.message);
    }
    */

    console.log(`[${new Date().toISOString()}] 🏁 Ciclo de Recolección finalizado.`);
};

// Frecuencia optimizada económicamente: 1 iteración completa cada 2 horas
cron.schedule('0 */2 * * *', () => { runScrapingCycle(); });

// Endpoint público para despertar a Render y forzar un scrapeo asincrónico vía servicios externos (cron-job.org)
app.get('/api/force-scrape', async (req, res) => {
    res.json({ success: true, message: "🚀 Ciclo Maestro de Extracción iniciado en segundo plano." });
    runScrapingCycle();
});

// ---------------------------------------------------
// FASE 65: ENDPOINT DE DIAGNÓSTICO EN VIVO (TRANSPARENCIA CLOUD)
// ---------------------------------------------------
app.get('/api/debug-scraper', async (req, res) => {
    try {
        console.log("🔍 Sondeando Modelos de la API de Google...");
        const axios = require('axios');
        if (!process.env.GEMINI_API_KEY) {
            return res.json({ error: "No hay GEMINI_API_KEY configurada en el servidor en la nube." });
        }
        
        const response = await axios.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
        res.json({ success: true, list: response.data });
    } catch (e) {
        res.status(500).json({ error: "Crash cataclísmico en servidor:", detail: e.response ? e.response.data : e.message });
    }
});

// ---------------------------------------------------
// PHASE 1: AUTHENTICATION & USER MANAGEMENT
// ---------------------------------------------------

// AUTH ENDPOINTS
app.post('/api/auth/signup', async (req, res) => {
    const { email, password, username } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    try {
        const result = await auth.signup(email, password, username);
        if (result.success) res.json(result);
        else res.status(400).json(result);
    } catch (err) {
        console.error('Signup endpoint error:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    const result = await auth.login(email, password);
    if (result.success) res.json(result);
    else res.status(401).json(result);
});

app.post('/api/auth/logout', auth.authenticateToken, (req, res) => {
    res.json({ success: true, message: 'Logged out successfully' });
});

app.get('/api/auth/profile', auth.authenticateToken, async (req, res) => {
    const user = await users.getUserProfile(req.user.id);
    if (user) res.json(user);
    else res.status(404).json({ error: 'User not found' });
});

app.get('/api/user/fam-balance', auth.authenticateToken, async (req, res) => {
    const balance = await users.getFamBalance(req.user.id);
    res.json({ balance });
});

app.get('/api/user/profile/:username', async (req, res) => {
    const user = await users.getPublicUserProfile(req.params.username);
    if (user) res.json(user);
    else res.status(404).json({ error: 'User not found' });
});

app.put('/api/user/profile', auth.authenticateToken, async (req, res) => {
    const updated = await users.updateUserProfile(req.user.id, req.body);
    if (updated) res.json(updated);
    else res.status(500).json({ error: 'Failed to update profile' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`===============================================`);
    console.log(`🌐 Backend Scale V2 Activo -> Puerto ${PORT}`);
    console.log(`⚠️ Ciclo Automático en Boot ha sido BLOQUEADO para proteger Cuota API.`);
    console.log(`⏰ Próximo barrido cronológico programado por Node-Cron.`);
    console.log(`===============================================`);
});
