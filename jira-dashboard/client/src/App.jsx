import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend
} from 'recharts';

// Modern color palette for charts
const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#64748b'];

function App() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch data from our local Express backend
    fetch('http://localhost:3001/api/issues')
      .then(res => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then(data => {
        setIssues(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching issues:", err);
        setError("Failed to load Jira data. Is the backend running?");
        setLoading(false);
      });
  }, []);

  // Compute metrics from raw issue data
  const statusData = useMemo(() => {
    const statusCounts = {};
    issues.forEach(issue => {
      const status = issue.fields.status.name;
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    return Object.entries(statusCounts).map(([name, count]) => ({ name, value: count }));
  }, [issues]);

  const priorityData = useMemo(() => {
    const counts = {};
    issues.forEach(issue => {
      const priority = issue.fields.priority?.name || 'None';
      counts[priority] = (counts[priority] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => ({ name, value: count }));
  }, [issues]);

  if (loading) {
    return (
      <div className="loading-state">
        <div className="spinner"></div>
        <p>Fetching data from Jira...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-container" style={{ textAlign: 'center', marginTop: '10vh' }}>
        <h1 style={{ color: '#ef4444' }}>Connection Error</h1>
        <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>{error}</p>
      </div>
    );
  }

  return (
    <>
      <div className="background-glow"></div>
      <div className="background-glow"></div>
      
      <div className="app-container">
        <header>
          <h1>Velocity Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Live from Jira Cloud</p>
        </header>

        <div className="stats-grid">
          <div className="stat-card">
            <h3>Total Issues (Sampled)</h3>
            <div className="value">{issues.length}</div>
          </div>
          <div className="stat-card">
            <h3>Done / Resolved</h3>
            <div className="value" style={{ color: '#10b981' }}>
              {statusData.find(s => s.name.toLowerCase() === 'done')?.value || 0}
            </div>
          </div>
          <div className="stat-card">
            <h3>In Progress</h3>
            <div className="value" style={{ color: '#3b82f6' }}>
              {statusData.find(s => s.name.toLowerCase().includes('progress'))?.value || 0}
            </div>
          </div>
        </div>

        <div className="charts-grid">
          <div className="chart-container">
            <h2>Issue Status Breakdown</h2>
            <ResponsiveContainer width="100%" height="85%">
              <BarChart data={statusData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-container">
            <h2>Priority Distribution</h2>
            <ResponsiveContainer width="100%" height="85%">
              <PieChart>
                <Pie
                  data={priorityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px' }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="data-table-container">
          <h2>All Fetched Issues</h2>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Key</th>
                  <th>Summary</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Assignee</th>
                </tr>
              </thead>
              <tbody>
                {issues.map(issue => (
                  <tr key={issue.key}>
                    <td className="issue-key">{issue.key}</td>
                    <td>{issue.fields.summary}</td>
                    <td>
                      <span className="status-badge" data-status={issue.fields.status.name.toLowerCase()}>
                        {issue.fields.status.name}
                      </span>
                    </td>
                    <td>{issue.fields.priority?.name || 'None'}</td>
                    <td>{issue.fields.assignee?.displayName || 'Unassigned'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
