import { promises as fs } from 'fs';
import { readdirSync } from 'fs';
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
    constructor(customStorageDirectory = null) {
        super();

        if (customStorageDirectory) {
            // When a custom storage directory is provided, add .Mem0-files subdirectory
            this.baseDir = path.join(customStorageDirectory, '.Mem0-files');
            logger.info(`Using custom storage directory: ${customStorageDirectory}`);
            logger.info(`Memory files will be stored in: ${this.baseDir}`);
        } else {
            this.baseDir = this._determineStorageDirectory();
        }

        this.initialized = false;
    }

    /**
     * Detect the client's working directory from various sources
     */
    _detectClientWorkingDirectory() {
        // Try multiple methods to detect client working directory

        // Method 1: Check for explicit PROJECT_DIR environment variable (highest priority)
        if (process.env.PROJECT_DIR) {
            logger.info(`Using explicit PROJECT_DIR: ${process.env.PROJECT_DIR}`);
            return process.env.PROJECT_DIR;
        }

        // Method 2: Check for VSCode workspace environment variables
        if (process.env.VSCODE_WORKSPACE_FOLDER) {
            logger.info(`Using VSCODE_WORKSPACE_FOLDER: ${process.env.VSCODE_WORKSPACE_FOLDER}`);
            return process.env.VSCODE_WORKSPACE_FOLDER;
        }

        if (process.env.VSCODE_CWD) {
            logger.info(`Using VSCODE_CWD: ${process.env.VSCODE_CWD}`);
            return process.env.VSCODE_CWD;
        }

        // Method 3: Check for PWD environment variable (common in Unix shells)
        if (process.env.PWD && process.env.PWD !== process.cwd()) {
            logger.info(`Using PWD: ${process.env.PWD}`);
            return process.env.PWD;
        }

        // Method 4: Check for INIT_CWD (npm/yarn sets this to the directory where npm was invoked)
        if (process.env.INIT_CWD && process.env.INIT_CWD !== process.cwd()) {
            logger.info(`Using INIT_CWD: ${process.env.INIT_CWD}`);
            return process.env.INIT_CWD;
        }

        // Method 5: Look for VSCode workspace indicators in parent directories
        // This helps when MCP server is in a subdirectory of the workspace
        let currentDir = process.cwd();
        const maxLevels = 5; // Limit search to avoid going too far up
        let workspaceCandidates = [];

        for (let i = 0; i < maxLevels; i++) {
            const parentDir = path.dirname(currentDir);
            if (parentDir === currentDir) break; // Reached root

            // Stop if we reach the user's home directory
            if (parentDir === process.env.HOME || parentDir.endsWith('/Users/' + process.env.USER)) {
                break;
            }

            try {
                const files = readdirSync(parentDir);

                // Check for VSCode workspace directory
                if (files.includes('.vscode')) {
                    try {
                        const vscodeFiles = readdirSync(path.join(parentDir, '.vscode'));
                        // If .vscode directory has actual VSCode files, this is a workspace candidate
                        if (vscodeFiles.length > 0) {
                            workspaceCandidates.push({
                                path: parentDir,
                                level: i,
                                hasVscode: true,
                                vscodeFileCount: vscodeFiles.length,
                                hasGit: files.includes('.git'),
                                hasPackageJson: files.includes('package.json'),
                                isProjectDir: files.some(f => ['package.json', '.git', 'pyproject.toml', 'Cargo.toml'].includes(f))
                            });
                        }
                    } catch {
                        // .vscode directory exists but can't read it, still a candidate
                        workspaceCandidates.push({
                            path: parentDir,
                            level: i,
                            hasVscode: true,
                            vscodeFileCount: 0,
                            hasGit: files.includes('.git'),
                            hasPackageJson: files.includes('package.json'),
                            isProjectDir: files.some(f => ['package.json', '.git', 'pyproject.toml', 'Cargo.toml'].includes(f))
                        });
                    }
                }

                // Check for other strong workspace indicators (only if no .vscode)
                const strongIndicators = ['.git', 'package.json', 'pyproject.toml', 'Cargo.toml'];
                const hasStrongIndicator = strongIndicators.some(indicator => files.includes(indicator));

                if (hasStrongIndicator && !files.includes('.vscode')) {
                    workspaceCandidates.push({
                        path: parentDir,
                        level: i,
                        hasVscode: false,
                        vscodeFileCount: 0,
                        hasGit: files.includes('.git'),
                        hasPackageJson: files.includes('package.json'),
                        isProjectDir: true
                    });
                }

            } catch (error) {
                // Ignore errors reading directory
            }

            currentDir = parentDir;
        }

        // Select the best workspace candidate
        if (workspaceCandidates.length > 0) {
            // Sort candidates by priority:
            // 1. Prefer directories that are actual projects (have project files)
            // 2. Among project directories, prefer ones with .vscode
            // 3. Prefer lower-level directories (closer to the MCP server)
            workspaceCandidates.sort((a, b) => {
                // First priority: actual project directories
                if (a.isProjectDir && !b.isProjectDir) return -1;
                if (!a.isProjectDir && b.isProjectDir) return 1;

                // Among project directories, prefer ones with .vscode
                if (a.isProjectDir && b.isProjectDir) {
                    if (a.hasVscode && !b.hasVscode) return -1;
                    if (!a.hasVscode && b.hasVscode) return 1;

                    // If both have .vscode, prefer lower level (closer to MCP server)
                    if (a.hasVscode && b.hasVscode) {
                        return a.level - b.level;
                    }
                }

                // Prefer directories with .git
                if (a.hasGit && !b.hasGit) return -1;
                if (!a.hasGit && b.hasGit) return 1;

                // Finally, prefer lower level directories
                return a.level - b.level;
            });

            return workspaceCandidates[0].path;
        }

        return null;
    }

    /**
     * Determine the storage directory based on client context
     */
    _determineStorageDirectory() {
        const defaultDir = process.env.LOCAL_STORAGE_DIR || '.Mem0-Files';

        // If LOCAL_STORAGE_DIR is an absolute path, use it as-is
        if (path.isAbsolute(defaultDir)) {
            return defaultDir;
        }

        // If LOCAL_STORAGE_DIR is explicitly set (not default), respect it for testing/custom configs
        if (process.env.LOCAL_STORAGE_DIR && process.env.LOCAL_STORAGE_DIR !== '.Mem0-Files') {
            return defaultDir;
        }

        // Only try client detection for the default directory name
        const clientWorkingDir = this._detectClientWorkingDirectory();

        if (clientWorkingDir) {
            // Use the detected client directory as the base for storage
            const storageDir = path.join(clientWorkingDir, defaultDir);
            logger.info(`Using client working directory for storage: ${clientWorkingDir}`);
            logger.info(`Memory files will be stored in: ${storageDir}`);
            return storageDir;
        }

        // Fallback to current working directory (original behavior)
        logger.warn('Could not detect client working directory, using server directory');
        return defaultDir;
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