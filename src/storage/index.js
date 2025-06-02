import { LocalStorageProvider, StorageProvider } from './local.js';
import { PostgreSQLStorageProvider } from './postgresql.js';
import { logger } from '../utils/logger.js';

// Re-export the base class
export { StorageProvider };

/**
 * Factory function to create storage providers
 * @param {string} providerType - Type of storage provider ('local' or 'postgresql')
 * @param {object} options - Configuration options for the storage provider
 * @returns {Promise<StorageProvider>} Initialized storage provider
 */
export async function createStorageProvider(providerType, options = {}) {
    let provider;

    switch (providerType.toLowerCase()) {
        case 'local':
            provider = new LocalStorageProvider(options.storageDirectory);
            break;
        case 'postgresql':
            provider = new PostgreSQLStorageProvider(options);
            break;
        default:
            throw new Error(`Unknown storage provider: ${providerType}`);
    }

    await provider.initialize();
    logger.info(`Created and initialized ${providerType} storage provider`);

    return provider;
}