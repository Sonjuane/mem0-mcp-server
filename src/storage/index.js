import { LocalStorageProvider, StorageProvider } from './local.js';
import { PostgreSQLStorageProvider } from './postgresql.js';
import { logger } from '../utils/logger.js';

// Re-export the base class
export { StorageProvider };

/**
 * Factory function to create storage providers
 * @param {string} providerType - Type of storage provider ('local' or 'postgresql')
 * @returns {Promise<StorageProvider>} Initialized storage provider
 */
export async function createStorageProvider(providerType) {
    let provider;

    switch (providerType.toLowerCase()) {
        case 'local':
            provider = new LocalStorageProvider();
            break;
        case 'postgresql':
            provider = new PostgreSQLStorageProvider();
            break;
        default:
            throw new Error(`Unknown storage provider: ${providerType}`);
    }

    await provider.initialize();
    logger.info(`Created and initialized ${providerType} storage provider`);

    return provider;
}