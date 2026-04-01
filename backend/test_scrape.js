require('dotenv').config();
const { fetchAllNews } = require('./scraper.js');
const { groupArticles } = require('./clustering.js');
const { neutralizeArticles } = require('./neutralizer.js');

async function testPipeline() {
    console.log("🚀 Iniciando Test de Recolección (Modo Local)...");
    
    try {
        let rawArticles = await fetchAllNews();
        console.log(`✅ Extracción RAW completada. Titulares crudos: ${rawArticles.length}`);
        
        if(rawArticles.length === 0) {
            console.log("❌ FALLA: El scraper no trajo nada. Problema en axios o rss-parser.");
            return;
        }

        let clusters = groupArticles(rawArticles);
        console.log(`✅ Agrupación completada. Clústers generados: ${clusters.length}`);
        
        // Forzar a probar el primer cluster
        let targetCluster = clusters[0];
        console.log(`\n🧠 Enviando a Gemini 1.5 Flash... Cluster [0]: ${targetCluster.articles[0].title}`);
        
        const finalNews = await neutralizeArticles(targetCluster, []);
        
        if (finalNews) {
            console.log(`\n🎉 ÉXITO TOTAL DE GEMINI:\n`);
            console.log(JSON.stringify(finalNews, null, 2));
        } else {
            console.log(`\n❌ FALLA NEURAL: Gemini devolvió NULL. El trycatch ocultó el error real.`);
        }
        
    } catch (e) {
        console.error("💥 CRASH MASIVO:", e);
    }
}

testPipeline();
