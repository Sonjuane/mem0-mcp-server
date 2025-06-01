#!/usr/bin/env node

/**
 * Demo script to showcase the Mem0 MCP Server functionality
 * This script demonstrates the local storage capabilities
 */

import { LocalStorageProvider } from '../src/storage/local.js';
import { logger } from '../src/utils/logger.js';

async function runDemo() {
    console.log('🚀 Mem0 MCP Server Node.js Demo\n');

    // Initialize storage provider
    const provider = new LocalStorageProvider();
    await provider.initialize();

    const userId = 'demo-user';
    const memories = [
        'I prefer using Node.js for backend development because of its async nature',
        'My favorite programming language is JavaScript, especially with ES6+ features',
        'I work on AI and machine learning projects using Python and TensorFlow',
        'I enjoy building web applications with React and Express.js',
        'Docker is my go-to tool for containerizing applications'
    ];

    console.log('📝 Saving demo memories...');
    const memoryIds = [];

    for (const memory of memories) {
        const id = await provider.saveMemory(userId, memory, {
            source: 'demo',
            category: 'preferences'
        });
        memoryIds.push(id);
        console.log(`   ✅ Saved: "${memory.substring(0, 50)}..."`);
    }

    console.log('\n📚 Retrieving all memories...');
    const allMemories = await provider.getAllMemories(userId);
    console.log(`   Found ${allMemories.length} memories for user ${userId}`);

    console.log('\n🔍 Searching for Node.js related memories...');
    const searchResults = await provider.searchMemories('Node.js', userId, 3);
    console.log(`   Found ${searchResults.length} matching memories:`);

    searchResults.forEach((result, index) => {
        console.log(`   ${index + 1}. "${result.memory}"`);
    });

    console.log('\n✏️  Updating a memory...');
    const firstMemoryId = memoryIds[0];
    await provider.updateMemory(
        firstMemoryId,
        userId,
        'I prefer using Node.js for backend development because of its async nature and excellent npm ecosystem',
        { source: 'demo', category: 'preferences', updated: true }
    );
    console.log('   ✅ Memory updated successfully');

    console.log('\n🗑️  Deleting a memory...');
    const lastMemoryId = memoryIds[memoryIds.length - 1];
    await provider.deleteMemory(lastMemoryId, userId);
    console.log('   ✅ Memory deleted successfully');

    console.log('\n📊 Final memory count...');
    const finalMemories = await provider.getAllMemories(userId);
    console.log(`   Final count: ${finalMemories.length} memories`);

    console.log('\n🏁 Demo completed successfully!');
    console.log(`\n💾 Memory files are stored in: ${provider.baseDir}/users/${userId}/`);
    console.log(`📁 You can inspect the JSON files to see the stored data structure.`);

    await provider.cleanup();
}

// Run the demo
runDemo().catch(error => {
    console.error('❌ Demo failed:', error);
    process.exit(1);
});