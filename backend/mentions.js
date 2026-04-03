const db = require('./database');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

class MentionsHandler {
    constructor() {
        this.model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    }

    /**
     * Generate candidate reply to a trending topic
     * This is AI-generated but requires user approval before posting
     */
    async generateCandidateReply(trendingTopic, articleContext = null) {
        try {
            const prompt = `
You are writing a reply for @FuerteAlMedio's Twitter account about the trending topic: "${trendingTopic}"

${articleContext ? `
Our newspaper just published: "${articleContext.title}"

Category: ${articleContext.category}
Summary: ${articleContext.summary}

Use this context to craft a relevant, professional reply.
` : ''}

Guidelines:
- Be professional and informative, not promotional
- Keep reply under 280 characters
- Don't engage in heated debates or controversial stances
- If you cannot find factual basis, decline to reply
- Use only factual information from current events
- Avoid speculation or unverified claims

Generate a single tweet-length reply (max 280 chars). Reply only with the text, no explanations.
`;

            const response = await this.model.generateContent(prompt);
            const replyText = response.response.text().trim();

            // Validate length
            if (replyText.length > 280) {
                return replyText.substring(0, 277) + '...';
            }

            return replyText;

        } catch (error) {
            console.error('Error generating reply:', error.message);
            return null;
        }
    }

    /**
     * Save candidate reply for user approval
     */
    async saveCandidateReply(tweetId, originalAuthor, originalText, candidateReply, personaId = '@FuerteAlMedio') {
        try {
            await db.query(`
                INSERT INTO pending_replies (tweet_id, original_author, original_text, candidate_reply, persona_id, status)
                VALUES ($1, $2, $3, $4, $5, 'pending')
            `, [tweetId, originalAuthor, originalText, candidateReply, personaId]);

            console.log(`✅ Candidate reply saved for approval: ${tweetId}`);
        } catch (error) {
            console.error('Error saving candidate reply:', error.message);
        }
    }

    /**
     * Get pending replies awaiting user approval
     */
    async getPendingReplies() {
        try {
            const { rows } = await db.query(`
                SELECT * FROM pending_replies
                WHERE status = 'pending'
                ORDER BY created_at DESC
                LIMIT 20
            `);

            return rows;
        } catch (error) {
            console.error('Error fetching pending replies:', error.message);
            return [];
        }
    }

    /**
     * Approve and post a pending reply
     */
    async approvePendingReply(replyId, twitterBot) {
        try {
            const { rows } = await db.query(`
                SELECT * FROM pending_replies WHERE id = $1
            `, [replyId]);

            if (rows.length === 0) {
                console.error('Reply not found');
                return { success: false, error: 'Reply not found' };
            }

            const reply = rows[0];

            // Post to Twitter
            const postResult = await twitterBot.postTweet(reply.candidate_reply);

            if (postResult.success) {
                // Update status to approved
                await db.query(`
                    UPDATE pending_replies
                    SET status = 'approved'
                    WHERE id = $1
                `, [replyId]);

                console.log(`✅ Reply approved and posted: ${reply.original_author}`);
                return { success: true, tweetId: postResult.tweetId };
            } else {
                console.error('Failed to post reply:', postResult.error);
                return { success: false, error: postResult.error };
            }

        } catch (error) {
            console.error('Error approving reply:', error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * Reject a pending reply
     */
    async rejectPendingReply(replyId) {
        try {
            await db.query(`
                UPDATE pending_replies
                SET status = 'rejected'
                WHERE id = $1
            `, [replyId]);

            console.log(`❌ Reply rejected: ${replyId}`);
            return { success: true };
        } catch (error) {
            console.error('Error rejecting reply:', error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * Monitor trending topics and generate candidate replies
     * This is called periodically to generate replies waiting for user approval
     */
    async engageWithTrends() {
        console.log('\n🔥 Monitoring trending topics for engagement...');

        try {
            // Get trending topics
            const Parser = require('rss-parser');
            const rssParser = new Parser();
            const feed = await rssParser.parseURL('https://trends.google.com/trending/rss?geo=AR');

            const trends = feed.items.map(item => item.title).slice(0, 10);
            console.log(`📊 Found ${trends.length} trending topics`);

            // Get recent articles with potential relevance
            const { rows: articles } = await db.query(`
                SELECT id, title, summary, category
                FROM articles
                WHERE createdAt >= NOW() - INTERVAL '24 hours'
                ORDER BY importanceScore DESC
                LIMIT 5
            `);

            // For each trending topic, try to generate a candidate reply
            for (let trend of trends) {
                // Find most relevant article
                const matchedArticle = articles.find(a =>
                    a.title.toLowerCase().includes(trend.toLowerCase()) ||
                    a.summary.toLowerCase().includes(trend.toLowerCase())
                );

                // Generate candidate reply
                const candidateReply = await this.generateCandidateReply(
                    trend,
                    matchedArticle || null
                );

                if (candidateReply && candidateReply.length > 10) {
                    // Save for user approval (we don't have actual tweet IDs since we haven't seen the tweets)
                    await this.saveCandidateReply(
                        null, // tweetId (null for trending topic candidates)
                        'Trending Topic',
                        trend,
                        candidateReply,
                        '@FuerteAlMedio'
                    );

                    console.log(`✅ Candidate reply generated for: ${trend.substring(0, 40)}`);

                    // Add delay to avoid rate limiting
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
            }

            console.log('🏁 Trending engagement cycle complete');

        } catch (error) {
            console.error('Error in trending engagement:', error.message);
        }
    }
}

module.exports = new MentionsHandler();
