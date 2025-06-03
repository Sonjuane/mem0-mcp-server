// Simple script to verify the name configuration changes

// Import only the relevant parts
import dotenv from 'dotenv';
import { loadMcpConfig } from '../src/config/reader.js';
import { DEFAULT_SERVER_NAME } from '../src/main.js';

// Load environment variables
dotenv.config();

// Print environment settings
console.log('\nEnvironment settings:');
console.log(`MCP_SERVER_NAME: ${process.env.MCP_SERVER_NAME || '(not set)'}`);
console.log(`Default server name: ${DEFAULT_SERVER_NAME}`);

// Load the configuration
console.log('\nAttempting to load configuration...');
loadMcpConfig().then(config => {
    console.log('Configuration loaded successfully');
    console.log('Configuration:', JSON.stringify(config, null, 2));
}).catch(error => {
    console.error('Error loading configuration:', error);
});