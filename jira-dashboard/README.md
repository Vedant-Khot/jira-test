# Developer Velocity Dashboard

A full-stack web application built to visualize metrics from your Jira Cloud instance. It features a secure Node.js proxy backend and a React/Vite frontend using Recharts for data visualization.

## Architecture
*   **Backend (`/server`):** An Express.js API proxy that safely stores your Jira API token and queries the Jira API using JQL.
*   **Frontend (`/client`):** A modern React application that renders interactive Bar and Pie charts, alongside a detailed raw data table. Styled using premium dark-mode CSS.

## Setup & Prerequisites

### 1. Backend Setup
Navigate to the `server/` directory and create a `.env` file:
```env
JIRA_DOMAIN=your-domain.atlassian.net
JIRA_EMAIL=your-email@example.com
JIRA_API_TOKEN=your-generated-api-token
JIRA_PROJECT_KEY=PROJ  # Optional: Filter by a specific project key
PORT=3001
```
Install dependencies and run:
```bash
cd server
npm install
node index.js
```

### 2. Frontend Setup
Open a second terminal, navigate to the `client/` directory, install dependencies, and start the Vite dev server:
```bash
cd client
npm install
npm run dev
```

## Usage
Navigate to `http://localhost:5173` in your web browser. The dashboard will automatically fetch your recent issues through the proxy server and render the charts and data table.
