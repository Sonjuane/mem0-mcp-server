import { logger } from '../../utils/logger.js';

/**
 * Authentication middleware for Express server
 * Validates Bearer token against configured API_TOKEN
 */
export function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        logger.warn('Authentication failed: No token provided', {
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            path: req.path
        });
        return res.status(401).json({
            success: false,
            data: null,
            error: {
                code: 'MISSING_TOKEN',
                message: 'Access token required. Please provide a Bearer token in the Authorization header.',
                details: {
                    expectedFormat: 'Authorization: Bearer your-api-token-here'
                }
            },
            timestamp: new Date().toISOString(),
            requestId: req.requestId
        });
    }

    const expectedToken = process.env.API_TOKEN;
    if (!expectedToken) {
        logger.error('Server configuration error: API_TOKEN not set');
        return res.status(500).json({
            success: false,
            data: null,
            error: {
                code: 'SERVER_CONFIG_ERROR',
                message: 'Server authentication not properly configured',
                details: {}
            },
            timestamp: new Date().toISOString(),
            requestId: req.requestId
        });
    }

    if (token !== expectedToken) {
        logger.warn('Authentication failed: Invalid token', {
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            path: req.path,
            tokenLength: token.length
        });
        return res.status(403).json({
            success: false,
            data: null,
            error: {
                code: 'INVALID_TOKEN',
                message: 'Invalid access token provided',
                details: {}
            },
            timestamp: new Date().toISOString(),
            requestId: req.requestId
        });
    }

    logger.debug('Authentication successful', {
        ip: req.ip,
        path: req.path
    });

    next();
}

/**
 * Optional authentication middleware that allows requests without tokens
 * but validates them if provided
 */
export function optionalAuth(req, res, next) {
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
        // No auth header provided, continue without authentication
        return next();
    }

    // Auth header provided, validate it
    return authenticateToken(req, res, next);
}