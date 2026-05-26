const axios = require('axios');
require('dotenv').config();

const { JIRA_DOMAIN, JIRA_EMAIL, JIRA_API_TOKEN } = process.env;

if (!JIRA_DOMAIN || !JIRA_EMAIL || !JIRA_API_TOKEN) {
    console.error('Error: Missing required environment variables in .env file.');
    console.error('Please ensure JIRA_DOMAIN, JIRA_EMAIL, and JIRA_API_TOKEN are set.');
    process.exit(1);
}

// Ensure the domain doesn't have protocol or trailing slash to avoid URL errors
const cleanDomain = JIRA_DOMAIN.replace(/^https?:\/\//, '').replace(/\/$/, '');

// Set up the Axios instance with Basic Auth
const jiraClient = axios.create({
    baseURL: `https://${cleanDomain}/rest/api/3`,
    headers: {
        'Authorization': `Basic ${Buffer.from(
            `${JIRA_EMAIL}:${JIRA_API_TOKEN}`
        ).toString('base64')}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    }
});

/**
 * Fetch issues assigned to the current user that are not Done.
 */
async function getMyIssues() {
    try {
        const jql = 'assignee = currentUser() AND statusCategory != Done ORDER BY updated DESC';
        const response = await jiraClient.get('/search/jql', {
            params: {
                jql,
                maxResults: 20,
                fields: 'summary,status,priority'
            }
        });
        return response.data.issues;
    } catch (error) {
        console.error('Failed to fetch issues:', error.response?.data || error.message);
        throw error;
    }
}

/**
 * Log time against an issue.
 * @param {string} issueKey - The Jira issue key (e.g., PROJ-123)
 * @param {string} timeSpent - Time spent string (e.g., '1h 30m')
 * @param {string} comment - Optional comment for the worklog
 */
async function logTime(issueKey, timeSpent, comment) {
    try {
        const payload = {
            timeSpent: timeSpent
        };

        // If a comment is provided, it must be in ADF format for API v3
        if (comment) {
            payload.comment = {
                type: 'doc',
                version: 1,
                content: [
                    {
                        type: 'paragraph',
                        content: [
                            {
                                type: 'text',
                                text: comment
                            }
                        ]
                    }
                ]
            };
        }

        const response = await jiraClient.post(`/issue/${issueKey}/worklog`, payload);
        return response.data;
    } catch (error) {
        console.error(`Failed to log time for ${issueKey}:`, error.response?.data || error.message);
        throw error;
    }
}

/**
 * Transition an issue to a new status.
 * @param {string} issueKey - The Jira issue key
 * @param {string} transitionName - The name of the transition (e.g., 'Done', 'In Progress')
 */
async function transitionIssue(issueKey, transitionName) {
    try {
        // First, fetch the available transitions for this specific issue
        const transitionsResponse = await jiraClient.get(`/issue/${issueKey}/transitions`);
        const transitions = transitionsResponse.data.transitions;

        // Find the transition that matches the requested name (case-insensitive)
        const transition = transitions.find(t => t.name.toLowerCase() === transitionName.toLowerCase());

        if (!transition) {
            console.error(`Transition '${transitionName}' not found for issue ${issueKey}.`);
            console.error(`Available transitions: ${transitions.map(t => t.name).join(', ')}`);
            process.exit(1);
        }

        // Perform the transition
        await jiraClient.post(`/issue/${issueKey}/transitions`, {
            transition: { id: transition.id }
        });
        return transition.name;
    } catch (error) {
        console.error(`Failed to transition issue ${issueKey}:`, error.response?.data || error.message);
        throw error;
    }
}

module.exports = {
    getMyIssues,
    logTime,
    transitionIssue
};
