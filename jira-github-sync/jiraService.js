const axios = require('axios');
require('dotenv').config();

const { JIRA_DOMAIN, JIRA_EMAIL, JIRA_API_TOKEN } = process.env;

if (!JIRA_DOMAIN || !JIRA_EMAIL || !JIRA_API_TOKEN) {
    console.error('Error: Missing required environment variables in .env file.');
    process.exit(1);
}

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
 * Adds a comment to a Jira issue with a link to the PR.
 */
async function addPrComment(issueKey, prUrl, prTitle) {
    try {
        const payload = {
            body: {
                type: 'doc',
                version: 1,
                content: [
                    {
                        type: 'paragraph',
                        content: [
                            { type: 'text', text: 'A new Pull Request has been opened for this issue: ' },
                            {
                                type: 'text',
                                text: prTitle,
                                marks: [
                                    { type: 'link', attrs: { href: prUrl } }
                                ]
                            }
                        ]
                    }
                ]
            }
        };

        await jiraClient.post(`/issue/${issueKey}/comment`, payload);
        console.log(`[Jira] Successfully added PR comment to ${issueKey}`);
    } catch (error) {
        console.error(`[Jira Error] Failed to add comment to ${issueKey}:`, error.response?.data || error.message);
    }
}

/**
 * Transitions a Jira issue to "In Review" (or similar status).
 */
async function transitionToReview(issueKey) {
    try {
        // Common target statuses: "In Review", "Review", "Code Review"
        const targetStatuses = ['in review', 'review', 'code review'];
        
        const response = await jiraClient.get(`/issue/${issueKey}/transitions`);
        const transitions = response.data.transitions;

        // Find a transition that matches one of our target statuses
        const transition = transitions.find(t => 
            targetStatuses.includes(t.name.toLowerCase()) || 
            targetStatuses.includes(t.to.name.toLowerCase())
        );

        if (!transition) {
            console.log(`[Jira] Could not find a suitable 'In Review' transition for ${issueKey}. Available transitions: ${transitions.map(t=>t.name).join(', ')}`);
            return;
        }

        await jiraClient.post(`/issue/${issueKey}/transitions`, {
            transition: { id: transition.id }
        });
        
        console.log(`[Jira] Successfully transitioned ${issueKey} to [${transition.to.name}]`);
    } catch (error) {
        console.error(`[Jira Error] Failed to transition ${issueKey}:`, error.response?.data || error.message);
    }
}

module.exports = {
    addPrComment,
    transitionToReview
};
