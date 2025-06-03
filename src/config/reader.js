import { promises as fs, readdirSync } from 'fs';
import path from 'path';
import { logger } from '../utils/logger.js';

/**
 * Configuration reader for MCP client-provided settings
 */
export class ConfigReader {
    constructor() {
        this.configPaths = this._getVSCodeProjectConfigPaths();
    }

    /**
     * Get potential mcp.json file paths in VS Code project
     * @returns {string[]} Array of potential config file paths
     */
    _getVSCodeProjectConfigPaths() {
        const paths = [];

        // Method 1: Search for .roo directories broadly (highest priority)
        const rooDirectories = this._findRooDirectories();
        for (const rooDir of rooDirectories) {
            paths.push(path.join(rooDir, 'mcp.json'));
            logger.debug(`Added .roo config path: ${rooDir}/mcp.json`);
        }

        // Method 2: Check for explicit PROJECT_DIR environment variable
        if (process.env.PROJECT_DIR) {
            paths.push(path.join(process.env.PROJECT_DIR, '.roo', 'mcp.json'));
            paths.push(path.join(process.env.PROJECT_DIR, 'mcp.json'));
            logger.debug(`Added PROJECT_DIR config paths: ${process.env.PROJECT_DIR}/.roo/mcp.json and ${process.env.PROJECT_DIR}/mcp.json`);
        }

        // Method 3: Check for VSCode workspace environment variables
        if (process.env.VSCODE_WORKSPACE_FOLDER) {
            paths.push(path.join(process.env.VSCODE_WORKSPACE_FOLDER, '.roo', 'mcp.json'));
            paths.push(path.join(process.env.VSCODE_WORKSPACE_FOLDER, 'mcp.json'));
            logger.debug(`Added VSCODE_WORKSPACE_FOLDER config paths: ${process.env.VSCODE_WORKSPACE_FOLDER}/.roo/mcp.json and ${process.env.VSCODE_WORKSPACE_FOLDER}/mcp.json`);
        }

        if (process.env.VSCODE_CWD) {
            paths.push(path.join(process.env.VSCODE_CWD, '.roo', 'mcp.json'));
            paths.push(path.join(process.env.VSCODE_CWD, 'mcp.json'));
            logger.debug(`Added VSCODE_CWD config paths: ${process.env.VSCODE_CWD}/.roo/mcp.json and ${process.env.VSCODE_CWD}/mcp.json`);
        }

        // Method 4: Check for PWD environment variable (common in Unix shells)
        if (process.env.PWD && process.env.PWD !== process.cwd()) {
            paths.push(path.join(process.env.PWD, '.roo', 'mcp.json'));
            paths.push(path.join(process.env.PWD, 'mcp.json'));
            logger.debug(`Added PWD config paths: ${process.env.PWD}/.roo/mcp.json and ${process.env.PWD}/mcp.json`);
        }

        // Method 5: Check for INIT_CWD (npm/yarn sets this to the directory where npm was invoked)
        if (process.env.INIT_CWD && process.env.INIT_CWD !== process.cwd()) {
            paths.push(path.join(process.env.INIT_CWD, '.roo', 'mcp.json'));
            paths.push(path.join(process.env.INIT_CWD, 'mcp.json'));
            logger.debug(`Added INIT_CWD config paths: ${process.env.INIT_CWD}/.roo/mcp.json and ${process.env.INIT_CWD}/mcp.json`);
        }

        // Method 6: Look for VS Code workspace indicators in parent directories
        const workspaceDir = this._detectVSCodeWorkspace();
        if (workspaceDir) {
            paths.push(path.join(workspaceDir, '.roo', 'mcp.json'));
            paths.push(path.join(workspaceDir, 'mcp.json'));
            logger.debug(`Added detected workspace config paths: ${workspaceDir}/.roo/mcp.json and ${workspaceDir}/mcp.json`);
        }

        // Method 7: Fallback to current working directory
        paths.push(path.join(process.cwd(), '.roo', 'mcp.json'));
        paths.push(path.join(process.cwd(), 'mcp.json'));

        // Method 8: Custom MCP_CONFIG_PATH if specified
        if (process.env.MCP_CONFIG_PATH) {
            paths.push(process.env.MCP_CONFIG_PATH);
        }

        // Remove duplicates while preserving order
        return [...new Set(paths)];
    }

