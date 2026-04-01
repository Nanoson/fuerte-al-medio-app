const axios = require('axios');

async function testReddit() {
    console.log("🔍 Sondeando r/argentina (Top del Día)...");
    try {
        const res = await axios.get('https://www.reddit.com/r/argentina/top.json?limit=1&t=day', {
            headers: { 'User-Agent': 'FuerteAlMedioBot/1.0' }
        });
        
        const topPost = res.data.data.children[0].data;
        console.log(`\n📌 TEMA DETECTADO: "${topPost.title}"`);
        console.log(`💬 Upvotes: ${topPost.score} | Comentarios: ${topPost.num_comments}`);
        console.log(`🔗 Permalink: https://reddit.com${topPost.permalink}`);

        console.log("\n🕵️‍♂️ Extrayendo Top 3 Comentarios del debate...");
        const commentsRes = await axios.get(`https://www.reddit.com${topPost.permalink}.json?sort=confidence`, {
            headers: { 'User-Agent': 'FuerteAlMedioBot/1.0' }
        });

        const comments = commentsRes.data[1].data.children.slice(0, 3).map(c => c.data);
        comments.forEach((c, idx) => {
            if (c.body && c.author) {
                console.log(`   [${idx+1}] @${c.author} (+${c.score}): "${c.body.substring(0, 100).replace(/\n/g, ' ')}..."`);
            }
        });

        console.log("\n✅ Pipeline Reddit API verificado.");
    } catch (e) {
        console.error("❌ Error interceptando Reddit:", e.message);
    }
}

testReddit();
