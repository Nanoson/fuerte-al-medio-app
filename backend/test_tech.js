const Parser = require('rss-parser');
const parser = new Parser({
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36' }
});

const techUrls = [
    'https://techcrunch.com/feed/',
    'https://www.theverge.com/rss/index.xml',
    'https://feeds.arstechnica.com/arstechnica/index',
    'https://www.wired.com/feed/rss',
    'https://hnrss.org/newest',
    'https://a16z.com/feed/',
    'https://www.coindesk.com/arc/outboundfeeds/rss/',
    'https://cointelegraph.com/rss',
    'https://www.theblock.co/rss.xml'
];

async function testFeeds() {
    for (let url of techUrls) {
        try {
            console.log(`Testing ${url}...`);
            let feed = await parser.parseURL(url);
            console.log(`✅ ${url}: ${feed.items.length} items`);
        } catch(e) {
            console.error(`❌ ${url}: ERROR - ${e.message}`);
        }
    }
}

testFeeds();
