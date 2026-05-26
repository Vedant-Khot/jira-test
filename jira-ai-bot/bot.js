const express = require('express');
const axios = require('axios');
const OpenAI = require('openai');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());

const { JIRA_DOMAIN, JIRA_EMAIL, JIRA_API_TOKEN, NVIDIA_API_KEY } = process.env;

if (!JIRA_DOMAIN || !JIRA_EMAIL || !JIRA_API_TOKEN || !NVIDIA_API_KEY) {
    console.error('Error: Missing required environment variables in .env file.');
    process.exit(1);
}

// 1. Setup OpenAI SDK to use Nvidia's API endpoint
const openai = new OpenAI({
    apiKey: NVIDIA_API_KEY,
    baseURL: 'https://integrate.api.nvidia.com/v1',
});

// 2. Setup Jira Axios Client
const cleanDomain = JIRA_DOMAIN.replace(/^https?:\/\//, '').replace(/\/$/, '');
const jiraClient = axios.create({
    baseURL: `https://${cleanDomain}/rest/api/3`,
    headers: {
        'Authorization': `Basic ${Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64')}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    }
});

/**
 * Sends a description to Nvidia's AI model and returns a summary.
 */
async function analyzeTicketWithAI(descriptionText) {
    try {
        console.log('[AI] Analyzing ticket description...');
        const completion = await openai.chat.completions.create({
            model: "meta/llama-3.1-70b-instruct", // High quality model available on Nvidia API
            messages: [
                {
                    "role": "system",
                    "content": "You are a senior technical support engineer. Read the following bug description. Provide a brief 3-bullet-point summary of the issue, suggest a severity level (Low, Medium, High, Critical), and list one potential troubleshooting step. Keep it concise."
                },
                {
                    "role": "user",
                    "content": descriptionText
                }
            ],
            temperature: 0.2,
            max_tokens: 500,
        });

        return completion.choices[0].message.content;
    } catch (error) {
        console.error('[AI Error] Failed to generate AI analysis:', error.message);
        return null;
    }
}

/**
 * Helper function to extract plain text from Jira's complex ADF description format
 */
function extractTextFromADF(adfNode) {
    let text = '';
    if (!adfNode) return text;
    
    if (adfNode.type === 'text') {
        text += adfNode.text + ' ';
    }
    
    if (adfNode.content) {
        adfNode.content.forEach(child => {
            text += extractTextFromADF(child);
        });
    }
    return text;
}

/**
 * Webhook Endpoint that Jira will call
 */
app.post('/jira-webhook', async (req, res) => {
    // Immediately respond to Jira so the webhook doesn't timeout
    res.status(200).send('Received');

    const payload = req.body;

    // We only care about newly created issues
    if (payload.webhookEvent !== 'jira:issue_created') {
        return;
    }

    const issue = payload.issue;
    const issueKey = issue.key;
    const summary = issue.fields.summary;
    const rawDescription = issue.fields.description; // This is in ADF format (v3 API)
    
    console.log(`\n================================`);
    console.log(`[Webhook] New Issue Created: ${issueKey}`);
    console.log(`[Webhook] Summary: ${summary}`);

    // If there's no description, we can't analyze it
    if (!rawDescription) {
        console.log(`[AI] Issue has no description. Skipping analysis.`);
        return;
    }

    // Convert ADF to plain text for the AI
    const descriptionText = extractTextFromADF(rawDescription);
    
    // Call our Nvidia AI Model
    const aiAnalysis = await analyzeTicketWithAI(descriptionText);

    if (aiAnalysis) {
        console.log(`[AI] Analysis complete. Posting to Jira...`);
        
        // Post the AI analysis as a comment back to the Jira ticket
        const commentPayload = {
            body: {
                type: 'doc',
                version: 1,
                content: [
                    {
                        type: 'paragraph',
                        content: [
                            { type: 'text', text: '🤖 ', marks: [{ type: 'strong' }] },
                            { type: 'text', text: 'AI Triage Analysis:', marks: [{ type: 'strong' }] }
                        ]
                    },
                    {
                        type: 'paragraph',
                        content: [
                            { type: 'text', text: aiAnalysis }
                        ]
                    }
                ]
            }
        };

        try {
            await jiraClient.post(`/issue/${issueKey}/comment`, commentPayload);
            console.log(`[Jira] Successfully posted AI comment to ${issueKey}!`);
        } catch (error) {
            console.error(`[Jira Error] Failed to post comment:`, error.response?.data || error.message);
        }
    }
});

app.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`🤖 AI Jira Triage Bot is running on port ${PORT}`);
    console.log(`======================================================\n`);
    console.log(`Waiting for webhooks on POST http://localhost:${PORT}/jira-webhook...`);
});
