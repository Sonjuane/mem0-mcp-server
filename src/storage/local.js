import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger.js';

/**
 * Abstract base class for storage providers
 */
export class StorageProvider {
    /**
     * Save a memory for a user
     * @param {string} userId - User identifier
     * @param {string} memory - Memory content
     * @param {object} metadata - Additional metadata
     * @returns {Promise<string>} Memory ID
     */
    async saveMemory(userId, memory, metadata = {}) {
        throw new Error('saveMemory must be implemented by subclass');
    }

    /**
     * Get all memories for a user
     * @param {string} userId - User identifier
     * @param {number} limit - Maximum number of memories to return
     * @returns {Promise<Array>} Array of memories
     */
    async getAllMemories(userId, limit = 50) {
        throw new Error('getAllMemories must be implemented by subclass');
    }

    /**
     * Search memories for a user
     * @param {string} query - Search query
     * @param {string} userId - User identifier
     * @param {number} limit - Maximum number of results
     * @returns {Promise<Array>} Array of matching memories
     */
    async searchMemories(query, userId, limit = 10) {
        throw new Error('searchMemories must be implemented by subclass');
    }

    /**
     * Delete a memory
     * @param {string} memoryId - Memory identifier
     * @param {string} userId - User identifier
     * @returns {Promise<boolean>} Success status
     */
    async deleteMemory(memoryId, userId) {
        throw new Error('deleteMemory must be implemented by subclass');
    }

    /**
     * Update a memory
     * @param {string} memoryId - Memory identifier
     * @param {string} userId - User identifier
     * @param {string} memory - Updated memory content
     * @param {object} metadata - Updated metadata
     * @returns {Promise<boolean>} Success status
     */
    async updateMemory(memoryId, userId, memory, metadata = {}) {
        throw new Error('updateMemory must be implemented by subclass');
    }

    /**
     * Initialize the storage provider
     * @returns {Promise<void>}
     */
    async initialize() {
        // Default implementation - can be overridden
    }

    /**
     * Cleanup resources
     * @returns {Promise<void>}
     */
    async cleanup() {
        // Default implementation - can be overridden
    }
}

/**
 * Local file storage provider for memories
 * Stores memories as JSON files in a local directory structure
 */
export class LocalStorageProvider extends StorageProvider {
    constructor() {
        super();
        this.baseDir = process.env.LOCAL_STORAGE_DIR || '.Mem0-Files';
        this.initialized = false;
    }

    async initialize() {
        try {
            // Create base directory if it doesn't exist
            await fs.mkdir(this.baseDir, { recursive: true });

            // Create users directory
            const usersDir = path.join(this.baseDir, 'users');
            await fs.mkdir(usersDir, { recursive: true });

            // Create index directory for search optimization
            const indexDir = path.join(this.baseDir, 'index');
            await fs.mkdir(indexDir, { recursive: true });

            this.initialized = true;
            logger.info(`Local storage initialized at: ${path.resolve(this.baseDir)}`);
        } catch (error) {
            logger.error('Failed to initialize local storage:', error);
            throw error;
        }
    }

    /**
     * Get the directory path for a specific user
     */
    getUserDir(userId) {
        return path.join(this.baseDir, 'users', userId);
    }

    /**
     * Get the file path for a specific memory
     */
    getMemoryFilePath(userId, memoryId) {
        return path.join(this.getUserDir(userId), `${memoryId}.json`);
    }

    /**
     * Ensure user directory exists
     */
    async ensureUserDir(userId) {
        const userDir = this.getUserDir(userId);
        await fs.mkdir(userDir, { recursive: true });
        return userDir;
    }

    async saveMemory(userId, memory, metadata = {}) {
        if (!this.initialized) {
            throw new Error('Storage provider not initialized');
        }

        try {
            const memoryId = uuidv4();
            const timestamp = new Date().toISOString();

            await this.ensureUserDir(userId);

            const memoryData = {
                id: memoryId,
                userId,
                memory,
                metadata: {
                    ...metadata,
                    createdAt: timestamp,
                    updatedAt: timestamp
                }
            };

            const filePath = this.getMemoryFilePath(userId, memoryId);
            await fs.writeFile(filePath, JSON.stringify(memoryData, null, 2), 'utf8');

            // Update user index
            await this.updateUserIndex(userId, memoryId, memory, timestamp);

            logger.debug(`Saved memory ${memoryId} for user ${userId} to ${filePath}`);
            return memoryId;
        } catch (error) {
            logger.error('Error saving memory to local storage:', error);
            throw error;
        }
    }

    async getAllMemories(userId, limit = 50) {
        if (!this.initialized) {
            throw new Error('Storage provider not initialized');
        }

        try {
            const userDir = this.getUserDir(userId);

            // Check if user directory exists
            try {
                await fs.access(userDir);
            } catch {
                // User directory doesn't exist, return empty array
                return [];
            }

            const files = await fs.readdir(userDir);
            const memoryFiles = files.filter(file => file.endsWith('.json'));

            const memories = [];
            for (const file of memoryFiles.slice(0, limit)) {
                try {
                    const filePath = path.join(userDir, file);
                    const content = await fs.readFile(filePath, 'utf8');
                    const memoryData = JSON.parse(content);
                    memories.push(memoryData);
                } catch (error) {
                    logger.warn(`Failed to read memory file ${file}:`, error);
                }
            }

            // Sort by creation date (newest first)
            memories.sort((a, b) =>
                new Date(b.metadata.createdAt) - new Date(a.metadata.createdAt)
            );

            logger.debug(`Retrieved ${memories.length} memories for user ${userId}`);
            return memories;
        } catch (error) {
            logger.error('Error retrieving memories from local storage:', error);
            throw error;
        }
    }

