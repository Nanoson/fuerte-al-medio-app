require('dotenv').config();
const { neutralizeArticles } = require('./neutralizer');

const mockCluster = {
    mainTitle: "Apple announces new AI features for iOS 18",
    articles: [
        {
            title: "Apple introduces Apple Intelligence, its new suite of AI features",
            content: "Apple today announced Apple Intelligence, an AI system deeply integrated into iOS 18, iPadOS 18, and macOS Sequoia. It brings powerful generative AI models to iPhone, iPad, and Mac.",
            source: { name: "TechCrunch", bias: "Silicon Valley" }
        }
    ]
};

async function test() {
    try {
        console.log("Testing neutralizeArticles with Tech article...");
        const result = await neutralizeArticles(mockCluster, []);
        console.log("Resulting JSON:");
        console.log(JSON.stringify(result, null, 2));
    } catch (e) {
        console.error("Error:", e);
    } finally {
        process.exit(0);
    }
}

test();
