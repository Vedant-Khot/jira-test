# GitHub to Jira Synchronizer

A Node.js Express server that bridges GitHub and Jira Cloud using Webhooks. 

## Features
*   Listens for real-time `pull_request` events from a GitHub repository.
*   Extracts Jira Ticket Keys (e.g., `PROJ-123`) from the Pull Request title.
*   Automatically posts a comment to the relevant Jira ticket containing a hyperlink to the Pull Request.
*   Automatically transitions the Jira ticket to an "In Review" status.

## Prerequisites
Create a `.env` file in this directory with your Jira credentials:
```env
JIRA_DOMAIN=your-domain.atlassian.net
JIRA_EMAIL=your-email@example.com
JIRA_API_TOKEN=your-generated-api-token
PORT=3000
```

## How to Run

1.  **Start the Server:**
    ```bash
    npm install
    node server.js
    ```
2.  **Expose locally using ngrok:**
    In a separate terminal, run: `ngrok http 3000`
3.  **Configure GitHub:**
    Go to your GitHub Repository Settings > Webhooks. Add a new webhook pointing to your ngrok URL (`https://your-ngrok-url.ngrok-free.app/webhook`) and select **Pull request** events.

## Usage
Open a Pull Request in your configured GitHub repository. Make sure the title includes a valid Jira Key, such as: `PROJ-123: Fixed the login button`. The server will instantly process it and update Jira.
