import { test } from 'node:test';
import assert from 'node:assert';
import { Mem0MCPServer } from '../src/main.js';
import { logger } from '../src/utils/logger.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Silence logger during tests
logger.level = 'error';

// Mock the config to avoid file system operations
process.env.MCP_SERVER_NAME = 'mem0-http';

test('Server Name Configuration Tests', async (t) => {
    await t.test('should use the default server name when no config is provided', async () => {
        const server = new Mem0MCPServer();
        // Check server name after constructor is called
        assert.strictEqual(server.server.info.name, 'mem0-http');
    });

    await t.test('should update server name when provided through updateServerName method', async () => {
        const server = new Mem0MCPServer();
        const initialName = server.server.info.name;

        // Should be able to update the name
        server.updateServerName('test-server-name');

        assert.strictEqual(server.server.info.name, 'test-server-name');
        assert.notStrictEqual(server.server.info.name, initialName);
    });
});