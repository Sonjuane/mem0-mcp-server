import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import dotenv from 'dotenv';
import { createStorageProvider } from './storage/index.js';
import { createMem0Client } from './mem0/client.js';
import { logger } from './utils/logger.js';
import { MemoryService } from './services/MemoryService.js';
import { startExpressServer } from './server/express.js';
import { loadMcpConfig } from './config/reader.js';

// Load environment variables
dotenv.config();

// Configuration will be loaded asynchronously
let config = null;

// Default server name to use if not specified in configuration
export const DEFAULT_SERVER_NAME = 'mem0-http';

class Mem0MCPServer {
    constructor() {
        // Server name configuration - important for client connections
        const serverName = process.env.MCP_SERVER_NAME || DEFAULT_SERVER_NAME;

        logger.info(`Initializing MCP server with name: ${serverName}`);

        this.server = new Server(
            {
                name: serverName,
                version: '0.1.0',
                description: 'MCP server for long term memory storage and retrieval with Mem0 - Node.js implementation'
            },
            {
                capabilities: {
                    tools: {}
                }
            }
        );

        logger.info('MCP server initialized with configuration:', {
            name: serverName,
            transport: process.env.TRANSPORT || 'sse'
        });

        this.storageProvider = null;
        this.mem0Client = null;
        this.memoryService = null;
        this.expressServer = null;
        this.setupHandlers();
    }

    /**
     * Update the MCP server name
     * @param {string} newName - New server name
     */
    updateServerName(newName) {
        if (!newName) return;

        logger.info(`Updating server name from "${this.server.info.name}" to "${newName}"`);
        this.server.info.name = newName;
    }

    async initialize() {
        try {
            // Load configuration from mcp.json and environment variables
            if (!config) {
                config = await loadMcpConfig();
                logger.info('Configuration loaded successfully');

                // Update server name if MCP_SERVER_NAME is in the config
                // This ensures the server name matches what clients expect
                if (config.mcpServerName) {
                    this.updateServerName(config.mcpServerName);
                    logger.info(`Updated server name to: ${config.mcpServerName}`);
                }
            }

            // Initialize storage provider with custom options
            const storageOptions = {};
            if (config.storageDirectory) {
                storageOptions.storageDirectory = config.storageDirectory;
            }

            this.storageProvider = await createStorageProvider(config.storageProvider, storageOptions);
            logger.info(`Initialized ${config.storageProvider} storage provider`);

            // Initialize Mem0 client
            this.mem0Client = await createMem0Client();
            logger.info('Initialized Mem0 client');

            // Initialize shared memory service
            this.memoryService = new MemoryService(this.storageProvider, this.mem0Client);
            logger.info('Initialized shared memory service');

            logger.info('Mem0 MCP Server initialized successfully');
        } catch (error) {
            logger.error('Failed to initialize server:', error);
            throw error;
        }
    }

