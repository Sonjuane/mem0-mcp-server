#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serverDir = path.join(__dirname, '..');

// Get workspace from command line argument or environment
const workspaceFolder = process.argv[2] || process.env.VSCODE_WORKSPACE_FOLDER || process.cwd();

console.log('🧠 Starting Mem0 MCP Server with workspace detection...\n');
console.log(`📁 Workspace: ${workspaceFolder}`);
console.log(`🗂️  Memories will be stored in: ${workspaceFolder}/.Mem0-Files`);
console.log(`🌐 Server will be available at: http://localhost:8484\n`);

// Start the server with workspace context
const serverProcess = spawn('node', ['src/main.js'], {
    cwd: serverDir,
    env: {
        ...process.env,
        VSCODE_WORKSPACE_FOLDER: workspaceFolder
    },
    stdio: 'inherit'
});

// Handle process termination
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server...');
    serverProcess.kill('SIGTERM');
});

process.on('SIGTERM', () => {
    serverProcess.kill('SIGTERM');
});

serverProcess.on('exit', (code) => {
    console.log(`\n✅ Server exited with code ${code}`);
    process.exit(code);
});

serverProcess.on('error', (error) => {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
});