    /**
     * Find all .roo directories in the project tree
     * @returns {string[]} Array of .roo directory paths
     */
    _findRooDirectories() {
        const rooDirectories = [];
        const searchPaths = [
            '/Users/sonjuane/Dropbox/Projects',
            '/Users/sonjuane/Dropbox/Projects/LAB-EX-AI',
            '/Users/sonjuane/Dropbox/Projects/WEB-COMPONENTS'
        ];

        for (const searchPath of searchPaths) {
            try {
                this._searchForRooDirectories(searchPath, rooDirectories, 3); // Max 3 levels deep
            } catch (error) {
                logger.debug(`Error searching ${searchPath}: ${error.message}`);
            }
        }

        return rooDirectories;
    }

    /**
     * Recursively search for .roo directories
     * @param {string} dir - Directory to search
     * @param {string[]} results - Array to store results
     * @param {number} maxDepth - Maximum search depth
     */
    _searchForRooDirectories(dir, results, maxDepth) {
        if (maxDepth <= 0) return;

        try {
            const entries = readdirSync(dir, { withFileTypes: true });

            for (const entry of entries) {
                if (entry.isDirectory()) {
                    const fullPath = path.join(dir, entry.name);

                    if (entry.name === '.roo') {
                        results.push(fullPath);
                        logger.debug(`Found .roo directory: ${fullPath}`);
                    } else if (!entry.name.startsWith('.') && !entry.name.includes('node_modules')) {
                        // Recursively search subdirectories (excluding hidden dirs and node_modules)
                        this._searchForRooDirectories(fullPath, results, maxDepth - 1);
                    }
                }
            }
        } catch (error) {
            // Ignore permission errors and continue
            logger.debug(`Cannot read directory ${dir}: ${error.message}`);
        }
    }

    /**
     * Detect VS Code workspace directory by looking for .vscode or .roo folders
     * @returns {string|null} Workspace directory path or null
     */
    _detectVSCodeWorkspace() {
        let currentDir = process.cwd();
        const maxLevels = 8; // Increased search depth
        const workspaceCandidates = [];

        for (let i = 0; i < maxLevels; i++) {
            const parentDir = path.dirname(currentDir);
            if (parentDir === currentDir) break; // Reached root

            // Stop if we reach the user's home directory
            if (parentDir === process.env.HOME || parentDir.endsWith('/Users/' + process.env.USER)) {
                break;
            }

            try {
                const files = readdirSync(parentDir);

                // Check for .vscode directory (highest priority)
                if (files.includes('.vscode')) {
                    workspaceCandidates.push({
                        path: parentDir,
                        priority: 1,
                        type: '.vscode',
                        level: i
                    });
                }

                // Check for .roo directory (second priority)
                if (files.includes('.roo')) {
                    workspaceCandidates.push({
                        path: parentDir,
                        priority: 2,
                        type: '.roo',
                        level: i
                    });
                }
            } catch (error) {
                // Ignore errors reading directory
                logger.debug(`Error reading directory ${parentDir}: ${error.message}`);
            }

            currentDir = parentDir;
        }

        // Sort candidates by priority (lower number = higher priority), then by level (closer = better)
        workspaceCandidates.sort((a, b) => {
            if (a.priority !== b.priority) {
                return a.priority - b.priority;
            }
            return a.level - b.level;
        });

        if (workspaceCandidates.length > 0) {
            const selected = workspaceCandidates[0];
            logger.info(`Found workspace at: ${selected.path} (${selected.type})`);
            return selected.path;
        }

        return null;
    }

    /**
     * Find and read MCP configuration file
     * @returns {Promise<object|null>} Configuration object or null if not found
     */
    async readConfig() {
        for (const configPath of this.configPaths) {
            try {
                const fullPath = path.resolve(configPath);
                await fs.access(fullPath);

                const content = await fs.readFile(fullPath, 'utf8');
                const config = JSON.parse(content);

                logger.info(`Found MCP configuration at: ${fullPath}`);
                return this.extractMcpServerConfig(config);
            } catch (error) {
                // Continue to next path if file doesn't exist or can't be read
                logger.debug(`Config file not found at ${configPath}: ${error.message}`);
            }
        }

        logger.debug('No MCP configuration file found');
        return null;
    }

