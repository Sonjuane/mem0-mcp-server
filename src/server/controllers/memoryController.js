import { logger } from '../../utils/logger.js';

/**
 * Memory controller that handles HTTP API requests
 * Uses the MemoryService for business logic
 */
export class MemoryController {
    constructor(memoryService) {
        this.memoryService = memoryService;
    }

    /**
     * Save a new memory
     * POST /api/memory/save
     */
    async saveMemory(req, res, next) {
        try {
            const { text, userId, metadata } = req.body;

            // Validation
            if (!text || typeof text !== 'string') {
                return res.status(400).json({
                    success: false,
                    data: null,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Text is required and must be a string',
                        details: { field: 'text', received: typeof text }
                    },
                    timestamp: new Date().toISOString(),
                    requestId: req.requestId
                });
            }

            const defaultUserId = process.env.DEFAULT_USER_ID || 'user';
            const finalUserId = userId || defaultUserId;

            const result = await this.memoryService.saveMemory(text, finalUserId, metadata);

            res.status(201).json({
                success: true,
                data: {
                    id: result.id,
                    message: result.message,
                    userId: finalUserId
                },
                error: null,
                timestamp: new Date().toISOString(),
                requestId: req.requestId
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get all memories for a user
     * GET /api/memory/all
     */
    async getAllMemories(req, res, next) {
        try {
            const { userId, limit } = req.query;
            const defaultUserId = process.env.DEFAULT_USER_ID || 'user';
            const finalUserId = userId || defaultUserId;
            const finalLimit = limit ? parseInt(limit, 10) : 50;

            // Validate limit
            if (isNaN(finalLimit) || finalLimit < 1 || finalLimit > 1000) {
                return res.status(400).json({
                    success: false,
                    data: null,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Limit must be a number between 1 and 1000',
                        details: { field: 'limit', received: limit }
                    },
                    timestamp: new Date().toISOString(),
                    requestId: req.requestId
                });
            }

            const memories = await this.memoryService.getAllMemories(finalUserId, finalLimit);

            res.json({
                success: true,
                data: {
                    memories,
                    count: memories.length,
                    userId: finalUserId,
                    limit: finalLimit
                },
                error: null,
                timestamp: new Date().toISOString(),
                requestId: req.requestId
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Search memories
     * GET /api/memory/search
     */
    async searchMemories(req, res, next) {
        try {
            const { query, userId, limit } = req.query;

            // Validation
            if (!query || typeof query !== 'string') {
                return res.status(400).json({
                    success: false,
                    data: null,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Query is required and must be a string',
                        details: { field: 'query', received: typeof query }
                    },
                    timestamp: new Date().toISOString(),
                    requestId: req.requestId
                });
            }

            const defaultUserId = process.env.DEFAULT_USER_ID || 'user';
            const finalUserId = userId || defaultUserId;
            const finalLimit = limit ? parseInt(limit, 10) : 10;

            // Validate limit
            if (isNaN(finalLimit) || finalLimit < 1 || finalLimit > 100) {
                return res.status(400).json({
                    success: false,
                    data: null,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Limit must be a number between 1 and 100',
                        details: { field: 'limit', received: limit }
                    },
                    timestamp: new Date().toISOString(),
                    requestId: req.requestId
                });
            }

            const memories = await this.memoryService.searchMemories(query, finalUserId, finalLimit);

            res.json({
                success: true,
                data: {
                    memories,
                    count: memories.length,
                    query,
                    userId: finalUserId,
                    limit: finalLimit
                },
                error: null,
                timestamp: new Date().toISOString(),
                requestId: req.requestId
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get a specific memory by ID
     * GET /api/memory/:id
     */
    async getMemoryById(req, res, next) {
        try {
            const { id } = req.params;
            const { userId } = req.query;
            const defaultUserId = process.env.DEFAULT_USER_ID || 'user';
            const finalUserId = userId || defaultUserId;

            const memory = await this.memoryService.getMemoryById(id, finalUserId);

            if (!memory) {
                return res.status(404).json({
                    success: false,
                    data: null,
                    error: {
                        code: 'MEMORY_NOT_FOUND',
                        message: `Memory with ID ${id} not found for user ${finalUserId}`,
                        details: { memoryId: id, userId: finalUserId }
                    },
                    timestamp: new Date().toISOString(),
                    requestId: req.requestId
                });
            }

            res.json({
                success: true,
                data: {
                    memory,
                    userId: finalUserId
                },
                error: null,
                timestamp: new Date().toISOString(),
                requestId: req.requestId
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Update a memory
     * PUT /api/memory/:id
     */
    async updateMemory(req, res, next) {
        try {
            const { id } = req.params;
            const { text, userId, metadata } = req.body;

            // Validation
            if (!text || typeof text !== 'string') {
                return res.status(400).json({
                    success: false,
                    data: null,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Text is required and must be a string',
                        details: { field: 'text', received: typeof text }
                    },
                    timestamp: new Date().toISOString(),
                    requestId: req.requestId
                });
            }

            const defaultUserId = process.env.DEFAULT_USER_ID || 'user';
            const finalUserId = userId || defaultUserId;

            const success = await this.memoryService.updateMemory(id, finalUserId, text, metadata);

            if (!success) {
                return res.status(404).json({
                    success: false,
                    data: null,
                    error: {
                        code: 'MEMORY_NOT_FOUND',
                        message: `Memory with ID ${id} not found for user ${finalUserId}`,
                        details: { memoryId: id, userId: finalUserId }
                    },
                    timestamp: new Date().toISOString(),
                    requestId: req.requestId
                });
            }

            res.json({
                success: true,
                data: {
                    id,
                    message: 'Memory updated successfully',
                    userId: finalUserId
                },
                error: null,
                timestamp: new Date().toISOString(),
                requestId: req.requestId
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Delete a memory
     * DELETE /api/memory/:id
     */
    async deleteMemory(req, res, next) {
        try {
            const { id } = req.params;
            const { userId } = req.query;
            const defaultUserId = process.env.DEFAULT_USER_ID || 'user';
            const finalUserId = userId || defaultUserId;

            const success = await this.memoryService.deleteMemory(id, finalUserId);

            if (!success) {
                return res.status(404).json({
                    success: false,
                    data: null,
                    error: {
                        code: 'MEMORY_NOT_FOUND',
                        message: `Memory with ID ${id} not found for user ${finalUserId}`,
                        details: { memoryId: id, userId: finalUserId }
                    },
                    timestamp: new Date().toISOString(),
                    requestId: req.requestId
                });
            }

            res.json({
                success: true,
                data: {
                    id,
                    message: 'Memory deleted successfully',
                    userId: finalUserId
                },
                error: null,
                timestamp: new Date().toISOString(),
                requestId: req.requestId
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get server health
     * GET /api/health
     */
    async getHealth(req, res, next) {
        try {
            const health = await this.memoryService.getHealthInfo();

            const statusCode = health.status === 'healthy' ? 200 : 503;

            res.status(statusCode).json({
                success: health.status === 'healthy',
                data: health,
                error: health.status === 'healthy' ? null : {
                    code: 'UNHEALTHY',
                    message: 'Service is not healthy',
                    details: health.error ? { error: health.error } : {}
                },
                timestamp: new Date().toISOString(),
                requestId: req.requestId
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get server information
     * GET /api/info
     */
    async getInfo(req, res, next) {
        try {
            const info = await this.memoryService.getServerInfo();

            res.json({
                success: true,
                data: info,
                error: null,
                timestamp: new Date().toISOString(),
                requestId: req.requestId
            });
        } catch (error) {
            next(error);
        }
    }
}