    setupHandlers() {
        // List available tools
        this.server.setRequestHandler(ListToolsRequestSchema, async () => {
            return {
                tools: [
                    {
                        name: 'save_memory',
                        description: 'Save information to your long-term memory. This tool is designed to store any type of information that might be useful in the future. The content will be processed and indexed for later retrieval through semantic search.',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                text: {
                                    type: 'string',
                                    description: 'The content to store in memory, including any relevant details and context'
                                },
                                userId: {
                                    type: 'string',
                                    description: 'User ID for memory isolation (optional, defaults to configured user)',
                                    default: config.defaultUserId
                                }
                            },
                            required: ['text']
                        }
                    },
                    {
                        name: 'get_all_memories',
                        description: 'Get all stored memories for the user. Call this tool when you need complete context of all previously stored memories.',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                userId: {
                                    type: 'string',
                                    description: 'User ID for memory isolation (optional, defaults to configured user)',
                                    default: config.defaultUserId
                                },
                                limit: {
                                    type: 'number',
                                    description: 'Maximum number of memories to return (optional)',
                                    default: 50
                                }
                            },
                            required: []
                        }
                    },
                    {
                        name: 'search_memories',
                        description: 'Search memories using semantic search. This tool should be called to find relevant information from your memory. Results are ranked by relevance. Always search your memories before making decisions to ensure you leverage your existing knowledge.',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                query: {
                                    type: 'string',
                                    description: 'Search query string describing what you\'re looking for. Can be natural language.'
                                },
                                userId: {
                                    type: 'string',
                                    description: 'User ID for memory isolation (optional, defaults to configured user)',
                                    default: config.defaultUserId
                                },
                                limit: {
                                    type: 'number',
                                    description: 'Maximum number of results to return (default: 3)',
                                    default: 3
                                }
                            },
                            required: ['query']
                        }
                    }
                ]
            };
        });

        // Handle tool calls
        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;

            try {
                switch (name) {
                    case 'save_memory':
                        return await this.saveMemory(args);
                    case 'get_all_memories':
                        return await this.getAllMemories(args);
                    case 'search_memories':
                        return await this.searchMemories(args);
                    default:
                        throw new Error(`Unknown tool: ${name}`);
                }
            } catch (error) {
                logger.error(`Error executing tool ${name}:`, error);
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Error executing ${name}: ${error.message}`
                        }
                    ]
                };
            }
        });
    }

    async saveMemory(args) {
        const { text, userId = config.defaultUserId } = args;

        try {
            const result = await this.memoryService.saveMemory(text, userId);

            return {
                content: [
                    {
                        type: 'text',
                        text: result.message
                    }
                ]
            };
        } catch (error) {
            logger.error('Error saving memory:', error);
            throw error;
        }
    }

    async getAllMemories(args) {
        const { userId = config.defaultUserId, limit = 50 } = args;

        try {
            const memories = await this.memoryService.getAllMemories(userId, limit);

            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(memories, null, 2)
                    }
                ]
            };
        } catch (error) {
            logger.error('Error retrieving memories:', error);
            throw error;
        }
    }

    async searchMemories(args) {
        const { query, userId = config.defaultUserId, limit = 3 } = args;

        try {
            const memories = await this.memoryService.searchMemories(query, userId, limit);

            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(memories, null, 2)
                    }
                ]
            };
        } catch (error) {
            logger.error('Error searching memories:', error);
            throw error;
        }
    }

    async run() {
        await this.initialize();

        // Start HTTP server (always enabled in HTTP-only mode)
        try {
            this.expressServer = await startExpressServer(this.memoryService, this);
            logger.info('Mem0 MCP Server running in HTTP-only mode');
            logger.info(`Server available at: http://${config.httpServerHost}:${config.httpServerPort}`);
        } catch (error) {
            logger.error('Failed to start HTTP server:', error);
            throw error;
        }
    }

    async shutdown() {
        logger.info('Shutting down Mem0 MCP Server...');

        // Stop HTTP server if running
        if (this.expressServer) {
            await this.expressServer.stop();
        }

        // Cleanup storage provider
        if (this.storageProvider && this.storageProvider.cleanup) {
            await this.storageProvider.cleanup();
        }

        logger.info('Mem0 MCP Server shutdown complete');
    }
}

// Global server instance for graceful shutdown
let serverInstance = null;

// Main execution
async function main() {
    try {
        // Load configuration first
        config = await loadMcpConfig();
        logger.info('Configuration loaded successfully');

        serverInstance = new Mem0MCPServer();
        await serverInstance.run();
    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
}

// Handle graceful shutdown
async function gracefulShutdown(signal) {
    logger.info(`Received ${signal}, shutting down gracefully...`);

    if (serverInstance) {
        try {
            await serverInstance.shutdown();
        } catch (error) {
            logger.error('Error during shutdown:', error);
        }
    }

    process.exit(0);
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception:', error);
    gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled rejection at:', promise, 'reason:', reason);
    gracefulShutdown('unhandledRejection');
});

if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

export { Mem0MCPServer };