const { removeStopwords, spa } = require('stopword');

function cleanTitle(title) {
    // Pasar a minúsculas y quitar puntuación
    const clean = title.toLowerCase().replace(/[^\w\sáéíóúüñ]/g, ' ');
    // Tokenizar
    const tokens = clean.split(/\s+/).filter(w => w.length > 2);
    // Quitar stopwords (español)
    return removeStopwords(tokens, spa);
}

function calculateSimilarity(tokens1, tokens2) {
    const set1 = new Set(tokens1);
    let intersection = 0;
    for (let token of tokens2) {
        if (set1.has(token)) intersection++;
    }
    // Jaccard similarity aprox o simplemente solapamiento sobre el más corto
    const minLen = Math.min(tokens1.length, tokens2.length);
    if(minLen === 0) return 0;
    return intersection / minLen; 
}

function groupArticles(articles) {
    // articles es un array de { title, link, source }
    let clusters = [];

    for (let article of articles) {
        const tokens = cleanTitle(article.title);
        article.tokens = tokens;
        
        // Agregar al primer cluster que haga match > 40%
        let matched = false;
        for (let cluster of clusters) {
            // Comparamos contra el título principal del cluster
            const sim = calculateSimilarity(tokens, cluster.mainTokens);
            if (sim > 0.40) { // Umbral bajo/medio para agrupar temas
                // Solo agregar si el SOURCE no está ya en el cluster (evitar 2 notas de Clarín juntas)
                const sourceExists = cluster.articles.some(a => a.source.name === article.source.name);
                if (!sourceExists) {
                    cluster.articles.push(article);
                    matched = true;
                    break;
                }
            }
        }

        if (!matched) {
            clusters.push({
                id: 'topic_' + Date.now() + '_' + Math.floor(Math.random()*1000),
                mainTitle: article.title,
                mainTokens: tokens,
                articles: [article]
            });
        }
    }

    // Para el lanzamiento masivo, permitimos clusters de 1 solo medio para rellenar el portal
    const relevantClusters = clusters.filter(c => c.articles.length >= 1);
    
    // Sort por cantidad de medios que lo cubren (Los super-temas primero)
    relevantClusters.sort((a,b) => b.articles.length - a.articles.length);

    return relevantClusters;
}

module.exports = { groupArticles };
