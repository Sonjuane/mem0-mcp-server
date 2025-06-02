# HTTP-Only Setup Guide for Mem0 MCP Server

The Mem0 MCP Server now runs exclusively in HTTP mode, making it easier to integrate with web-based applications and providing a RESTful API interface.

## Quick Start

### 1. Start the Server

```bash
npm start
```

The server will start on `http://localhost:8484` by default.

### 2. Verify Server is Running

Open your browser and go to: `http://localhost:8484`

You should see the API information page.

## Configuration

### Environment Variables

The server uses these key environment variables:

```bash
# Server Configuration
HOST=0.0.0.0                    # Host to bind to
PORT=8484                       # Port to listen on

# Storage Configuration
STORAGE_PROVIDER=local           # Use local file storage
PROJECT_DIR=/path/to/your/project # Where to store memory files
LOCAL_STORAGE_DIR=.Mem0-Files   # Directory name for memories

# LLM Configuration
LLM_PROVIDER=openai             # LLM provider (openai, openrouter, ollama)
LLM_API_KEY=your-api-key-here   # Your LLM API key
LLM_CHOICE=gpt-4o-mini          # Model to use

# Security
API_TOKEN=your-secure-token     # API authentication token
```

### Custom Configuration

Edit the `.env` file in the project root to customize your setup:

```bash
# Copy the example and customize
cp .env.example .env
nano .env
```

## API Endpoints

### Public Endpoints (No Authentication)

- `GET /` - API information
- `GET /api/health` - Health check
- `GET /api/info` - Server information

### Memory Endpoints (Require Authentication)

All memory endpoints require the `Authorization: Bearer <API_TOKEN>` header.

- `POST /api/memory/save` - Save a new memory
- `GET /api/memory/all` - Get all memories
- `GET /api/memory/search?q=query` - Search memories
- `GET /api/memory/:id` - Get specific memory
- `PUT /api/memory/:id` - Update memory
- `DELETE /api/memory/:id` - Delete memory

### Example API Usage

#### Save a Memory

```bash
curl -X POST http://localhost:8484/api/memory/save \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-api-token" \
  -d '{
    "text": "Remember that the user prefers TypeScript over JavaScript",
    "userId": "user123"
  }'
```

#### Search Memories

```bash
curl "http://localhost:8484/api/memory/search?q=TypeScript&userId=user123" \
  -H "Authorization: Bearer your-api-token"
```

#### Get All Memories

```bash
curl "http://localhost:8484/api/memory/all?userId=user123" \
  -H "Authorization: Bearer your-api-token"
```

## Integration with VSCode and Applications

### HTTP-Only Approach (Recommended)

Since this is an HTTP-only server, you should:

1. **Run the server as a service**:
   ```bash
   # Start the server (runs continuously)
   npm start
   ```

2. **Use HTTP API calls directly** from your applications:
   ```javascript
   const response = await fetch('http://localhost:8484/api/memory/save', {
     method: 'POST',
     headers: {
       'Content-Type': 'application/json',
       'Authorization': 'Bearer your-api-token'
     },
     body: JSON.stringify({
       text: 'Memory content here',
       userId: 'vscode-user'
     })
   });
   ```

3. **Configure workspace detection** by setting environment variables when starting the server:
   ```bash
   # For your current project
   VSCODE_WORKSPACE_FOLDER=/Users/sonjuane/Dropbox/Projects/WEB-COMPONENTS/markdown-component/version-4 npm start
   ```

### VSCode Extension Integration

If you're building a VSCode extension, you can:

1. **Detect the current workspace**:
   ```javascript
   const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
   ```

2. **Start the server with workspace context**:
   ```javascript
   const serverProcess = spawn('npm', ['start'], {
     env: {
       ...process.env,
       VSCODE_WORKSPACE_FOLDER: workspaceFolder
     },
     cwd: '/path/to/mem0_mcp_server'
   });
   ```

3. **Make HTTP calls to the server**:
   ```javascript
   const saveMemory = async (text) => {
     const response = await fetch('http://localhost:8484/api/memory/save', {
       method: 'POST',
       headers: {
         'Content-Type': 'application/json',
         'Authorization': 'Bearer your-api-token'
       },
       body: JSON.stringify({ text, userId: 'vscode-user' })
     });
     return response.json();
   };
   ```

## Docker Deployment

### Build and Run

```bash
# Build the Docker image
npm run docker:build

# Run with environment file
npm run docker:run
```

### Docker Compose

```yaml
version: '3.8'
services:
  mem0-server:
    build: .
    ports:
      - "8484:8484"
    environment:
      - HOST=0.0.0.0
      - PORT=8484
      - STORAGE_PROVIDER=local
      - PROJECT_DIR=/app/data
      - LLM_PROVIDER=openai
      - LLM_API_KEY=your-api-key
      - API_TOKEN=your-secure-token
    volumes:
      - ./data:/app/data
```

## Troubleshooting

### Server Won't Start

1. Check if port 8484 is available:
   ```bash
   lsof -i :8484
   ```

2. Try a different port:
   ```bash
   PORT=8485 npm start
   ```

### Authentication Issues

1. Verify your API token is set correctly in `.env`
2. Check that you're including the `Authorization` header in requests
3. Ensure the token matches exactly (no extra spaces)

### Memory Storage Issues

1. Check that `PROJECT_DIR` points to a writable directory
2. Verify the directory exists and has proper permissions
3. Look for `.Mem0-Files` directory in your project root

## Development

### Start in Development Mode

```bash
npm run dev
```

This starts the server with file watching for automatic restarts.

### Run Tests

```bash
npm test
```

### API Testing

Use the included demo script to test the API:

```bash
npm run demo
```

## Security Considerations

1. **Change the default API token** in production
2. **Use HTTPS** in production environments
3. **Restrict CORS origins** for web applications
4. **Monitor rate limits** to prevent abuse
5. **Keep API keys secure** and rotate them regularly

## Performance Tuning

### Rate Limiting

Adjust rate limiting in `.env`:

```bash
RATE_LIMIT_WINDOW_MS=900000     # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100     # Max requests per window
```

### CORS Configuration

Configure allowed origins:

```bash
CORS_ORIGINS=http://localhost:*,https://yourdomain.com
```

### Memory Limits

For large memory datasets, consider:
- Using PostgreSQL storage instead of local files
- Implementing memory cleanup policies
- Monitoring disk usage

## Support

For issues and questions:
1. Check the logs for error messages
2. Verify your configuration matches this guide
3. Test with the demo script to isolate issues
4. Review the API documentation at `http://localhost:8484`