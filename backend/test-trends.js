const googleTrends = require('google-trends-api');

async function getTrends() {
    try {
        console.log("🌐 Conectando a Google Trends (AR)...");
        const results = await googleTrends.dailyTrends({
            geo: 'AR',
        });
        
        const parsed = JSON.parse(results);
        const trendingSearches = parsed.default.trendingSearchesDays[0].trendingSearches;
        
        const keywords = trendingSearches.map(t => t.title.query).slice(0, 15);
        console.log("✅ Top 15 Tendencias en Argentina Hoy:");
        console.log(keywords.join(' | '));
        
    } catch(e) {
        console.error("❌ Error interceptando Google Trends:", e);
    }
}

getTrends();
