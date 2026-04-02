const Parser = require('rss-parser');
const parser = new Parser();

async function getRssTrends() {
    try {
        console.log("🌐 Conectando a Google Trends RSS Oficial (AR)...");
        let feed = await parser.parseURL('https://trends.google.com/trending/rss?geo=AR');
        
        console.log("✅ Top Tendencias en Argentina Hoy:");
        const keywords = feed.items.map(item => item.title).slice(0, 15);
        console.log(keywords.join(' | '));
        
    } catch(e) {
        console.error("❌ Error interceptando Google Trends RSS:", e.message);
    }
}

getRssTrends();
