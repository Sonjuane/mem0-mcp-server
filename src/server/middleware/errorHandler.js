import { logger } from '../../utils/logger.js';

/**
 * Global error handling middleware for Express server
 * Catches and formats all errors in a consistent format
 */
export function errorHandler(err, req, res, next) {
    // Log the error
    logger.error('Express server error:', {
        error: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        requestId: req.requestId
    });

    // Default error response
    let statusCode = 500;
    let errorCode = 'INTERNAL_SERVER_ERROR';
    let message = 'An internal server error occurred';
    let details = {};

    // Handle specific error types
    if (err.name === 'ValidationError') {
        statusCode = 400;
        errorCode = 'VALIDATION_ERROR';
        message = 'Request validation failed';
        details = { validationErrors: err.details || [] };
    } else if (err.name === 'UnauthorizedError') {
        statusCode = 401;
        errorCode = 'UNAUTHORIZED';
        message = 'Authentication required';
    } else if (err.name === 'ForbiddenError') {
        statusCode = 403;
        errorCode = 'FORBIDDEN';
        message = 'Access denied';
    } else if (err.name === 'NotFoundError') {
        statusCode = 404;
        errorCode = 'NOT_FOUND';
        message = 'Resource not found';
    } else if (err.name === 'ConflictError') {
        statusCode = 409;
        errorCode = 'CONFLICT';
        message = 'Resource conflict';
    } else if (err.statusCode) {
        // Express errors with status codes
        statusCode = err.statusCode;
        errorCode = err.code || 'HTTP_ERROR';
        message = err.message || message;
    }

    // Don't expose internal error details in production
    if (process.env.NODE_ENV === 'production' && statusCode === 500) {
        message = 'An internal server error occurred';
        details = {};
    } else if (statusCode === 500) {
        details = {
            error: err.message,
            ...(process.env.DEBUG === 'true' && { stack: err.stack })
        };
    }

    // Send error response
    res.status(statusCode).json({
        success: false,
        data: null,
        error: {
            code: errorCode,
            message: message,
            details: details
        },
        timestamp: new Date().toISOString(),
        requestId: req.requestId
    });
}

/**
 * 404 handler for unmatched routes
 */
export function notFoundHandler(req, res) {
    logger.warn('Route not found:', {
        path: req.path,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        requestId: req.requestId
    });

    res.status(404).json({
        success: false,
        data: null,
        error: {
            code: 'ROUTE_NOT_FOUND',
            message: `Route ${req.method} ${req.path} not found`,
            details: {
                availableRoutes: [
                    'GET /api/health',
                    'GET /api/info',
                    'POST /api/memory/save',
                    'GET /api/memory/all',
                    'GET /api/memory/search',
                    'GET /api/memory/:id',
                    'PUT /api/memory/:id',
                    'DELETE /api/memory/:id'
                ]
            }
        },
        timestamp: new Date().toISOString(),
        requestId: req.requestId
    });
}

/**
 * Request ID middleware to track requests
 */
export function requestIdMiddleware(req, res, next) {
    req.requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    res.setHeader('X-Request-ID', req.requestId);
    next();
}

/**
 * Request logging middleware
 */
export function requestLogger(req, res, next) {
    const start = Date.now();

    // Log request
    logger.info('HTTP Request:', {
        method: req.method,
        path: req.path,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        requestId: req.requestId
    });

    // Log response when finished
    res.on('finish', () => {
        const duration = Date.now() - start;
        logger.info('HTTP Response:', {
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
            duration: `${duration}ms`,
            requestId: req.requestId
        });
    });

    next();
}