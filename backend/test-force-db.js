require('dotenv').config();
const { neutralizeArticles } = require('./neutralizer');
const db = require('./database');

const mockCluster = {
    mainTitle: "Nvidia announces new Blackwell AI chips",
    articles: [
        {
            title: "Nvidia unveils Blackwell B200, the 'world's most powerful chip' for AI",
            link: "https://techcrunch.com/nvidia-blackwell",
            content: "Nvidia has announced its next-generation AI chip, the Blackwell B200. This new architecture promises massive performance leaps for generative AI models, significantly reducing energy consumption for training massive LLMs.",
            source: { name: "TechCrunch", bias: "Silicon Valley" }
        }
    ]
};

async function testInsert() {
    try {
        console.log("Neutralizing piece...");
        const finalNews = await neutralizeArticles(mockCluster, []);
        
        console.log("Inserting into DB...");
        await db.query(`
            INSERT INTO articles (title, category, authorId, biasNeutralization, date, summary, conflictPoints, sources, related, topicKey, importanceScore, copete, imageUrl, youtubeQuery, relevancescore, imagecaption)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
            ON CONFLICT(topicKey) DO UPDATE SET 
                title=EXCLUDED.title, authorId=EXCLUDED.authorId, summary=EXCLUDED.summary, conflictPoints=EXCLUDED.conflictPoints, importanceScore=EXCLUDED.importanceScore, copete=EXCLUDED.copete, imageUrl=EXCLUDED.imageUrl, youtubeQuery=EXCLUDED.youtubeQuery, relevancescore=EXCLUDED.relevancescore, imagecaption=EXCLUDED.imagecaption, updatedAt=CURRENT_TIMESTAMP
        `, [
            finalNews.title,
            "Tecnología", // Enforcing interceptor behavior
            finalNews.authorId,
            finalNews.biasNeutralization,
            new Date().toLocaleDateString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' }),
            finalNews.summary,
            finalNews.conflictPoints,
            JSON.stringify(finalNews.sources),
            JSON.stringify([]),
            finalNews.topicKey || "nvidia_blackwell_test_" + Date.now(),
            1,
            finalNews.copete || finalNews.Copete || null,
            null,
            null,
            finalNews.relevanceScore || 50,
            null
        ]);
        console.log("✅ Tech article inserted successfully.");
        
        const res = await db.query("SELECT id, title, category, authorId FROM articles WHERE category = 'Tecnología' ORDER BY createdat DESC LIMIT 1");
        console.log("DB Content:", res.rows);
    } catch (e) {
        console.error("DB Insert Error:", e);
    } finally {
        process.exit(0);
    }
}

testInsert();
