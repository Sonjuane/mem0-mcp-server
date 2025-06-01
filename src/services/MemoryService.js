import { logger } from '../utils/logger.js';

/**
 * Shared memory service that provides business logic for memory operations
 * Used by both MCP tools and HTTP API endpoints
 */
export class MemoryService {
    constructor(storageProvider, mem0Client = null) {
        this.storageProvider = storageProvider;
        this.mem0Client = mem0Client;
    }

    /**
     * Save a memory for a user
     * @param {string} text - Memory content
     * @param {string} userId - User identifier
     * @param {object} metadata - Additional metadata
     * @returns {Promise<{id: string, message: string}>}
     */
    async saveMemory(text, userId, metadata = {}) {
        try {
            // Process memory with Mem0 if available, otherwise store directly
            let processedMemory = text;
            if (this.mem0Client) {
                processedMemory = await this.mem0Client.processMemory(text);
            }

            // Save to storage provider
            const memoryId = await this.storageProvider.saveMemory(userId, processedMemory, {
                originalText: text,
                timestamp: new Date().toISOString(),
                ...metadata
            });

            const successMessage = text.length > 100
                ? `Successfully saved memory: ${text.substring(0, 100)}...`
                : `Successfully saved memory: ${text}`;

            logger.info(`Saved memory ${memoryId} for user ${userId}`);

            return {
                id: memoryId,
                message: successMessage
            };
        } catch (error) {
            logger.error('Error saving memory:', error);
            throw error;
        }
    }

    /**
     * Get all memories for a user
     * @param {string} userId - User identifier
     * @param {number} limit - Maximum number of memories to return
     * @returns {Promise<Array>}
     */
    async getAllMemories(userId, limit = 50) {
        try {
            const memories = await this.storageProvider.getAllMemories(userId, limit);
            logger.info(`Retrieved ${memories.length} memories for user ${userId}`);
            return memories;
        } catch (error) {
            logger.error('Error retrieving memories:', error);
            throw error;
        }
    }

    /**
     * Search memories for a user
     * @param {string} query - Search query
     * @param {string} userId - User identifier
     * @param {number} limit - Maximum number of results
     * @returns {Promise<Array>}
     */
    async searchMemories(query, userId, limit = 3) {
        try {
            let memories;

            // Use Mem0 client for semantic search if available, otherwise fallback to storage provider
            if (this.mem0Client) {
                memories = await this.mem0Client.searchMemories(query, userId, limit);
            } else {
                memories = await this.storageProvider.searchMemories(query, userId, limit);
            }

            // Ensure memories is an array
            if (!memories) {
                memories = [];
            }

            logger.info(`Found ${memories.length} memories for query "${query}" (user: ${userId})`);
            return memories;
        } catch (error) {
            logger.error('Error searching memories:', error);
            throw error;
        }
    }

    /**
     * Get a specific memory by ID
     * @param {string} memoryId - Memory identifier
     * @param {string} userId - User identifier
     * @returns {Promise<object|null>}
     */
    async getMemoryById(memoryId, userId) {
        try {
            const memories = await this.getAllMemories(userId, 1000);
            const memory = memories.find(m => m.id === memoryId);

            if (memory) {
                logger.info(`Retrieved memory ${memoryId} for user ${userId}`);
            } else {
                logger.warn(`Memory ${memoryId} not found for user ${userId}`);
            }

            return memory || null;
        } catch (error) {
            logger.error('Error retrieving memory by ID:', error);
            throw error;
        }
    }

    /**
     * Update a memory
     * @param {string} memoryId - Memory identifier
     * @param {string} userId - User identifier
     * @param {string} text - Updated memory content
     * @param {object} metadata - Updated metadata
     * @returns {Promise<boolean>}
     */
    async updateMemory(memoryId, userId, text, metadata = {}) {
        try {
            // Process memory with Mem0 if available
            let processedMemory = text;
            if (this.mem0Client) {
                processedMemory = await this.mem0Client.processMemory(text);
            }

            const success = await this.storageProvider.updateMemory(memoryId, userId, processedMemory, {
                originalText: text,
                updatedAt: new Date().toISOString(),
                ...metadata
            });

            if (success) {
                logger.info(`Updated memory ${memoryId} for user ${userId}`);
            } else {
                logger.warn(`Failed to update memory ${memoryId} for user ${userId}`);
            }

            return success;
        } catch (error) {
            logger.error('Error updating memory:', error);
            throw error;
        }
    }

    /**
     * Delete a memory
     * @param {string} memoryId - Memory identifier
     * @param {string} userId - User identifier
     * @returns {Promise<boolean>}
     */
    async deleteMemory(memoryId, userId) {
        try {
            const success = await this.storageProvider.deleteMemory(memoryId, userId);

            if (success) {
                logger.info(`Deleted memory ${memoryId} for user ${userId}`);
            } else {
                logger.warn(`Failed to delete memory ${memoryId} for user ${userId}`);
            }

            return success;
        } catch (error) {
            logger.error('Error deleting memory:', error);
            throw error;
        }
    }

    /**
     * Get server health information
     * @returns {Promise<object>}
     */
    async getHealthInfo() {
        try {
            const health = {
                status: 'healthy',
                timestamp: new Date().toISOString(),
                storage: {
                    provider: this.storageProvider.constructor.name,
                    initialized: this.storageProvider.initialized || true
                },
                mem0: {
                    enabled: !!this.mem0Client,
                    status: this.mem0Client ? 'connected' : 'disabled'
                }
            };

            return health;
        } catch (error) {
            logger.error('Error getting health info:', error);
            return {
                status: 'unhealthy',
                timestamp: new Date().toISOString(),
                error: error.message
            };
        }
    }

    /**
     * Get server information
     * @returns {Promise<object>}
     */
    async getServerInfo() {
        try {
            return {
                name: 'mem0-mcp-server-nodejs',
                version: '0.1.0',
                description: 'MCP server for long term memory storage and retrieval with Mem0 - Node.js implementation',
                capabilities: {
                    tools: ['save_memory', 'get_all_memories', 'search_memories'],
                    transports: ['stdio', 'http'],
                    storage: this.storageProvider.constructor.name,
                    mem0: !!this.mem0Client
                },
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            logger.error('Error getting server info:', error);
            throw error;
        }
    }
}