#!/usr/bin/env node

/**
 * Script to start the Mem0 MCP Server with proper configuration
 * Run this before attempting to connect with clients
 */

import { Mem0MCPServer } from '../src/main.js';
import { logger } from '../src/utils/logger.js';
import dotenv from 'dotenv';
import { promises as fs } from 'fs';
import path from 'path';

// Set logging to maximum verbosity
logger.level = 'debug';

// Load environment variables
dotenv.config();

// Ensure critical environment variables
process.env.MCP_SERVER_NAME = 'mem0-http';
process.env.HTTP_SERVER_ENABLED = 'true';
process.env.HTTP_SERVER_PORT = process.env.HTTP_SERVER_PORT || '8484';
process.env.TRANSPORT = 'sse';

// Create .roo directory if it doesn't exist
async function ensureRooDirectory() {
    try {
        const rooDir = path.join(process.cwd(), '.roo');
        await fs.mkdir(rooDir, { recursive: true });
        logger.info(`Ensured .roo directory exists: ${rooDir}`);

        // Create mcp.json if it doesn't exist
        const mcpJsonPath = path.join(rooDir, 'mcp.json');
        try {
            await fs.access(mcpJsonPath);
            logger.info(`MCP config exists: ${mcpJsonPath}`);
        } catch (err) {
            // File doesn't exist, create it
            const config = {
                mcpServers: {
                    "mem0-http": {
                        transport: "sse",
                        url: `http://localhost:${process.env.HTTP_SERVER_PORT}/sse`,
                        headers: {
                            Authorization: `Bearer ${process.env.API_TOKEN || 'your-secure-api-token-here'}`
                        },
                        env: {
                            HTTP_SERVER_ENABLED: "true",
                            HTTP_SERVER_PORT: process.env.HTTP_SERVER_PORT || "8484",
                            API_TOKEN: process.env.API_TOKEN || "your-secure-api-token-here",
                            STORAGE_PROVIDER: "local",
                            DEFAULT_USER_ID: "vscode-user"
                        },
                        description: "Mem0 MCP Server via HTTP - Memory storage and retrieval"
                    }
                }
            };

            await fs.writeFile(mcpJsonPath, JSON.stringify(config, null, 2), 'utf8');
            logger.info(`Created MCP config: ${mcpJsonPath}`);
        }
    } catch (err) {
        logger.error(`Error ensuring .roo directory: ${err.message}`);
    }
}

// Start the MCP server
async function startServer() {
    try {
        // Ensure .roo directory and config exists
        await ensureRooDirectory();

        logger.info('Starting Mem0 MCP Server...');
        logger.info(`Server name: ${process.env.MCP_SERVER_NAME}`);
        logger.info(`HTTP server: ${process.env.HTTP_SERVER_ENABLED} on port ${process.env.HTTP_SERVER_PORT}`);

        // Initialize and run the server
        const server = new Mem0MCPServer();
        await server.run();

        logger.info('Mem0 MCP Server started successfully');
        logger.info(`Connect clients to: http://localhost:${process.env.HTTP_SERVER_PORT}/sse`);

        // Keep the process running
        process.on('SIGINT', async () => {
            logger.info('Shutting down server...');
            await server.shutdown();
            process.exit(0);
        });
    } catch (err) {
        logger.error(`Failed to start server: ${err.message}`);
        process.exit(1);
    }
}

// Execute
startServer();