    async searchMemories(query, userId, limit = 10) {
        if (!this.initialized) {
            throw new Error('Storage provider not initialized');
        }

        try {
            // For now, implement simple text-based search
            // This can be enhanced with better search algorithms later
            const allMemories = await this.getAllMemories(userId, 1000); // Get more for searching

            const queryLower = query.toLowerCase();
            const matchingMemories = allMemories.filter(memory => {
                const memoryText = memory.memory.toLowerCase();
                const originalText = memory.metadata.originalText?.toLowerCase() || '';

                return memoryText.includes(queryLower) || originalText.includes(queryLower);
            });

            // Simple relevance scoring based on query term frequency
            const scoredMemories = matchingMemories.map(memory => {
                const memoryText = memory.memory.toLowerCase();
                const originalText = memory.metadata.originalText?.toLowerCase() || '';
                const combinedText = `${memoryText} ${originalText}`;

                const matches = (combinedText.match(new RegExp(queryLower, 'g')) || []).length;
                return {
                    ...memory,
                    relevanceScore: matches
                };
            });

            // Sort by relevance score (highest first), then by date
            scoredMemories.sort((a, b) => {
                if (a.relevanceScore !== b.relevanceScore) {
                    return b.relevanceScore - a.relevanceScore;
                }
                return new Date(b.metadata.createdAt) - new Date(a.metadata.createdAt);
            });

            const results = scoredMemories.slice(0, limit);
            logger.debug(`Found ${results.length} matching memories for query "${query}" (user: ${userId})`);

            return results;
        } catch (error) {
            logger.error('Error searching memories in local storage:', error);
            throw error;
        }
    }

    async deleteMemory(memoryId, userId) {
        if (!this.initialized) {
            throw new Error('Storage provider not initialized');
        }

        try {
            const filePath = this.getMemoryFilePath(userId, memoryId);

            // Check if file exists
            try {
                await fs.access(filePath);
            } catch {
                logger.warn(`Memory ${memoryId} not found for user ${userId}`);
                return false;
            }

            await fs.unlink(filePath);

            // Update user index
            await this.removeFromUserIndex(userId, memoryId);

            logger.debug(`Deleted memory ${memoryId} for user ${userId}`);
            return true;
        } catch (error) {
            logger.error('Error deleting memory from local storage:', error);
            throw error;
        }
    }

    async updateMemory(memoryId, userId, memory, metadata = {}) {
        if (!this.initialized) {
            throw new Error('Storage provider not initialized');
        }

        try {
            const filePath = this.getMemoryFilePath(userId, memoryId);

            // Read existing memory
            let existingMemory;
            try {
                const content = await fs.readFile(filePath, 'utf8');
                existingMemory = JSON.parse(content);
            } catch {
                logger.warn(`Memory ${memoryId} not found for user ${userId}`);
                return false;
            }

            // Update memory data
            const updatedMemory = {
                ...existingMemory,
                memory,
                metadata: {
                    ...existingMemory.metadata,
                    ...metadata,
                    updatedAt: new Date().toISOString()
                }
            };

            await fs.writeFile(filePath, JSON.stringify(updatedMemory, null, 2), 'utf8');

            // Update user index
            await this.updateUserIndex(userId, memoryId, memory, updatedMemory.metadata.updatedAt);

            logger.debug(`Updated memory ${memoryId} for user ${userId}`);
            return true;
        } catch (error) {
            logger.error('Error updating memory in local storage:', error);
            throw error;
        }
    }

    /**
     * Update user index for search optimization
     */
    async updateUserIndex(userId, memoryId, memory, timestamp) {
        try {
            const indexPath = path.join(this.baseDir, 'index', `${userId}.json`);

            let index = {};
            try {
                const content = await fs.readFile(indexPath, 'utf8');
                index = JSON.parse(content);
            } catch {
                // Index doesn't exist, create new one
                index = { memories: {} };
            }

            index.memories[memoryId] = {
                preview: memory.substring(0, 100),
                timestamp,
                wordCount: memory.split(/\s+/).length
            };

            await fs.writeFile(indexPath, JSON.stringify(index, null, 2), 'utf8');
        } catch (error) {
            logger.warn('Failed to update user index:', error);
            // Don't throw error as this is not critical
        }
    }

    /**
     * Remove memory from user index
     */
    async removeFromUserIndex(userId, memoryId) {
        try {
            const indexPath = path.join(this.baseDir, 'index', `${userId}.json`);

            let index = {};
            try {
                const content = await fs.readFile(indexPath, 'utf8');
                index = JSON.parse(content);
            } catch {
                return; // Index doesn't exist
            }

            if (index.memories && index.memories[memoryId]) {
                delete index.memories[memoryId];
                await fs.writeFile(indexPath, JSON.stringify(index, null, 2), 'utf8');
            }
        } catch (error) {
            logger.warn('Failed to update user index:', error);
            // Don't throw error as this is not critical
        }
    }

    async cleanup() {
        // No specific cleanup needed for local storage
        this.initialized = false;
        logger.info('Local storage provider cleaned up');
    }
}