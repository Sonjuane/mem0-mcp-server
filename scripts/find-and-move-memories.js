#!/usr/bin/env node

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function findMemoryDirectories() {
    const possibleLocations = [
        // Current server directory
        path.join(__dirname, '..', '.Mem0-Files'),
        // Parent directories
        path.join(__dirname, '..', '..', '.Mem0-Files'),
        path.join(__dirname, '..', '..', '..', '.Mem0-Files'),
        // User's home directory
        path.join(process.env.HOME, '.Mem0-Files'),
        // Common project locations
        '/Users/sonjuane/Dropbox/Projects/LAB-EX-AI/.Mem0-Files',
        '/Users/sonjuane/Dropbox/Projects/LAB-EX-AI/_MCPS/.Mem0-Files'
    ];

    console.log('🔍 Searching for existing memory directories...\n');

    const foundDirectories = [];

    for (const location of possibleLocations) {
        try {
            const stats = await fs.stat(location);
            if (stats.isDirectory()) {
                // Check if it contains memory files
                const usersDir = path.join(location, 'users');
                try {
                    const userStats = await fs.stat(usersDir);
                    if (userStats.isDirectory()) {
                        const users = await fs.readdir(usersDir);
                        if (users.length > 0) {
                            foundDirectories.push({
                                path: location,
                                userCount: users.length,
                                users: users
                            });
                        }
                    }
                } catch {
                    // No users directory, but directory exists
                    foundDirectories.push({
                        path: location,
                        userCount: 0,
                        users: []
                    });
                }
            }
        } catch {
            // Directory doesn't exist, skip
        }
    }

    return foundDirectories;
}

async function moveMemories(sourceDir, targetDir) {
    console.log(`📦 Moving memories from ${sourceDir} to ${targetDir}...`);

    try {
        // Create target directory if it doesn't exist
        await fs.mkdir(targetDir, { recursive: true });

        // Copy the entire directory structure
        await copyDirectory(sourceDir, targetDir);

        console.log('✅ Memories moved successfully!');
        console.log(`📁 New location: ${targetDir}`);

        // Ask if user wants to remove the old directory
        console.log('\n⚠️  You can now safely remove the old directory:');
        console.log(`   rm -rf "${sourceDir}"`);

    } catch (error) {
        console.error('❌ Error moving memories:', error.message);
    }
}

async function copyDirectory(source, target) {
    const entries = await fs.readdir(source, { withFileTypes: true });

    await fs.mkdir(target, { recursive: true });

    for (const entry of entries) {
        const sourcePath = path.join(source, entry.name);
        const targetPath = path.join(target, entry.name);

        if (entry.isDirectory()) {
            await copyDirectory(sourcePath, targetPath);
        } else {
            await fs.copyFile(sourcePath, targetPath);
        }
    }
}

async function main() {
    console.log('🧠 Mem0 Memory Directory Finder and Mover\n');

    const foundDirectories = await findMemoryDirectories();

    if (foundDirectories.length === 0) {
        console.log('❌ No memory directories found.');
        console.log('💡 This might mean:');
        console.log('   - No memories have been saved yet');
        console.log('   - Memories are stored in a custom location');
        console.log('   - The MCP server is not configured correctly');
        return;
    }

    console.log('📍 Found memory directories:\n');
    foundDirectories.forEach((dir, index) => {
        console.log(`${index + 1}. ${dir.path}`);
        console.log(`   Users: ${dir.userCount} (${dir.users.join(', ')})`);
        console.log('');
    });

    // For this script, we'll assume the target is the LAB-EX-AI root
    const targetDir = '/Users/sonjuane/Dropbox/Projects/LAB-EX-AI/.Mem0-Files';

    // Check if target already exists
    try {
        await fs.stat(targetDir);
        console.log(`✅ Target directory already exists: ${targetDir}`);
        console.log('💡 Memories are already in the correct location!');
        return;
    } catch {
        // Target doesn't exist, we can move
    }

    // Find the most likely source directory (the one with the most users)
    const sourceDir = foundDirectories.reduce((prev, current) =>
        (current.userCount > prev.userCount) ? current : prev
    );

    if (sourceDir.userCount > 0) {
        console.log(`🎯 Moving memories from: ${sourceDir.path}`);
        console.log(`🎯 Moving memories to: ${targetDir}`);
        console.log('');

        await moveMemories(sourceDir.path, targetDir);
    } else {
        console.log('💡 No user data found in memory directories.');
        console.log('   This is normal if no memories have been saved yet.');
    }
}

main().catch(console.error);