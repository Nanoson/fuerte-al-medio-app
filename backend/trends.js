const axios = require('axios');

const subreddits = [
    { name: 'argentina', category: 'Política', limit: 8 },
    { name: 'merval', category: 'Economía', limit: 5 },
    { name: 'RepublicaArgentina', category: 'Actualidad', limit: 4 },
    { name: 'BocaJuniors', category: 'Deportes', limit: 2 },
    { name: 'RiverPlate', category: 'Deportes', limit: 2 }
];

async function fetchSocialTrends() {
    console.log(`\n================================`);
    console.log(`🌐 ACTIVANDO MOTOR SOCIOLÓGICO (REDDIT API)`);
    console.log(`================================`);
    let trendingClusters = [];
    
    for (const sub of subreddits) {
        try {
            console.log(`📡 Sondeando r/${sub.name} (Top del Día)...`);
            const res = await axios.get(`https://www.reddit.com/r/${sub.name}/top.json?limit=${sub.limit}&t=day`, {
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) FuerteAlMedioBot/1.0' }
            });
            
            const posts = res.data.data.children.map(c => c.data).filter(p => !p.stickied && p.score > 20 && p.num_comments > 15);
            
            for (const post of posts) {
                // Fetch top comments for this post
                try {
                    const commentsRes = await axios.get(`https://www.reddit.com${post.permalink}.json?sort=confidence`, {
                        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) FuerteAlMedioBot/1.0' }
                    });
                    
                    const comments = commentsRes.data[1].data.children
                                    .slice(0, 15)
                                    .map(c => c.data)
                                    .filter(c => c.body && c.author && c.author !== 'AutoModerator' && c.body !== '[deleted]' && c.body !== '[removed]' && c.body.length > 25)
                                    .slice(0, 10);
                    
                    if (comments.length >= 4) {
                         trendingClusters.push({
                             mainTitle: post.title,
                             category: sub.category,
                             postUrl: `https://reddit.com${post.permalink}`,
                             author: post.author,
                             score: post.score,
                             content: `[SOCIOLÓGICO] TEMA DE DEBATE PÚBLICO: "${post.title}"\nCONTEXTO PROPORCIONADO POR EL CREADOR DEL DEBATE: ${post.selftext || 'Imagen/Video compartido sin texto.'}\n\nCOMENTARIOS MÁS VOTADOS POR LA SOCIEDAD:\n` + comments.map(c => `- @${c.author} (+${c.score} votos cívicos): "${c.body}"`).join('\n\n'),
                             sources: comments.map(c => ({
                                 name: `u/${c.author}`,
                                 url: `https://reddit.com${c.permalink}`,
                                 bias: `${c.score} Votos Sociales`,
                                 text: c.body
                             }))
                         });
                    }
                } catch (e) {
                    console.error(`❌ Error extrayendo comentarios del debate: ${post.title}`);
                }
                
                // Sleep imperativo para evadir el HTTP 429 Rate Limit
                await new Promise(r => setTimeout(r, 1200));
            }
        } catch (e) {
             console.error(`❌ Caída temporal del subreddit r/${sub.name} -`, e.message);
        }
    }
    
    console.log(`✅ Motor Sociológico Finalizado. Se extrajeron ${trendingClusters.length} matrices de debate social profundo.`);
    return trendingClusters;
}

module.exports = { fetchSocialTrends };
