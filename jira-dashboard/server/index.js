const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const { JIRA_DOMAIN, JIRA_EMAIL, JIRA_API_TOKEN } = process.env;

if (!JIRA_DOMAIN || !JIRA_EMAIL || !JIRA_API_TOKEN) {
    console.error('Error: Missing Jira credentials in .env file.');
    process.exit(1);
}

const cleanDomain = JIRA_DOMAIN.replace(/^https?:\/\//, '').replace(/\/$/, '');

const jiraClient = axios.create({
    baseURL: `https://${cleanDomain}/rest/api/3`,
    headers: {
        'Authorization': `Basic ${Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64')}`,
        'Accept': 'application/json'
    }
});

// Proxy endpoint to fetch issues for the dashboard
app.get('/api/issues', async (req, res) => {
    try {
        // Fetch up to 100 recent issues for our dashboard metrics
        // Note: Jira requires a bounded query. We can use a project key or a date range.
        const projectKey = process.env.JIRA_PROJECT_KEY;
        const jql = projectKey 
            ? `project = "${projectKey}" order by updated DESC`
            : 'created >= -365d order by updated DESC';
        const response = await jiraClient.get('/search/jql', {
            params: {
                jql,
                maxResults: 100,
                fields: 'summary,status,assignee,created,updated,issuetype,priority'
            }
        });

        console.log(`[Jira Query] Executed JQL: "${jql}"`);
        console.log(`[Jira Response] Found ${response.data.issues.length} total issues.`);
        
        res.json(response.data.issues);
    } catch (error) {
        console.error('Failed to fetch from Jira:', error.response?.data || error.message);
        res.status(500).json({ error: 'Failed to fetch data from Jira' });
    }
});

app.listen(PORT, () => {
    console.log(`Backend proxy server running on http://localhost:${PORT}`);
});
