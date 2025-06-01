import { test } from 'node:test';
import assert from 'node:assert';
import { promises as fs } from 'fs';
import path from 'path';
import { LocalStorageProvider } from '../src/storage/local.js';

test('Local Storage Provider - Basic Functionality', async (t) => {
    const testDir = '.test-memories';
    process.env.LOCAL_STORAGE_DIR = testDir;

    const provider = new LocalStorageProvider();

    await t.test('should initialize correctly', async () => {
        await provider.initialize();
        assert.ok(provider.initialized, 'Provider should be initialized');

        // Check if directories were created
        const usersDir = path.join(testDir, 'users');
        const indexDir = path.join(testDir, 'index');

        await assert.doesNotReject(fs.access(usersDir), 'Users directory should exist');
        await assert.doesNotReject(fs.access(indexDir), 'Index directory should exist');
    });

    await t.test('should save memory correctly', async () => {
        const userId = 'test-user';
        const memory = 'This is a test memory about Node.js development';
        const metadata = { source: 'test' };

        const memoryId = await provider.saveMemory(userId, memory, metadata);

        assert.ok(memoryId, 'Memory ID should be returned');
        assert.match(memoryId, /^[0-9a-f-]{36}$/, 'Memory ID should be a UUID');

        // Check if file was created
        const filePath = path.join(testDir, 'users', userId, `${memoryId}.json`);
        await assert.doesNotReject(fs.access(filePath), 'Memory file should exist');

        // Check file content
        const content = await fs.readFile(filePath, 'utf8');
        const memoryData = JSON.parse(content);

        assert.strictEqual(memoryData.id, memoryId);
        assert.strictEqual(memoryData.userId, userId);
        assert.strictEqual(memoryData.memory, memory);
        assert.strictEqual(memoryData.metadata.source, 'test');
        assert.ok(memoryData.metadata.createdAt);
        assert.ok(memoryData.metadata.updatedAt);
    });

    await t.test('should retrieve all memories', async () => {
        const userId = 'test-user';

        const memories = await provider.getAllMemories(userId);

        assert.ok(Array.isArray(memories), 'Should return an array');
        assert.ok(memories.length > 0, 'Should have at least one memory');

        const memory = memories[0];
        assert.ok(memory.id, 'Memory should have an ID');
        assert.ok(memory.memory, 'Memory should have content');
        assert.ok(memory.metadata, 'Memory should have metadata');
    });

    await t.test('should search memories', async () => {
        const userId = 'test-user';
        const query = 'Node.js';

        const results = await provider.searchMemories(query, userId, 5);

        assert.ok(Array.isArray(results), 'Should return an array');
        assert.ok(results.length > 0, 'Should find matching memories');

        const result = results[0];
        assert.ok(result.memory.toLowerCase().includes(query.toLowerCase()), 'Result should contain query term');
    });

    await t.test('should update memory', async () => {
        const userId = 'test-user';
        const memories = await provider.getAllMemories(userId);
        const memoryId = memories[0].id;

        const updatedMemory = 'This is an updated test memory about Node.js and MCP development';
        const updatedMetadata = { source: 'test-updated' };

        const success = await provider.updateMemory(memoryId, userId, updatedMemory, updatedMetadata);

        assert.ok(success, 'Update should succeed');

        // Verify the update
        const updatedMemories = await provider.getAllMemories(userId);
        const updated = updatedMemories.find(m => m.id === memoryId);

        assert.strictEqual(updated.memory, updatedMemory);
        assert.strictEqual(updated.metadata.source, 'test-updated');
        assert.notStrictEqual(updated.metadata.createdAt, updated.metadata.updatedAt);
    });

    await t.test('should delete memory', async () => {
        const userId = 'test-user';
        const memories = await provider.getAllMemories(userId);
        const memoryId = memories[0].id;

        const success = await provider.deleteMemory(memoryId, userId);

        assert.ok(success, 'Delete should succeed');

        // Verify deletion
        const remainingMemories = await provider.getAllMemories(userId);
        const deleted = remainingMemories.find(m => m.id === memoryId);

        assert.strictEqual(deleted, undefined, 'Memory should be deleted');
    });

    // Cleanup
    await t.test('cleanup test directory', async () => {
        await provider.cleanup();

        try {
            await fs.rm(testDir, { recursive: true, force: true });
        } catch (error) {
            // Ignore cleanup errors
        }
    });
});