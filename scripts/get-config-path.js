#!/usr/bin/env node

/**
 * Helper script to generate the correct configuration path for MCP clients
 */

import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');
const mainPath = resolve(projectRoot, 'src', 'main.js');

console.log('🔧 Mem0 MCP Server Configuration Helper\n');

console.log('📁 Project Root:', projectRoot);
console.log('🚀 Main Script:', mainPath);

console.log('\n📋 VS Code Roo Code Configuration:');
console.log('Copy this configuration to your Roo Code MCP servers settings:\n');

const vscodeConfig = {
    "mem0-nodejs": {
        "command": "node",
        "args": [mainPath],
        "env": {
            "TRANSPORT": "stdio",
            "STORAGE_PROVIDER": "local",
            "LOCAL_STORAGE_DIR": ".Mem0-Files",
            "DEFAULT_USER_ID": "vscode-user",
            "DEBUG": "false"
        }
    }
};

console.log(JSON.stringify(vscodeConfig, null, 2));

console.log('\n📋 Claude Desktop Configuration:');
console.log('Copy this configuration to your Claude Desktop settings:\n');

const claudeConfig = {
    "mcpServers": {
        "mem0-nodejs": {
            "command": "node",
            "args": [mainPath],
            "env": {
                "TRANSPORT": "stdio",
                "STORAGE_PROVIDER": "local",
                "LOCAL_STORAGE_DIR": ".Mem0-Files",
                "DEFAULT_USER_ID": "user",
                "DEBUG": "false"
            }
        }
    }
};

console.log(JSON.stringify(claudeConfig, null, 2));

console.log('\n✅ Configuration generated successfully!');
console.log('💡 Tip: You can run this script anytime with: npm run config');