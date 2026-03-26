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

app.get('/api/news', (req, res) => {
    db.all(`SELECT * FROM articles ORDER BY updatedAt DESC`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        
        const articles = rows.map(row => ({
            ...row,
            sources: JSON.parse(row.sources || '[]'),
            related: JSON.parse(row.related || '[]'),
            comments: JSON.parse(row.comments || '[]')
        }));
        res.json(articles);
    });
});

// ---------------------------------------------------
// REST API - VOTOS CÍVICOS E HILOS TWITTER-LIKE
// ---------------------------------------------------
app.post('/api/news/:id/action', (req, res) => {
    const { id } = req.params;
    const { type, commentObj, score } = req.body; 

    if (type === 'vote' && typeof score === 'number') {
        db.run(`UPDATE articles SET userVotesCount = COALESCE(userVotesCount, 0) + 1, userVotesSum = COALESCE(userVotesSum, 0) + ? WHERE id = ?`, [Number(score), Number(id)], function(err) {
            if(err) console.error("Vote Update Error:", err.message);
            res.json({ success: !err });
        });
    } else if (type === 'comment' && commentObj) {
        db.get(`SELECT comments FROM articles WHERE id = ?`, [id], (err, row) => {
            if(row) {
                let commentsArr = JSON.parse(row.comments || '[]');
                commentsArr.push({ 
                    id: commentObj.id || Date.now().toString() + Math.random().toString(36).substr(2,5),
                    parentId: commentObj.parentId || null,
                    name: commentObj.name || 'Anónimo', 
                    text: commentObj.text, 
                    date: new Date().toISOString() 
                });
                db.run(`UPDATE articles SET comments = ? WHERE id = ?`, [JSON.stringify(commentsArr), id], () => {
                    res.json({ success: true, comments: commentsArr });
                });
            } else {
                res.status(404).json({ error: 'News not found' });
            }
        });
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

    // Aumentamos a 80 el techo de recolección para cubrir inmensamente el ecosistema periodístico 
    const topClusters = clusters.slice(0, 80);
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

                const stmt = db.prepare(`
                    INSERT INTO articles (title, category, biasNeutralization, date, summary, conflictPoints, sources, related, topicKey, importanceScore, copete, imageUrl, youtubeQuery)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ON CONFLICT(topicKey) DO UPDATE SET 
                        title=excluded.title, summary=excluded.summary, conflictPoints=excluded.conflictPoints, importanceScore=excluded.importanceScore, copete=excluded.copete, imageUrl=excluded.imageUrl, youtubeQuery=excluded.youtubeQuery, updatedAt=CURRENT_TIMESTAMP
                `);
                
                stmt.run(
                    finalNews.title,
                    finalNews.category,
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
                );
                stmt.finalize();
                console.log(`✨ Guardado en SQLite (Score Relevancia: ${new Set(targetCluster.articles.map(a => a.source.name)).size}): "${finalNews.title.substring(0, 40)}..."`);
            }
        } catch (error) {
            console.error(`⚠️ Error neural en cluster ${i}:`, error.message);
        }
    }
    console.log(`[${new Date().toISOString()}] 🏁 Ciclo de Recolección finalizado.`);
};

cron.schedule('*/30 * * * *', () => { runScrapingCycle(); });

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`===============================================`);
    console.log(`🌐 Backend Scale V2 Activo -> Puerto ${PORT}`);
    console.log(`===============================================`);
    runScrapingCycle();
});
