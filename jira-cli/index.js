#!/usr/bin/env node

const { Command } = require('commander');
const { getMyIssues, logTime, transitionIssue } = require('./api');

const program = new Command();

program
    .name('jira-cli')
    .description('A simple CLI for interacting with Jira Cloud')
    .version('1.0.0');

// Command: List my issues
program
    .command('list')
    .description('List your assigned issues that are not Done')
    .action(async () => {
        try {
            console.log('Fetching your issues...');
            const issues = await getMyIssues();
            
            if (issues.length === 0) {
                console.log('You have no open assigned issues!');
                return;
            }

            console.log('\n--- Your Open Issues ---');
            issues.forEach(issue => {
                const key = issue.key.padEnd(12);
                const status = issue.fields.status.name.padEnd(15);
                const summary = issue.fields.summary;
                console.log(`${key} | [${status}] | ${summary}`);
            });
            console.log('------------------------\n');
        } catch (error) {
            console.error('Failed to list issues.');
        }
    });

// Command: Log time
program
    .command('log')
    .description('Log time spent on an issue')
    .argument('<issueKey>', 'The Jira issue key (e.g., PROJ-123)')
    .argument('<timeSpent>', 'Time spent string (e.g., 1h 30m)')
    .argument('[comment]', 'Optional comment for the worklog')
    .action(async (issueKey, timeSpent, comment) => {
        try {
            console.log(`Logging ${timeSpent} to ${issueKey}...`);
            await logTime(issueKey, timeSpent, comment);
            console.log(`Successfully logged ${timeSpent} on ${issueKey}!`);
        } catch (error) {
            console.error('Failed to log time.');
        }
    });

// Command: Transition issue
program
    .command('transition')
    .alias('move')
    .description('Transition an issue to a new status')
    .argument('<issueKey>', 'The Jira issue key (e.g., PROJ-123)')
    .argument('<status>', 'The target status name (e.g., "In Progress", "Done")')
    .action(async (issueKey, status) => {
        try {
            console.log(`Transitioning ${issueKey} to '${status}'...`);
            const actualStatus = await transitionIssue(issueKey, status);
            console.log(`Successfully transitioned ${issueKey} to [${actualStatus}]!`);
        } catch (error) {
            console.error('Failed to transition issue.');
        }
    });

program.parse(process.argv);
