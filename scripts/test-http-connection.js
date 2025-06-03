import http from 'http';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Configuration
const HTTP_PORT = process.env.HTTP_SERVER_PORT || 8484;
const HOST = process.env.HTTP_SERVER_HOST || 'localhost';

console.log('\n----- HTTP Server Connection Test -----');
console.log(`Testing connection to http://${HOST}:${HTTP_PORT}`);

// Test base endpoint
testEndpoint('/', 'Server root');

// Test SSE endpoint (critical for MCP connections)
testEndpoint('/sse', 'SSE endpoint');

function testEndpoint(path, description) {
    const options = {
        hostname: HOST,
        port: HTTP_PORT,
        path: path,
        method: 'GET',
        timeout: 3000 // 3 second timeout
    };

    console.log(`\nTesting ${description}: http://${HOST}:${HTTP_PORT}${path}`);

    const req = http.request(options, (res) => {
        console.log(`Status: ${res.statusCode}`);
        console.log(`Headers: ${JSON.stringify(res.headers)}`);

        res.on('data', (chunk) => {
            console.log(`Response preview: ${chunk.toString().substring(0, 100)}...`);
        });
    });

    req.on('error', (error) => {
        console.error(`Error: ${error.message}`);
        if (error.code === 'ECONNREFUSED') {
            console.error(`No server running at http://${HOST}:${HTTP_PORT}`);
            console.error('Please ensure the server is running and listening on this port');
        }
    });

    req.on('timeout', () => {
        console.error('Request timed out');
        req.destroy();
    });

    req.end();
}