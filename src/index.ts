import { SRE } from '@smythos/sdk/core';
import { Agent } from '@smythos/sdk';
import { execSync, exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

// Initialize OpenTelemetry
SRE.init({
    Telemetry: {
        Connector: 'OTel',
        Settings: {
            endpoint: 'http://localhost:4318',
            serviceName: 'moltron-gh',
        },
    },
});

// Types
interface GhResult {
    success: boolean;
    output?: string;
    error?: string;
    duration: number;
}

// Check if gh is installed
async function checkGhInstalled(): Promise<boolean> {
    try {
        await execAsync('which gh');
        return true;
    } catch {
        return false;
    }
}

// Check if authenticated
async function checkGhAuth(): Promise<boolean> {
    try {
        await execAsync('gh auth status');
        return true;
    } catch {
        return false;
    }
}

// Execute gh command
async function runGhCommand(args: string[]): Promise<GhResult> {
    const startTime = Date.now();
    
    try {
        // Check prerequisites
        const hasGh = await checkGhInstalled();
        if (!hasGh) {
            return {
                success: false,
                error: 'GitHub CLI (gh) is not installed. Run: @moltron-package-installer install gh',
                duration: Date.now() - startTime,
            };
        }

        const isAuth = await checkGhAuth();
        if (!isAuth && !args.includes('auth')) {
            return {
                success: false,
                error: 'Not authenticated with GitHub. Run: gh auth login',
                duration: Date.now() - startTime,
            };
        }

        const command = `gh ${args.join(' ')}`;
        const { stdout, stderr } = await execAsync(command);
        
        return {
            success: true,
            output: stdout || stderr,
            duration: Date.now() - startTime,
        };
    } catch (error: any) {
        return {
            success: false,
            error: error.stderr || error.message,
            duration: Date.now() - startTime,
        };
    }
}

// Get current repo info
async function getRepoInfo(): Promise<any> {
    try {
        const { stdout } = await execAsync('gh repo view --json owner,name,url,defaultBranch,description');
        return JSON.parse(stdout);
    } catch {
        return null;
    }
}

// List PRs
async function listPRs(state: string = 'open'): Promise<GhResult> {
    return runGhCommand(['pr', 'list', '--state', state, '--limit', '20']);
}

// Create PR
async function createPR(title: string, body?: string, base?: string, draft?: boolean): Promise<GhResult> {
    const args = ['pr', 'create', '--title', title];
    
    if (body) args.push('--body', body);
    if (base) args.push('--base', base);
    if (draft) args.push('--draft');
    
    return runGhCommand(args);
}

// View PR
async function viewPR(prNumber: string): Promise<GhResult> {
    return runGhCommand(['pr', 'view', prNumber]);
}

// Checkout PR
async function checkoutPR(prNumber: string): Promise<GhResult> {
    return runGhCommand(['pr', 'checkout', prNumber]);
}

// List issues
async function listIssues(state: string = 'open'): Promise<GhResult> {
    return runGhCommand(['issue', 'list', '--state', state, '--limit', '20']);
}

// Create issue
async function createIssue(title: string, body?: string, label?: string[]): Promise<GhResult> {
    const args = ['issue', 'create', '--title', title];
    
    if (body) args.push('--body', body);
    if (label) {
        for (const l of label) {
            args.push('--label', l);
        }
    }
    
    return runGhCommand(args);
}

// View issue
async function viewIssue(issueNumber: string): Promise<GhResult> {
    return runGhCommand(['issue', 'view', issueNumber]);
}

// Get workflow runs
async function listWorkflows(): Promise<GhResult> {
    return runGhCommand(['run', 'list', '--limit', '10']);
}

// View workflow logs
async function viewWorkflowRun(runId: string): Promise<GhResult> {
    return runGhCommand(['run', 'view', runId, '--log']);
}

// Create agent
const agent = new Agent({
    name: 'GitHub CLI Agent',
    model: 'gpt-4o-mini',
    behavior: 'You are a GitHub CLI assistant. You help users interact with GitHub repositories using the gh command. Always check if gh is installed and authenticated before running commands.',
});

// Add skills
agent.addSkill({
    name: 'check_prerequisites',
    description: 'Check if GitHub CLI is installed and authenticated',
    process: async () => {
        const hasGh = await checkGhInstalled();
        const isAuth = await checkGhAuth();
        const repo = await getRepoInfo();
        
        return JSON.stringify({
            ghInstalled: hasGh,
            authenticated: isAuth,
            currentRepo: repo,
        });
    },
});

agent.addSkill({
    name: 'list_prs',
    description: 'List pull requests in the current repository',
    process: async ({ state = 'open' }: { state?: string }) => {
        const result = await listPRs(state);
        return JSON.stringify(result);
    },
});

agent.addSkill({
    name: 'create_pr',
    description: 'Create a new pull request',
    process: async ({ title, body, base, draft }: { title: string; body?: string; base?: string; draft?: boolean }) => {
        const result = await createPR(title, body, base, draft);
        return JSON.stringify(result);
    },
});

agent.addSkill({
    name: 'view_pr',
    description: 'View details of a specific pull request',
    process: async ({ pr_number }: { pr_number: string }) => {
        const result = await viewPR(pr_number);
        return JSON.stringify(result);
    },
});

agent.addSkill({
    name: 'checkout_pr',
    description: 'Checkout a pull request locally',
    process: async ({ pr_number }: { pr_number: string }) => {
        const result = await checkoutPR(pr_number);
        return JSON.stringify(result);
    },
});

agent.addSkill({
    name: 'list_issues',
    description: 'List issues in the current repository',
    process: async ({ state = 'open' }: { state?: string }) => {
        const result = await listIssues(state);
        return JSON.stringify(result);
    },
});

agent.addSkill({
    name: 'create_issue',
    description: 'Create a new issue',
    process: async ({ title, body, labels }: { title: string; body?: string; labels?: string[] }) => {
        const result = await createIssue(title, body, labels);
        return JSON.stringify(result);
    },
});

agent.addSkill({
    name: 'view_issue',
    description: 'View details of a specific issue',
    process: async ({ issue_number }: { issue_number: string }) => {
        const result = await viewIssue(issue_number);
        return JSON.stringify(result);
    },
});

agent.addSkill({
    name: 'list_workflows',
    description: 'List recent workflow runs',
    process: async () => {
        const result = await listWorkflows();
        return JSON.stringify(result);
    },
});

agent.addSkill({
    name: 'view_workflow',
    description: 'View workflow run logs',
    process: async ({ run_id }: { run_id: string }) => {
        const result = await viewWorkflowRun(run_id);
        return JSON.stringify(result);
    },
});

// CLI interface
async function main() {
    const args = process.argv.slice(2);
    const command = args[0];

    if (!command || command === 'help' || command === '--help') {
        console.log('moltron-gh - GitHub CLI wrapper with SmythOS');
        console.log('');
        console.log('Usage:');
        console.log('  node dist/index.js <command> [options]');
        console.log('');
        console.log('Commands:');
        console.log('  status              Check gh installation and auth status');
        console.log('  pr list [state]     List PRs (open/closed/merged/all)');
        console.log('  pr create <title>  Create a new PR');
        console.log('  pr view <number>   View PR details');
        console.log('  pr checkout <num>  Checkout PR locally');
        console.log('  issue list [state]  List issues');
        console.log('  issue create <ttl> Create a new issue');
        console.log('  issue view <num>   View issue details');
        console.log('  workflow list       List recent workflow runs');
        console.log('  workflow view <id> View workflow logs');
        process.exit(0);
    }

    if (command === 'status') {
        const hasGh = await checkGhInstalled();
        const isAuth = await checkGhAuth();
        const repo = await getRepoInfo();
        
        console.log('GitHub CLI Status:');
        console.log(`  Installed: ${hasGh ? '✅' : '❌'}`);
        console.log(`  Authenticated: ${isAuth ? '✅' : '❌'}`);
        if (repo) {
            console.log(`  Current repo: ${repo.owner.login}/${repo.name}`);
        }
        process.exit(0);
    }

    if (command === 'pr') {
        const subcommand = args[1];
        
        if (subcommand === 'list') {
            const state = args[2] || 'open';
            const result = await listPRs(state);
            console.log(result.output || result.error);
            process.exit(result.success ? 0 : 1);
        }
        
        if (subcommand === 'create') {
            const title = args[2];
            if (!title) {
                console.error('Error: PR title is required');
                process.exit(1);
            }
            const result = await createPR(title);
            console.log(result.output || result.error);
            process.exit(result.success ? 0 : 1);
        }
        
        if (subcommand === 'view') {
            const prNumber = args[2];
            if (!prNumber) {
                console.error('Error: PR number is required');
                process.exit(1);
            }
            const result = await viewPR(prNumber);
            console.log(result.output || result.error);
            process.exit(result.success ? 0 : 1);
        }
        
        if (subcommand === 'checkout') {
            const prNumber = args[2];
            if (!prNumber) {
                console.error('Error: PR number is required');
                process.exit(1);
            }
            const result = await checkoutPR(prNumber);
            console.log(result.output || result.error);
            process.exit(result.success ? 0 : 1);
        }
    }

    if (command === 'issue') {
        const subcommand = args[1];
        
        if (subcommand === 'list') {
            const state = args[2] || 'open';
            const result = await listIssues(state);
            console.log(result.output || result.error);
            process.exit(result.success ? 0 : 1);
        }
        
        if (subcommand === 'create') {
            const title = args[2];
            if (!title) {
                console.error('Error: Issue title is required');
                process.exit(1);
            }
            const result = await createIssue(title);
            console.log(result.output || result.error);
            process.exit(result.success ? 0 : 1);
        }
        
        if (subcommand === 'view') {
            const issueNumber = args[2];
            if (!issueNumber) {
                console.error('Error: Issue number is required');
                process.exit(1);
            }
            const result = await viewIssue(issueNumber);
            console.log(result.output || result.error);
            process.exit(result.success ? 0 : 1);
        }
    }

    if (command === 'workflow') {
        const subcommand = args[1];
        
        if (subcommand === 'list') {
            const result = await listWorkflows();
            console.log(result.output || result.error);
            process.exit(result.success ? 0 : 1);
        }
        
        if (subcommand === 'view') {
            const runId = args[2];
            if (!runId) {
                console.error('Error: Run ID is required');
                process.exit(1);
            }
            const result = await viewWorkflowRun(runId);
            console.log(result.output || result.error);
            process.exit(result.success ? 0 : 1);
        }
    }

    console.error(`Unknown command: ${command}`);
    console.log('Run with --help for usage information');
    process.exit(1);
}

main();
