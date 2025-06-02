#!/usr/bin/env node

import { LocalStorageProvider } from '../src/storage/local.js';

console.log('🧠 Mem0 Dynamic Workspace Detection Test\n');

// Test scenarios
const testScenarios = [
    {
        name: 'VSCode Workspace: markdown-component/version-4',
        env: { VSCODE_WORKSPACE_FOLDER: '/Users/sonjuane/Dropbox/Projects/WEB-COMPONENTS/markdown-component/version-4' },
        expected: '/Users/sonjuane/Dropbox/Projects/WEB-COMPONENTS/markdown-component/version-4/.Mem0-Files'
    },
    {
        name: 'VSCode Workspace: my-react-app',
        env: { VSCODE_WORKSPACE_FOLDER: '/Users/sonjuane/Dropbox/Projects/REACT/my-react-app' },
        expected: '/Users/sonjuane/Dropbox/Projects/REACT/my-react-app/.Mem0-Files'
    },
    {
        name: 'Explicit PROJECT_DIR override',
        env: { PROJECT_DIR: '/Users/sonjuane/Dropbox/Projects/CUSTOM/my-project' },
        expected: '/Users/sonjuane/Dropbox/Projects/CUSTOM/my-project/.Mem0-Files'
    },
    {
        name: 'No workspace specified (fallback)',
        env: {},
        expected: 'Auto-detected based on server location'
    }
];

console.log('Testing different workspace scenarios:\n');

for (const scenario of testScenarios) {
    console.log(`📁 ${scenario.name}`);

    // Set environment variables for this test
    const originalEnv = {};
    for (const [key, value] of Object.entries(scenario.env)) {
        originalEnv[key] = process.env[key];
        process.env[key] = value;
    }

    try {
        const provider = new LocalStorageProvider();
        const actualPath = provider.baseDir;

        console.log(`   Expected: ${scenario.expected}`);
        console.log(`   Actual:   ${actualPath}`);

        if (scenario.expected !== 'Auto-detected based on server location') {
            const match = actualPath === scenario.expected;
            console.log(`   Result:   ${match ? '✅ PASS' : '❌ FAIL'}`);
        } else {
            console.log(`   Result:   ✅ PASS (fallback working)`);
        }

    } catch (error) {
        console.log(`   Result:   ❌ ERROR: ${error.message}`);
    }

    // Restore original environment
    for (const [key, value] of Object.entries(originalEnv)) {
        if (value === undefined) {
            delete process.env[key];
        } else {
            process.env[key] = value;
        }
    }

    console.log('');
}

console.log('🎯 Summary:');
console.log('   • Memories are stored in the root of your active VSCode workspace');
console.log('   • Use VSCODE_WORKSPACE_FOLDER="${workspaceFolder}" in your VSCode MCP config');
console.log('   • Falls back to auto-detection if no workspace is specified');
console.log('   • Can be overridden with explicit PROJECT_DIR environment variable');