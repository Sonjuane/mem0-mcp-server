import express from 'express';
import { authenticateToken } from '../middleware/auth.js';

/**
 * Create memory routes with the provided controller
 * @param {MemoryController} memoryController - The memory controller instance
 * @returns {express.Router} Express router with memory routes
 */
export function createMemoryRoutes(memoryController) {
    const router = express.Router();

    // All memory routes require authentication
    router.use(authenticateToken);

    // POST /api/memory/save - Save a new memory
    router.post('/save', (req, res, next) => {
        memoryController.saveMemory(req, res, next);
    });

    // GET /api/memory/all - Get all memories for a user
    router.get('/all', (req, res, next) => {
        memoryController.getAllMemories(req, res, next);
    });

    // GET /api/memory/search - Search memories
    router.get('/search', (req, res, next) => {
        memoryController.searchMemories(req, res, next);
    });

    // GET /api/memory/:id - Get a specific memory by ID
    router.get('/:id', (req, res, next) => {
        memoryController.getMemoryById(req, res, next);
    });

    // PUT /api/memory/:id - Update a memory
    router.put('/:id', (req, res, next) => {
        memoryController.updateMemory(req, res, next);
    });

    // DELETE /api/memory/:id - Delete a memory
    router.delete('/:id', (req, res, next) => {
        memoryController.deleteMemory(req, res, next);
    });

    return router;
}

/**
 * Create public routes (health and info endpoints)
 * @param {MemoryController} memoryController - The memory controller instance
 * @returns {express.Router} Express router with public routes
 */
export function createPublicRoutes(memoryController) {
    const router = express.Router();

    // GET /api/health - Health check endpoint (no auth required)
    router.get('/health', (req, res, next) => {
        memoryController.getHealth(req, res, next);
    });

    // GET /api/info - Server information endpoint (no auth required)
    router.get('/info', (req, res, next) => {
        memoryController.getInfo(req, res, next);
    });

    return router;
}