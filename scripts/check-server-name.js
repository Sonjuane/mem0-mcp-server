/**
 * Script to directly connect to a running server and validate its name
 */
import http from 'http';
import dotenv from 'dotenv';
import { EventSource } from 'eventsource';

// Load environment variables
dotenv.config();

// Try to connect to the SSE endpoint
const serverUrl = `http://localhost:8484/sse`;
console.log(`Attempting to connect to: ${serverUrl}`);

const headers = {
    'Accept': 'text/event-stream',
    'Authorization': `Bearer ${process.env.API_TOKEN || 'your-secure-api-token-here'}`
};

// Create event source and listen for events
const es = new EventSource(serverUrl, { headers });

// Handle connection open
es.onopen = () => {
    console.log('SSE connection established successfully');
};

// Handle messages
es.onmessage = (event) => {
    console.log('Received message:', event.data);
};

// Handle connection error
es.onerror = (err) => {
    console.error('Error connecting to SSE endpoint:', err);
    es.close();
};

// Listen for endpoint event that contains session ID
es.addEventListener('endpoint', (event) => {
    console.log('Received endpoint event:', event.data);

    try {
        // Extract session ID
        const sessionId = event.data.split('sessionId=')[1].trim();
        console.log(`Session ID: ${sessionId}`);

        // Make a request to check server name
        const messageUrl = `http://localhost:8484/message?sessionId=${sessionId}`;

        const requestBody = JSON.stringify({
            id: "check-server-name",
            method: "server.info",
            params: {}
        });

        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(messageUrl, options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                console.log('Server info response:', data);
                try {
                    const response = JSON.parse(data);
                    console.log('\nServer Name:', response.result.name);
                    console.log('Version:', response.result.version);
                    console.log('Description:', response.result.description);

                    if (response.result.name !== 'mem0-http') {
                        console.log('\n⚠️ WARNING: Server name is not "mem0-http"');
                        console.log('This may be causing the "No connection found for server: mem0-http" error');
                        console.log('The client is looking for a server named "mem0-http" but the server is using a different name');
                    } else {
                        console.log('\n✅ Server name matches "mem0-http" as expected');
                    }
                } catch (e) {
                    console.error('Error parsing server info response:', e);
                }

                // Close the EventSource connection
                setTimeout(() => {
                    console.log('Closing connection...');
                    es.close();
                    process.exit(0);
                }, 1000);
            });
        });

        req.on('error', (error) => {
            console.error('Error sending message request:', error);
            es.close();
            process.exit(1);
        });

        req.write(requestBody);
        req.end();
    } catch (e) {
        console.error('Error processing endpoint event:', e);
        es.close();
        process.exit(1);
    }
});

// Set a timeout to close the connection if nothing happens
setTimeout(() => {
    console.log('Timeout - closing connection');
    es.close();
    process.exit(1);
}, 5000);