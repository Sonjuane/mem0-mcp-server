import { test } from 'node:test';
import assert from 'node:assert';
import { spawn } from 'node:child_process';
import { setTimeout } from 'node:timers/promises';

test('SSE Transport Integration Test', async (t) => {
    let serverProcess;

    try {
        // Start server with SSE transport
        serverProcess = spawn('node', ['src/main.js'], {
            env: {
                ...process.env,
                TRANSPORT: 'sse',
                HTTP_SERVER_ENABLED: 'true',
                HTTP_SERVER_PORT: '8485',
                DEBUG: 'false'
            },
            stdio: ['pipe', 'pipe', 'pipe']
        });

        // Wait for server to start
        await setTimeout(2000);

        // Test SSE endpoint
        const response = await fetch('http://localhost:8485/sse', {
            headers: {
                'Accept': 'text/event-stream',
                'Cache-Control': 'no-cache'
            }
        });

        assert.strictEqual(response.status, 200);
        assert.strictEqual(response.headers.get('content-type'), 'text/event-stream');

        // Read the initial SSE data
        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        // Read first chunk (should contain endpoint event)
        const { value } = await reader.read();
        const data = decoder.decode(value);

        assert(data.includes('event: endpoint'), 'Should receive endpoint event');
        assert(data.includes('data: /message'), 'Should contain message endpoint');

        reader.releaseLock();
        response.body.cancel();

        console.log('✅ SSE Transport test passed');

    } catch (error) {
        console.error('❌ SSE Transport test failed:', error);
        throw error;
    } finally {
        if (serverProcess) {
            serverProcess.kill('SIGTERM');
            await setTimeout(1000);
        }
    }
});