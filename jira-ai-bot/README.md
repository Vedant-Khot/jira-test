# AI-Powered Jira Ticket Triage Bot

An advanced Node.js integration that utilizes Large Language Models (LLMs) to automatically analyze and summarize new bugs reported in Jira. 

## Features
*   Listens for `jira:issue_created` webhook events directly from Jira Cloud.
*   Parses Atlassian Document Format (ADF) descriptions into plain text.
*   Sends the bug description to the **Nvidia API (Llama-3.1-70b-instruct)** via the OpenAI SDK.
*   Generates a 3-bullet summary, suggests a severity level, and provides initial troubleshooting steps.
*   Posts the AI analysis back to the Jira ticket as an automated comment.

## Prerequisites
Create a `.env` file in this directory with both your Jira credentials and your Nvidia API key:
```env
JIRA_DOMAIN=your-domain.atlassian.net
JIRA_EMAIL=your-email@example.com
JIRA_API_TOKEN=your-generated-api-token
NVIDIA_API_KEY=your-nvidia-api-key
PORT=4000
```

## How to Run

1.  **Start the Bot:**
    ```bash
    npm install
    node bot.js
    ```
2.  **Expose locally using ngrok:**
    In a separate terminal, run: `ngrok http 4000`
3.  **Configure Jira Webhook:**
    Go to Jira Settings > System > WebHooks (under Advanced). Create a new Webhook pointing to `https://your-ngrok-url.ngrok-free.app/jira-webhook`. Select the **Issue: Created** event.

## Usage
Create a new Issue in Jira. Provide a detailed summary and description. Within seconds, the bot will process the webhook, query the AI, and append the automated triage analysis comment to the ticket.
