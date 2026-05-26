const express = require('express');
const { addPrComment, transitionToReview } = require('./jiraService');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON payloads from GitHub
app.use(express.json());

// A simple regex to find Jira issue keys (e.g., PROJ-123 or AB-45)
// It looks for 2 to 10 uppercase letters, a hyphen, and 1 to 5 digits.
const JIRA_KEY_REGEX = /[A-Z]{2,10}-\d{1,5}/;

app.post('/webhook', async (req, res) => {
    // Acknowledge the webhook immediately so GitHub doesn't time out
    res.status(200).send('Webhook received');

    // We only care about pull request events
    const eventType = req.headers['x-github-event'];
    if (eventType !== 'pull_request') {
        return;
    }

    const payload = req.body;
    
    // We only want to act when a PR is newly opened
    if (payload.action !== 'opened') {
        return;
    }

    const prTitle = payload.pull_request.title;
    const prUrl = payload.pull_request.html_url;

    console.log(`[GitHub] New PR opened: "${prTitle}"`);

    // Extract the Jira Key from the PR title
    const match = prTitle.match(JIRA_KEY_REGEX);
    
    if (match) {
        const issueKey = match[0];
        console.log(`[GitHub] Extracted Jira Key: ${issueKey}`);
        
        // Asynchronously update Jira
        await addPrComment(issueKey, prUrl, prTitle);
        await transitionToReview(issueKey);
    } else {
        console.log(`[GitHub] No Jira Key found in PR title: "${prTitle}". Ignoring.`);
    }
});

app.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`🚀 GitHub-to-Jira Webhook Server is running on port ${PORT}`);
    console.log(`======================================================\n`);
    console.log(`Waiting for webhooks on POST http://localhost:${PORT}/webhook...`);
});
