const axios = require('axios');
const Parser = require('rss-parser');
const db = require('./database');

const rssParser = new Parser();

class TwitterBot {
    constructor() {
        this.bearerToken = process.env.TWITTER_BEARER_TOKEN;
        this.apiKey = process.env.TWITTER_API_KEY;
        this.apiSecret = process.env.TWITTER_API_SECRET;
        this.accountId = process.env.TWITTER_ACCOUNT_ID;

        if (!this.bearerToken) {
            console.warn('⚠️ TWITTER_BEARER_TOKEN not configured. Twitter posting disabled.');
        }
    }

    /**
     * Get trending topics in Argentina from Google Trends RSS
     */
    async getTopicsArgentina() {
        try {
            const feed = await rssParser.parseURL('https://trends.google.com/trending/rss?geo=AR');
            return feed.items.map(item => ({
                title: item.title,
                query: item.title.toLowerCase().replace(/\s+/g, ' ').trim()
            })).slice(0, 15);
        } catch (error) {
            console.error('❌ Error fetching Argentina trends:', error.message);
            return [];
        }
    }

    /**
     * Match article to trending topics by keyword matching
     */
    matchArticleToTrending(article, trendingTopics) {
        if (!article || !article.title) return null;

        const articleTitle = article.title.toLowerCase();
        const articleSummary = (article.summary || '').toLowerCase();
        const searchText = `${articleTitle} ${articleSummary}`;

        for (let trend of trendingTopics) {
            const trendKeywords = trend.query.split(' ');
            // Match if article contains at least 2 keywords from the trending topic
            const matches = trendKeywords.filter(kw => searchText.includes(kw)).length;
            if (matches >= Math.min(2, trendKeywords.length)) {
                return trend;
            }
        }
        return null;
    }

    /**
     * Format article for Twitter (280 chars max)
     */
    formatArticleForTwitter(article, trendingTopic = null) {
        let title = article.title || '';

        // Remove common prefixes/suffixes
        title = title.replace(/^\[.*?\]\s*/, '');
        title = title.trim();

        // Truncate to ~240 chars to leave room for link
        if (title.length > 240) {
            title = title.substring(0, 237) + '...';
        }

        // Add relevant category emoji
        let emoji = '📰';
        if (article.category) {
            const categoryMap = {
                'Política': '🏛️',
                'Economía': '💰',
                'Mercados': '📊',
                'Deportes': '⚽',
                'Tecnología': '💻',
                'Internacional': '🌍',
                'Espectáculos': '🎬',
                'Cultura': '🎭',
                'Sociedad': '👥'
            };
            emoji = categoryMap[article.category] || emoji;
        }

        // Build tweet
        let tweet = `${emoji} ${title}`;

        if (trendingTopic) {
            tweet += ` #${trendingTopic.title.split(' ')[0]}`;
        }

        tweet += ' 🔗';

        return tweet.substring(0, 280);
    }

    /**
     * Select article to publish based on priority algorithm
     */
    async selectArticleToPublish() {
        try {
            // Get trending topics
            const trendingTopics = await this.getTopicsArgentina();
            console.log(`📈 Fetched ${trendingTopics.length} trending topics`);

            // Get recent articles (last 6 hours) not yet posted
            const { rows } = await db.query(`
                SELECT a.* FROM articles a
                LEFT JOIN twitter_posts tp ON a.id = tp.article_id
                WHERE a.createdAt >= NOW() - INTERVAL '6 hours'
                AND tp.id IS NULL
                ORDER BY a.importanceScore DESC
                LIMIT 30
            `);

            if (rows.length === 0) {
                console.log('⚠️ No unpublished articles found');
                return null;
            }

            console.log(`🔍 Evaluating ${rows.length} candidate articles`);

            // PRIORITY 1: Try to match trending topic
            for (let article of rows) {
                const matchedTrend = this.matchArticleToTrending(article, trendingTopics);
                if (matchedTrend) {
                    console.log(`✅ MATCH: Article matches trending topic: ${matchedTrend.title}`);
                    return { article, trendingTopic: matchedTrend };
                }
            }

            // PRIORITY 2: Select by highest importanceScore
            const topArticle = rows[0];
            console.log(`📌 No trending match. Selecting by importance score: "${topArticle.title.substring(0, 50)}..."`);
            return { article: topArticle, trendingTopic: null };

        } catch (error) {
            console.error('❌ Error selecting article:', error.message);
            return null;
        }
    }