    /**
     * Extract MCP server configuration from client config
     * @param {object} clientConfig - Full MCP client configuration
     * @returns {object|null} Extracted server configuration
     */
    extractMcpServerConfig(clientConfig) {
        // Look for mem0 server configurations in mcpServers
        if (!clientConfig.mcpServers) {
            logger.warn('No mcpServers section found in configuration');
            return null;
        }

        // Log all available MCP servers for debugging
        logger.info('Available MCP servers in configuration:', Object.keys(clientConfig.mcpServers));

        // Find mem0-related server configurations
        const mem0Servers = Object.entries(clientConfig.mcpServers)
            .filter(([name, config]) =>
                name.includes('mem0') ||
                config.description?.toLowerCase().includes('mem0') ||
                config.url?.includes('mem0')
            );

        if (mem0Servers.length === 0) {
            logger.warn('No mem0 server configuration found');
            return null;
        }

        // Log all matched mem0 servers for debugging
        logger.info('Matched mem0 servers:', mem0Servers.map(([name]) => name));

        // Use the first mem0 server configuration found
        const [serverName, serverConfig] = mem0Servers[0];
        logger.info(`Using configuration from server: ${serverName}`);

        // Apply environment variable overrides from the 'env' key
        if (serverConfig.env) {
            logger.info('Applying environment variable overrides from MCP configuration');
            for (const [key, value] of Object.entries(serverConfig.env)) {
                const oldValue = process.env[key];
                process.env[key] = value;
                logger.debug(`Environment override: ${key}=${value}${oldValue ? ` (was: ${oldValue})` : ''}`);
            }
        }

        // Extract storage configuration
        const extractedConfig = {};

        // Store the server name so the MCP server can use it
        extractedConfig.mcpServerName = serverName;
        logger.info(`Using MCP server name from config: ${serverName}`);

        if (serverConfig.storage_provider) {
            extractedConfig.storageProvider = serverConfig.storage_provider;
            logger.info(`Found storage provider: ${serverConfig.storage_provider}`);
        }

        if (serverConfig.storage_directory) {
            extractedConfig.storageDirectory = serverConfig.storage_directory;
            logger.info(`Found storage directory: ${serverConfig.storage_directory}`);
        }

        // Extract other potential configurations
        if (serverConfig.default_user_id) {
            extractedConfig.defaultUserId = serverConfig.default_user_id;
        }

        if (serverConfig.max_search_results) {
            extractedConfig.maxSearchResults = serverConfig.max_search_results;
        }

        // Extract HTTP configuration
        if (serverConfig.env?.HTTP_SERVER_ENABLED) {
            logger.info('HTTP server enabled in configuration');
            extractedConfig.httpServerEnabled = serverConfig.env.HTTP_SERVER_ENABLED === 'true';
        }

        return Object.keys(extractedConfig).length > 0 ? extractedConfig : null;
    }

    /**
     * Validate storage directory configuration
     * @param {string} storageDir - Storage directory path
     * @returns {Promise<boolean>} True if valid and accessible
     */
    async validateStorageDirectory(storageDir) {
        try {
            const resolvedPath = path.resolve(storageDir);

            // Try to create the directory if it doesn't exist
            await fs.mkdir(resolvedPath, { recursive: true });

            // Test write access
            const testFile = path.join(resolvedPath, '.write-test');
            await fs.writeFile(testFile, 'test');
            await fs.unlink(testFile);

            logger.info(`Storage directory validated: ${resolvedPath}`);
            return true;
        } catch (error) {
            logger.error(`Storage directory validation failed for ${storageDir}: ${error.message}`);
            return false;
        }
    }
}

/**
 * Load and merge MCP configuration with environment variables
 * @returns {Promise<object>} Merged configuration
 */
export async function loadMcpConfig() {
    const reader = new ConfigReader();
    const mcpConfig = await reader.readConfig();

    // Base configuration from environment variables
    const baseConfig = {
        transport: process.env.TRANSPORT || 'sse',
        host: process.env.HOST || '0.0.0.0',
        port: parseInt(process.env.PORT) || 8484,
        storageProvider: process.env.STORAGE_PROVIDER || 'local',
        defaultUserId: process.env.DEFAULT_USER_ID || 'user',
        debug: process.env.DEBUG === 'true',
        httpServerEnabled: process.env.HTTP_SERVER_ENABLED === 'true',
        httpServerPort: parseInt(process.env.HTTP_SERVER_PORT) || parseInt(process.env.PORT) || 8484,
        httpServerHost: process.env.HTTP_SERVER_HOST || process.env.HOST || '0.0.0.0',
        apiToken: process.env.API_TOKEN
    };

    // Merge MCP configuration (takes precedence over environment variables)
    if (mcpConfig) {
        logger.info('Merging MCP configuration with environment variables');

        // Validate storage directory if provided
        if (mcpConfig.storageDirectory) {
            const isValid = await reader.validateStorageDirectory(mcpConfig.storageDirectory);
            if (!isValid) {
                logger.warn('Invalid storage directory in MCP config, falling back to environment/default');
                delete mcpConfig.storageDirectory;
            }
        }

        return { ...baseConfig, ...mcpConfig };
    }

    return baseConfig;
}