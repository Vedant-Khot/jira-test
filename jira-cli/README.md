# Jira Command-Line Interface (CLI)

A simple, lightweight Node.js Command-Line Interface for interacting directly with the Jira Cloud REST API.

## Features
*   **List Issues:** Quickly fetch a list of all unresolved Jira issues assigned to you.
*   **Log Time:** Add worklogs (time spent) to a specific Jira ticket.
*   **Transition Status:** Move a ticket across your Kanban/Scrum board (e.g., from "In Progress" to "Done").

## Prerequisites
You will need your Atlassian account email and a generated API Token.
Create a `.env` file in this directory (based on `.env.example`) with the following:
```env
JIRA_DOMAIN=your-domain.atlassian.net
JIRA_EMAIL=your-email@example.com
JIRA_API_TOKEN=your-generated-api-token
```

## How to Run
Ensure you have installed dependencies via `npm install`.

```bash
# List your assigned issues
node index.js list

# Log 2 hours of time to a ticket
node index.js log PROJ-123 "2h" "Fixed a database issue"

# Move a ticket to the "Done" status
node index.js transition PROJ-123 "Done"
```
