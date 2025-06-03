#!/usr/bin/env node

import { test } from 'node:test';
import assert from 'node:assert';
import { ConfigReader } from '../src/config/reader.js';
import { promises as fs } from 'fs';
import path from 'path';

test('Environment Variable Override via env key', async (t) => {
    const testConfigDir = '.test-config';
    const testConfigPath = path.join(testConfigDir, 'mcp.json');

    // Create test configuration with env key
    const testConfig = {
        mcpServers: {
            'mem0-test': {
                transport: 'sse',
                url: 'http://localhost:8484/sse',
                env: {
                    HTTP_SERVER_ENABLED: 'true',
                    HTTP_SERVER_PORT: '9999',
                    API_TOKEN: 'test-token-from-env-key',
                    STORAGE_PROVIDER: 'local',
                    DEFAULT_USER_ID: 'env-test-user'
                },
                description: 'Test server with env overrides'
            }
        }
    };

    await t.test('should override environment variables from env key', async () => {
        try {
            // Create test directory and config file
            await fs.mkdir(testConfigDir, { recursive: true });
            await fs.writeFile(testConfigPath, JSON.stringify(testConfig, null, 2));

            // Store original environment values
            const originalValues = {
                HTTP_SERVER_PORT: process.env.HTTP_SERVER_PORT,
                API_TOKEN: process.env.API_TOKEN,
                DEFAULT_USER_ID: process.env.DEFAULT_USER_ID
            };

            // Set different initial values
            process.env.HTTP_SERVER_PORT = '3000';
            process.env.API_TOKEN = 'original-token';
            process.env.DEFAULT_USER_ID = 'original-user';

            // Create config reader and extract config
            const reader = new ConfigReader();
            reader.configPaths = [testConfigPath]; // Override config paths for testing

            const extractedConfig = await reader.readConfig();

            // Verify that environment variables were overridden
            assert.strictEqual(process.env.HTTP_SERVER_PORT, '9999', 'HTTP_SERVER_PORT should be overridden');
            assert.strictEqual(process.env.API_TOKEN, 'test-token-from-env-key', 'API_TOKEN should be overridden');
            assert.strictEqual(process.env.DEFAULT_USER_ID, 'env-test-user', 'DEFAULT_USER_ID should be overridden');

            console.log('✓ Environment variables successfully overridden from env key');
            console.log(`  HTTP_SERVER_PORT: ${process.env.HTTP_SERVER_PORT}`);
            console.log(`  API_TOKEN: ${process.env.API_TOKEN}`);
            console.log(`  DEFAULT_USER_ID: ${process.env.DEFAULT_USER_ID}`);

            // Restore original values
            for (const [key, value] of Object.entries(originalValues)) {
                if (value === undefined) {
                    delete process.env[key];
                } else {
                    process.env[key] = value;
                }
            }

        } finally {
            // Cleanup
            try {
                await fs.unlink(testConfigPath);
                await fs.rmdir(testConfigDir);
            } catch (error) {
                // Ignore cleanup errors
            }
        }
    });

    await t.test('should work without env key', async () => {
        const configWithoutEnv = {
            mcpServers: {
                'mem0-test': {
                    transport: 'sse',
                    url: 'http://localhost:8484/sse',
                    description: 'Test server without env overrides'
                }
            }
        };

        try {
            // Create test directory and config file
            await fs.mkdir(testConfigDir, { recursive: true });
            await fs.writeFile(testConfigPath, JSON.stringify(configWithoutEnv, null, 2));

            // Store original environment values
            const originalToken = process.env.API_TOKEN;
            process.env.API_TOKEN = 'original-token';

            // Create config reader and extract config
            const reader = new ConfigReader();
            reader.configPaths = [testConfigPath]; // Override config paths for testing

            const extractedConfig = await reader.readConfig();

            // Verify that environment variables were NOT overridden
            assert.strictEqual(process.env.API_TOKEN, 'original-token', 'API_TOKEN should remain unchanged');

            console.log('✓ Environment variables unchanged when env key not present');

            // Restore original values
            if (originalToken === undefined) {
                delete process.env.API_TOKEN;
            } else {
                process.env.API_TOKEN = originalToken;
            }

        } finally {
            // Cleanup
            try {
                await fs.unlink(testConfigPath);
                await fs.rmdir(testConfigDir);
            } catch (error) {
                // Ignore cleanup errors
            }
        }
    });

    console.log('🎉 Environment override tests completed!');
});