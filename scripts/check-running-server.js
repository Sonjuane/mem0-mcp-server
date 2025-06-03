import fetch from 'node-fetch';

// Configuration
const HTTP_PORT = process.env.HTTP_SERVER_PORT || 8484;
const HOST = 'localhost';

async function checkServer() {
    console.log('\n----- Checking Running MCP Server -----');

    try {
        // Check root endpoint for server info
        console.log(`Fetching server info from http://${HOST}:${HTTP_PORT}/`);
        const rootResponse = await fetch(`http://${HOST}:${HTTP_PORT}/`);
        const rootData = await rootResponse.json();

        console.log('\nServer Information:');
        console.log(JSON.stringify(rootData.data, null, 2));

        // Try to establish SSE connection to verify MCP functionality
        console.log('\nChecking SSE endpoint availability...');
        const sseResponse = await fetch(`http://${HOST}:${HTTP_PORT}/sse`, {
            method: 'GET',
            headers: {
                'Accept': 'text/event-stream',
                'Authorization': `Bearer ${process.env.API_TOKEN || 'your-secure-api-token-here'}`
            }
        });

        console.log(`SSE Endpoint Status: ${sseResponse.status} ${sseResponse.statusText}`);
        if (sseResponse.status === 200) {
            console.log('SSE endpoint is available and responding correctly');
            console.log('This confirms the server is running and accepting MCP connections');
        } else {
            console.log('SSE endpoint returned unexpected status code');
        }

        console.log('\nRecommendation:');
        console.log('1. If using VSCode with Roo or another client that supports MCP:');
        console.log('   - Make sure your client is configured to connect to this server');
        console.log('   - Check that the server name in client config matches "mem0-http"');
        console.log('   - Verify the URL in client config is http://localhost:8484/sse');
        console.log('   - Ensure API tokens match between client and server');
        console.log('\n2. The error "No connection found for server: mem0-http" usually means:');
        console.log('   - The client is looking for a server named "mem0-http" but cannot find it');
        console.log('   - The server is running but registering under a different name');
        console.log('   - Or the client config is pointing to a different URL/port');

    } catch (error) {
        console.error('Error checking server:', error.message);
    }
}

checkServer();