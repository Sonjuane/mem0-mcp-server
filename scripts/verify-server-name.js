import { Mem0MCPServer } from '../src/main.js';
import { logger } from '../src/utils/logger.js';

// Set the log level to info
logger.level = 'info';

// Test with default name
process.env.MCP_SERVER_NAME = 'mem0-http';
const server = new Mem0MCPServer();

console.log('\n----- Server Configuration -----');
console.log(`Server name: ${server.server.info.name}`);
console.log('--------------------------------\n');

// Test name update
server.updateServerName('test-updated-name');
console.log('\n----- After Name Update -----');
console.log(`Server name: ${server.server.info.name}`);
console.log('------------------------------\n');

console.log('Verification complete. The server should now use "mem0-http" by default.');