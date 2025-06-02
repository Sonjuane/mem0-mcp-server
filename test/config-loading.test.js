import { promises as fs } from 'fs';
import path from 'path';
import { ConfigReader, loadMcpConfig } from '../src/config/reader.js';

/**
 * Test configuration loading functionality
 */
async function testConfigLoading() {
    console.log('Testing MCP configuration loading...\n');

    // Test 1: Create a test mcp.json file
    const testConfig = {
        mcpServers: {
            "mem0-test": {
                transport: "sse",
                url: "http://localhost:8484/sse",
                description: "Test Mem0 MCP Server",
                storage_provider: "local",
                storage_directory: "/tmp/test-mem0-storage",
                default_user_id: "test-user"
            }
        }
    };

    const testConfigPath = path.join(process.cwd(), 'mcp.json');

    try {
        // Write test config
        await fs.writeFile(testConfigPath, JSON.stringify(testConfig, null, 2));
        console.log('✓ Created test mcp.json file');

        // Test ConfigReader
        const reader = new ConfigReader();
        const mcpConfig = await reader.readConfig();

        if (mcpConfig) {
            console.log('✓ Successfully read MCP configuration');
            console.log('  Storage Provider:', mcpConfig.storageProvider);
            console.log('  Storage Directory:', mcpConfig.storageDirectory);
            console.log('  Default User ID:', mcpConfig.defaultUserId);
        } else {
            console.log('✗ Failed to read MCP configuration');
        }

        // Test loadMcpConfig function
        const fullConfig = await loadMcpConfig();
        console.log('\n✓ Successfully loaded full configuration');
        console.log('  Transport:', fullConfig.transport);
        console.log('  Storage Provider:', fullConfig.storageProvider);
        console.log('  Storage Directory:', fullConfig.storageDirectory);
        console.log('  Default User ID:', fullConfig.defaultUserId);

        // Test storage directory validation
        if (mcpConfig && mcpConfig.storageDirectory) {
            const isValid = await reader.validateStorageDirectory(mcpConfig.storageDirectory);
            console.log(`\n✓ Storage directory validation: ${isValid ? 'PASSED' : 'FAILED'}`);
        }

    } catch (error) {
        console.error('✗ Test failed:', error.message);
    } finally {
        // Cleanup test file
        try {
            await fs.unlink(testConfigPath);
            console.log('\n✓ Cleaned up test files');
        } catch (error) {
            // Ignore cleanup errors
        }
    }
}

// Test 2: Test without mcp.json (fallback to environment variables)
async function testFallbackConfig() {
    console.log('\n\nTesting fallback configuration (no mcp.json)...\n');

    try {
        const config = await loadMcpConfig();
        console.log('✓ Successfully loaded fallback configuration');
        console.log('  Transport:', config.transport);
        console.log('  Storage Provider:', config.storageProvider);
        console.log('  Default User ID:', config.defaultUserId);
    } catch (error) {
        console.error('✗ Fallback test failed:', error.message);
    }
}

// Run tests
async function runTests() {
    await testConfigLoading();
    await testFallbackConfig();
    console.log('\n🎉 Configuration loading tests completed!');
}

if (import.meta.url === `file://${process.argv[1]}`) {
    runTests().catch(console.error);
}

export { testConfigLoading, testFallbackConfig };