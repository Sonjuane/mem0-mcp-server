import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import { Mem0MCPServer } from '../src/main.js';
import { MemoryService } from '../src/services/MemoryService.js';
import { ExpressServer } from '../src/server/express.js';
import { createStorageProvider } from '../src/storage/index.js';

describe('HTTP API Tests', () => {
    let server;
    let expressServer;
    let memoryService;
    let baseUrl;

    before(async () => {
        // Set test environment variables
        process.env.STORAGE_PROVIDER = 'local';
        process.env.LOCAL_STORAGE_DIR = '.test-mem0-files';
        process.env.API_TOKEN = 'test-token-123';
        process.env.HTTP_SERVER_PORT = '3001';
        process.env.DEBUG = 'false';

        // Initialize storage provider
        const storageProvider = await createStorageProvider('local');

        // Create memory service
        memoryService = new MemoryService(storageProvider, null);

        // Create and start Express server
        expressServer = new ExpressServer(memoryService);
        await expressServer.start(3001, 'localhost');

        baseUrl = 'http://localhost:3001';
    });

    after(async () => {
        if (expressServer) {
            await expressServer.stop();
        }

        // Cleanup test files
        try {
            const { promises: fs } = await import('fs');
            await fs.rm('.test-mem0-files', { recursive: true, force: true });
        } catch (error) {
            // Ignore cleanup errors
        }
    });

    describe('Public Endpoints', () => {
        test('GET / should return API information', async () => {
            const response = await fetch(`${baseUrl}/`);
            const data = await response.json();

            assert.strictEqual(response.status, 200);
            assert.strictEqual(data.success, true);
            assert.strictEqual(data.data.name, 'Mem0 MCP Server - HTTP API');
        });

        test('GET /api/health should return health status', async () => {
            const response = await fetch(`${baseUrl}/api/health`);
            const data = await response.json();

            assert.strictEqual(response.status, 200);
            assert.strictEqual(data.success, true);
            assert.strictEqual(data.data.status, 'healthy');
        });

        test('GET /api/info should return server information', async () => {
            const response = await fetch(`${baseUrl}/api/info`);
            const data = await response.json();

            assert.strictEqual(response.status, 200);
            assert.strictEqual(data.success, true);
            assert.strictEqual(data.data.name, 'mem0-mcp-server-nodejs');
        });
    });

    describe('Authentication', () => {
        test('Memory endpoints should require authentication', async () => {
            const response = await fetch(`${baseUrl}/api/memory/all`);
            const data = await response.json();

            assert.strictEqual(response.status, 401);
            assert.strictEqual(data.success, false);
            assert.strictEqual(data.error.code, 'MISSING_TOKEN');
        });

        test('Invalid token should be rejected', async () => {
            const response = await fetch(`${baseUrl}/api/memory/all`, {
                headers: {
                    'Authorization': 'Bearer invalid-token'
                }
            });
            const data = await response.json();

            assert.strictEqual(response.status, 403);
            assert.strictEqual(data.success, false);
            assert.strictEqual(data.error.code, 'INVALID_TOKEN');
        });
    });

    describe('Memory Operations', () => {
        const authHeaders = {
            'Authorization': 'Bearer test-token-123',
            'Content-Type': 'application/json'
        };

        test('POST /api/memory/save should save a memory', async () => {
            const response = await fetch(`${baseUrl}/api/memory/save`, {
                method: 'POST',
                headers: authHeaders,
                body: JSON.stringify({
                    text: 'This is a test memory',
                    userId: 'test-user'
                })
            });
            const data = await response.json();

            assert.strictEqual(response.status, 201);
            assert.strictEqual(data.success, true);
            assert(data.data.id);
            assert(data.data.message.includes('Successfully saved memory'));
        });

        test('GET /api/memory/all should return memories', async () => {
            const response = await fetch(`${baseUrl}/api/memory/all?userId=test-user`, {
                headers: authHeaders
            });
            const data = await response.json();

            assert.strictEqual(response.status, 200);
            assert.strictEqual(data.success, true);
            assert(Array.isArray(data.data.memories));
            assert(data.data.memories.length > 0);
        });

        test('GET /api/memory/search should search memories', async () => {
            const response = await fetch(`${baseUrl}/api/memory/search?query=test&userId=test-user`, {
                headers: authHeaders
            });
            const data = await response.json();

            assert.strictEqual(response.status, 200);
            assert.strictEqual(data.success, true);
            assert(Array.isArray(data.data.memories));
        });

        test('POST /api/memory/save should validate required fields', async () => {
            const response = await fetch(`${baseUrl}/api/memory/save`, {
                method: 'POST',
                headers: authHeaders,
                body: JSON.stringify({
                    userId: 'test-user'
                    // Missing text field
                })
            });
            const data = await response.json();

            assert.strictEqual(response.status, 400);
            assert.strictEqual(data.success, false);
            assert.strictEqual(data.error.code, 'VALIDATION_ERROR');
        });
    });

    describe('Error Handling', () => {
        test('404 for unknown routes', async () => {
            const response = await fetch(`${baseUrl}/api/unknown`);
            const data = await response.json();

            assert.strictEqual(response.status, 404);
            assert.strictEqual(data.success, false);
            assert.strictEqual(data.error.code, 'ROUTE_NOT_FOUND');
        });

        test('Response should include request ID', async () => {
            const response = await fetch(`${baseUrl}/api/health`);
            const data = await response.json();

            assert(data.requestId);
            assert(response.headers.get('X-Request-ID'));
        });
    });
});