    /**
     * Post tweet to Twitter via API v2
     */
    async postTweet(text) {
        if (!this.bearerToken) {
            console.error('❌ Twitter API not configured');
            return { success: false, error: 'Twitter API not configured' };
        }

        try {
            const response = await axios.post(
                'https://api.twitter.com/2/tweets',
                { text },
                {
                    headers: {
                        'Authorization': `Bearer ${this.bearerToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            const tweetId = response.data.data?.id;
            console.log(`✨ Tweet posted successfully. ID: ${tweetId}`);
            return { success: true, tweetId };

        } catch (error) {
            console.error('❌ Error posting tweet:', error.response?.data || error.message);
            return {
                success: false,
                error: error.response?.data?.detail || error.message
            };
        }
    }

    /**
     * Save published tweet to database
     */
    async saveTweet(articleId, tweetId, text, trendingMatched = null) {
        try {
            await db.query(`
                INSERT INTO twitter_posts (article_id, tweet_id, tweet_text, posted_at, trending_matched)
                VALUES ($1, $2, $3, NOW(), $4)
            `, [articleId, tweetId, text, trendingMatched]);
            console.log(`📊 Tweet saved to database: article_id=${articleId}, tweet_id=${tweetId}`);
        } catch (error) {
            console.error('❌ Error saving tweet to DB:', error.message);
        }
    }

    /**
     * Main workflow: Select, format, post article to Twitter
     */
    async publishDailyArticles() {
        console.log(`\n[${new Date().toISOString()}] 🐦 Twitter publishing cycle started...`);

        try {
            const selection = await this.selectArticleToPublish();

            if (!selection) {
                console.log('⚠️ No articles to publish');
                return;
            }

            const { article, trendingTopic } = selection;
            const tweetText = this.formatArticleForTwitter(article, trendingTopic);

            console.log(`\n📝 Tweet preview:\n${tweetText}\n`);

            // Post to Twitter
            const postResult = await this.postTweet(tweetText);

            if (postResult.success) {
                // Save to database
                await this.saveTweet(
                    article.id,
                    postResult.tweetId,
                    tweetText,
                    trendingTopic ? trendingTopic.title : null
                );
                console.log(`✅ Article published successfully!`);
            } else {
                console.error(`❌ Failed to post tweet: ${postResult.error}`);
            }

        } catch (error) {
            console.error(`❌ Error in publish cycle:`, error.message);
        }
    }

    /**
     * Get Twitter metrics for a tweet
     */
    async getTweetMetrics(tweetId) {
        if (!this.bearerToken) return null;

        try {
            const response = await axios.get(
                `https://api.twitter.com/2/tweets/${tweetId}?tweet.fields=public_metrics`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.bearerToken}`
                    }
                }
            );

            const metrics = response.data.data?.public_metrics || {};
            return {
                likes: metrics.like_count || 0,
                retweets: metrics.retweet_count || 0,
                replies: metrics.reply_count || 0
            };

        } catch (error) {
            console.error('❌ Error fetching metrics:', error.message);
            return null;
        }
    }

    /**
     * Update tweet metrics in database
     */
    async updateTweetMetrics(tweetId) {
        try {
            const metrics = await this.getTweetMetrics(tweetId);
            if (!metrics) return;

            await db.query(`
                UPDATE twitter_posts
                SET likes = $1, retweets = $2, replies = $3
                WHERE tweet_id = $4
            `, [metrics.likes, metrics.retweets, metrics.replies, tweetId]);

            console.log(`📊 Metrics updated for tweet ${tweetId}: ${metrics.likes}L ${metrics.retweets}R ${metrics.replies}Re`);
        } catch (error) {
            console.error('❌ Error updating metrics:', error.message);
        }
    }
}

module.exports = new TwitterBot();
