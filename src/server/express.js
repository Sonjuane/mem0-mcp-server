import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { MemoryController } from './controllers/memoryController.js';
import { createMemoryRoutes, createPublicRoutes } from './routes/memory.js';
import {
    errorHandler,
    notFoundHandler,
    requestIdMiddleware,
    requestLogger
} from './middleware/errorHandler.js';
import { logger } from '../utils/logger.js';

/**
 * Express server implementation for the Mem0 MCP Server
 * Provides HTTP API access to memory operations
 */
export class ExpressServer {
    constructor(memoryService, mcpServer = null) {
        this.memoryService = memoryService;
        this.mcpServer = mcpServer;
        this.app = express();
        this.server = null;
        this.sseTransports = new Map(); // Track SSE transport sessions
        this.setupMiddleware();
        this.setupRoutes();
        this.setupErrorHandling();
    }

    /**
     * Setup Express middleware
     */
    setupMiddleware() {
        // Trust proxy for accurate IP addresses
        this.app.set('trust proxy', 1);

        // Request ID and logging
        this.app.use(requestIdMiddleware);
        this.app.use(requestLogger);

        // Security middleware
        this.app.use(helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    scriptSrc: ["'self'"],
                    imgSrc: ["'self'", "data:", "https:"],
                },
            },
            crossOriginEmbedderPolicy: false
        }));

        // CORS configuration
        const corsOrigins = process.env.CORS_ORIGINS
            ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim())
            : ['http://localhost:*', 'https://localhost:*'];

        this.app.use(cors({
            origin: (origin, callback) => {
                // Allow requests with no origin (like mobile apps or curl requests)
                if (!origin) return callback(null, true);

                // Check if origin matches any of the allowed patterns
                const isAllowed = corsOrigins.some(allowedOrigin => {
                    if (allowedOrigin.includes('*')) {
                        // Convert wildcard pattern to regex
                        const pattern = allowedOrigin.replace(/\*/g, '.*');
                        const regex = new RegExp(`^${pattern}$`);
                        return regex.test(origin);
                    }
                    return allowedOrigin === origin;
                });

                if (isAllowed) {
                    callback(null, true);
                } else {
                    logger.warn('CORS blocked origin:', { origin, allowedOrigins: corsOrigins });
                    callback(new Error('Not allowed by CORS'));
                }
            },
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Workspace-Path']
        }));

        // Rate limiting
        const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000; // 15 minutes
        const maxRequests = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100;

        const limiter = rateLimit({
            windowMs,
            max: maxRequests,
            message: {
                success: false,
                data: null,
                error: {
                    code: 'RATE_LIMIT_EXCEEDED',
                    message: `Too many requests. Limit: ${maxRequests} requests per ${windowMs / 1000 / 60} minutes`,
                    details: {
                        limit: maxRequests,
                        windowMs,
                        retryAfter: Math.ceil(windowMs / 1000)
                    }
                },
                timestamp: new Date().toISOString()
            },
            standardHeaders: true,
            legacyHeaders: false,
            handler: (req, res) => {
                logger.warn('Rate limit exceeded:', {
                    ip: req.ip,
                    userAgent: req.get('User-Agent'),
                    path: req.path
                });
                res.status(429).json(limiter.message);
            }
        });

        this.app.use('/api/', limiter);

        // Body parsing middleware - exclude /message endpoint for SSE transport
        this.app.use((req, res, next) => {
            if (req.path === '/message') {
                // Skip body parsing for SSE message endpoint
                return next();
            }
            express.json({ limit: '10mb' })(req, res, next);
        });

        this.app.use((req, res, next) => {
            if (req.path === '/message') {
                // Skip body parsing for SSE message endpoint
                return next();
            }
            express.urlencoded({ extended: true, limit: '10mb' })(req, res, next);
        });
    }

    /**
     * Setup API routes
     */
    setupRoutes() {
        const memoryController = new MemoryController(this.memoryService);

        // SSE MCP transport endpoints (if MCP server is provided)
        if (this.mcpServer) {
            this.setupSSERoutes();
        }

        // Public routes (no authentication required)
        this.app.use('/api', createPublicRoutes(memoryController));

        // Protected memory routes
        this.app.use('/api/memory', createMemoryRoutes(memoryController));

        // Root endpoint
        this.app.get('/', (req, res) => {
            const endpoints = {
                health: 'GET /api/health',
                info: 'GET /api/info',
                saveMemory: 'POST /api/memory/save',
                getAllMemories: 'GET /api/memory/all',
                searchMemories: 'GET /api/memory/search',
                getMemory: 'GET /api/memory/:id',
                updateMemory: 'PUT /api/memory/:id',
                deleteMemory: 'DELETE /api/memory/:id'
            };

            // Add SSE endpoints if MCP server is available
            if (this.mcpServer) {
                endpoints.mcpSSE = 'GET /sse';
                endpoints.mcpMessage = 'POST /message';
            }

            res.json({
                success: true,
                data: {
                    name: 'Mem0 MCP Server - HTTP API',
                    version: '0.1.0',
                    description: 'HTTP API for long term memory storage and retrieval with Mem0',
                    transport: process.env.TRANSPORT || 'sse',
                    endpoints,
                    authentication: 'Bearer token required for memory operations',
                    documentation: 'See docs/HTTP_API.md for detailed API documentation'
                },
                error: null,
                timestamp: new Date().toISOString(),
                requestId: req.requestId
            });
        });
    }

    /**
     * Setup SSE routes for MCP transport
     */
    setupSSERoutes() {
        // SSE endpoint for MCP clients
        this.app.get('/sse', async (req, res) => {
            try {
                logger.info('New SSE MCP connection established');
                logger.info('Connection headers:', req.headers);
                logger.info('MCP Server info:', {
                    name: this.mcpServer.server.info.name,
                    version: this.mcpServer.server.info.version
                });

                logger.info('Creating SSE transport...');

                // Create SSE transport - let it handle the headers
                const transport = new SSEServerTransport('/message', res);
                logger.info('SSE transport created', { sessionId: transport.sessionId });

                // Store transport for message routing
                this.sseTransports.set(transport.sessionId, transport);
                logger.info('Transport stored in map');

                // Setup transport cleanup
                transport.onclose = () => {
                    logger.info('SSE MCP connection closed', { sessionId: transport.sessionId });
                    this.sseTransports.delete(transport.sessionId);
                };

                logger.info('About to connect MCP server to transport...');

                // Make sure server name is set correctly before connecting
                if (process.env.MCP_SERVER_NAME) {
                    logger.info(`Ensuring server name is set to: ${process.env.MCP_SERVER_NAME}`);
                    this.mcpServer.updateServerName(process.env.MCP_SERVER_NAME);
                } else {
                    logger.info(`Using current server name: ${this.mcpServer.server.info.name}`);
                }

                // Connect MCP server to this transport
                await this.mcpServer.server.connect(transport);

                logger.info('MCP server connected to SSE transport', {
                    sessionId: transport.sessionId,
                    serverName: this.mcpServer.server.info.name
                });
            } catch (error) {
                logger.error('Failed to establish SSE MCP connection:', error);
                if (!res.headersSent) {
                    res.status(500).json({
                        success: false,
                        error: {
                            code: 'SSE_CONNECTION_FAILED',
                            message: 'Failed to establish SSE connection',
                            details: error.message
                        }
                    });
                }
            }
        });

        // Message endpoint for MCP clients
        this.app.post('/message', async (req, res) => {
            try {
                const sessionId = req.query.sessionId;

                logger.debug('Message endpoint called', {
                    sessionId,
                    query: req.query,
                    headers: req.headers,
                    activeSessions: Array.from(this.sseTransports.keys())
                });

                if (!sessionId) {
                    logger.warn('Missing session ID in message request', {
                        query: req.query,
                        activeSessions: Array.from(this.sseTransports.keys())
                    });
                    return res.status(400).json({
                        success: false,
                        error: {
                            code: 'MISSING_SESSION_ID',
                            message: 'Session ID is required',
                            activeSessions: Array.from(this.sseTransports.keys())
                        }
                    });
                }

                const transport = this.sseTransports.get(sessionId);

                if (!transport) {
                    logger.warn('Session not found', {
                        sessionId,
                        activeSessions: Array.from(this.sseTransports.keys())
                    });
                    return res.status(404).json({
                        success: false,
                        error: {
                            code: 'SESSION_NOT_FOUND',
                            message: 'SSE session not found',
                            requestedSession: sessionId,
                            activeSessions: Array.from(this.sseTransports.keys())
                        }
                    });
                }

                await transport.handlePostMessage(req, res);
                logger.debug('MCP message processed', { sessionId });
            } catch (error) {
                logger.error('Failed to process MCP message:', error);
                res.status(500).json({
                    success: false,
                    error: {
                        code: 'MESSAGE_PROCESSING_FAILED',
                        message: 'Failed to process message',
                        details: error.message
                    }
                });
            }
        });

        logger.info('SSE MCP transport routes configured');
    }

    /**
     * Setup error handling
     */
    setupErrorHandling() {
        // 404 handler for unmatched routes
        this.app.use(notFoundHandler);

        // Global error handler
        this.app.use(errorHandler);
    }

    /**
     * Start the Express server
     * @param {number} port - Port to listen on
     * @param {string} host - Host to bind to
     * @returns {Promise<void>}
     */
    async start(port = 3000, host = '0.0.0.0') {
        return new Promise((resolve, reject) => {
            try {
                this.server = this.app.listen(port, host, () => {
                    logger.info(`Express server started on http://${host}:${port}`);
                    logger.info('Available endpoints:');
                    logger.info('  GET  /                    - API information');
                    logger.info('  GET  /api/health          - Health check');
                    logger.info('  GET  /api/info            - Server information');
                    logger.info('  POST /api/memory/save     - Save memory');
                    logger.info('  GET  /api/memory/all      - Get all memories');
                    logger.info('  GET  /api/memory/search   - Search memories');
                    logger.info('  GET  /api/memory/:id      - Get memory by ID');
                    logger.info('  PUT  /api/memory/:id      - Update memory');
                    logger.info('  DELETE /api/memory/:id    - Delete memory');
                    resolve();
                });

                this.server.on('error', (error) => {
                    if (error.code === 'EADDRINUSE') {
                        logger.error(`Port ${port} is already in use`);
                        reject(new Error(`Port ${port} is already in use`));
                    } else {
                        logger.error('Express server error:', error);
                        reject(error);
                    }
                });
            } catch (error) {
                logger.error('Failed to start Express server:', error);
                reject(error);
            }
        });
    }

    /**
     * Stop the Express server
     * @returns {Promise<void>}
     */
    async stop() {
        return new Promise((resolve) => {
            if (this.server) {
                this.server.close(() => {
                    logger.info('Express server stopped');
                    resolve();
                });
            } else {
                resolve();
            }
        });
    }

    /**
     * Get the Express app instance
     * @returns {express.Application}
     */
    getApp() {
        return this.app;
    }
}

/**
 * Start Express server with the provided memory service
 * @param {MemoryService} memoryService - The memory service instance
 * @param {Mem0MCPServer} mcpServer - The MCP server instance (optional, for SSE transport)
 * @returns {Promise<ExpressServer>}
 */
export async function startExpressServer(memoryService, mcpServer = null) {
    const port = parseInt(process.env.HTTP_SERVER_PORT) || 3000;
    const host = process.env.HTTP_SERVER_HOST || '0.0.0.0';

    const expressServer = new ExpressServer(memoryService, mcpServer);
    await expressServer.start(port, host);

    return expressServer;
}