const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const db = require('./database');
require('dotenv').config();

const { fetchAllNews, scrapeArticleBody } = require('./scraper');
const { groupArticles } = require('./clustering');
const { neutralizeArticles } = require('./neutralizer');
const { fetchMarkets } = require('./markets');

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

app.get('/api/news', async (req, res) => {
    try {
        const { rows } = await db.query(`SELECT * FROM articles ORDER BY updatedat DESC`);
        const articles = rows.map(row => ({
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
            copete: row.copete,
            imageUrl: row.imageurl,
            youtubeQuery: row.youtubequery,
            createdAt: row.createdat,
            updatedAt: row.updatedat
        }));
        res.json(articles);
    } catch (err) {
        res.status(500).json({ error: err.message });
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
            await db.query(`UPDATE articles SET userVotesCount = COALESCE(userVotesCount, 0) + 1, userVotesSum = COALESCE(userVotesSum, 0) + $1 WHERE id = $2`, [Number(score), Number(id)]);
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
// EL RECOLECTOR (SCRAPER + AI NEUTRALIZER)
// ---------------------------------------------------
const runScrapingCycle = async () => {
    console.log(`\n[${new Date().toISOString()}] 🚀 Iniciando ciclo de Recolección de Portales...`);
    let rawArticles = [];
    try {
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
    
    // Jerarquía Matemática: Priorizar por VOLUMEN DE FUENTES ÚNICAS DISTINTAS impactando la matriz de relevancia
    clusters.sort((a,b) => {
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
            art.content = data.text;
            
            // Refuerzo pasivo: Invocar DOM Scraping de la capa og:image si falló la estructura base
            if (data.imageUrl && !clusterImage) clusterImage = data.imageUrl;
        }
        targetCluster.articles = topSources;
        targetCluster.clusterImage = clusterImage;

        try {
            // Forzar categoría Internacional interceptando rutas foráneas explícitas (Bypassea AI hallucinations)
            let isInternacional = targetCluster.articles.some(a => ['BBC', 'New York', 'País', 'Tercera'].some(kw => a.source.name && a.source.name.includes(kw)));
            
            const finalNews = await neutralizeArticles(targetCluster);
            if (finalNews) {
                if (isInternacional) finalNews.category = 'Internacional';
                let isMercados = targetCluster.articles.some(a => ['Yahoo', 'Bloomberg', 'Financial'].some(kw => a.source.name && a.source.name.includes(kw)));
                if (isMercados) finalNews.category = 'Mercados';

                await db.query(`
                    INSERT INTO articles (title, category, authorId, biasNeutralization, date, summary, conflictPoints, sources, related, topicKey, importanceScore, copete, imageUrl, youtubeQuery)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
                    ON CONFLICT(topicKey) DO UPDATE SET 
                        title=EXCLUDED.title, authorId=EXCLUDED.authorId, summary=EXCLUDED.summary, conflictPoints=EXCLUDED.conflictPoints, importanceScore=EXCLUDED.importanceScore, copete=EXCLUDED.copete, imageUrl=EXCLUDED.imageUrl, youtubeQuery=EXCLUDED.youtubeQuery, updatedAt=CURRENT_TIMESTAMP
                `, [
                    finalNews.title,
                    finalNews.category,
                    finalNews.authorId || 'valmont_pol',
                    finalNews.biasNeutralization,
                    new Date().toLocaleDateString('es-AR'),
                    finalNews.summary,
                    finalNews.conflictPoints,
                    JSON.stringify(finalNews.sources),
                    JSON.stringify([]),
                    finalNews.topicKey,
                    new Set(targetCluster.articles.map(a => a.source.name)).size,
                    finalNews.copete || finalNews.Copete || null,
                    targetCluster.clusterImage || null,
                    finalNews.youtubeQuery || null
                ]);
                console.log(`✨ Guardado en PostgreSQL [Firma: ${finalNews.authorId}]: "${finalNews.title.substring(0, 40)}..."`);
            }
        } catch (error) {
            console.error(`⚠️ Error neural en cluster ${i}:`, error.message);
        }
    }
    console.log(`[${new Date().toISOString()}] 🏁 Ciclo de Recolección finalizado.`);
};

// Frecuencia optimizada económicamente: 1 iteración completa cada 2 horas
cron.schedule('0 */2 * * *', () => { runScrapingCycle(); });

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`===============================================`);
    console.log(`🌐 Backend Scale V2 Activo -> Puerto ${PORT}`);
    console.log(`⚠️ Ciclo Automático en Boot ha sido BLOQUEADO para proteger Cuota API.`);
    console.log(`⏰ Próximo barrido cronológico programado por Node-Cron.`);
    console.log(`===============================================`);
});
