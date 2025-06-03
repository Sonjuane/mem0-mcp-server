# Mem0 MCP Server - Node.js

A Node.js implementation of the Mem0 MCP (Model Context Protocol) server with **HTTP REST API and SSE transport support** for flexible deployment and integration.

This was based on this repo [coleam00/mcp-mem0.git](https://github.com/coleam00/mcp-mem0.git)

## Features

- **Dual Transport Support**: HTTP REST API and SSE (Server-Sent Events) transport for MCP clients
- **Workspace Integration**: Automatically stores memories in your active project directory
- **RESTful API**: Easy integration with web applications, VSCode extensions, and MCP clients
- **SSE Transport**: Real-time bidirectional communication for MCP clients like VS Code
- **Local File Storage**: Stores memories in a `.Mem0-Files` directory in your workspace root
- **MCP Tools**: Provides `save_memory`, `get_all_memories`, and `search_memories` tools
- **Authentication**: Token-based authentication for secure API access
- **Rate Limiting**: Built-in protection against API abuse
- **Docker Support**: Containerized deployment option

## Quick Start

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Run the server**:
   ```bash
   # Start the HTTP server (default port 3000)
   npm run start:http
   
   # Start with specific workspace (recommended)
   npm run start:workspace /path/to/your/project
   
   # Start in development mode with auto-restart
   npm run dev:http
   ```

4. **Verify it's working**:
   ```bash
   # Check server status
   curl http://localhost:3000/api/health
   ```

## Configuration

The server is configured via environment variables. Copy `.env.example` to `.env` and configure:

### Essential Configuration
- `HTTP_SERVER_ENABLED`: Enable HTTP API server (`true`)
- `HTTP_SERVER_PORT`: HTTP server port (default: `3000`)
- `API_TOKEN`: Authentication token for HTTP API (required)
- `STORAGE_PROVIDER`: Storage backend (`local`)
- `LOCAL_STORAGE_DIR`: Directory for local storage (default: `.Mem0-Files`)
- `DEFAULT_USER_ID`: Default user identifier (default: `vscode-user`)

### Optional Configuration
- `CORS_ORIGINS`: Allowed CORS origins (default: `http://localhost:*,https://localhost:*`)
- `RATE_LIMIT_WINDOW_MS`: Rate limiting window in milliseconds (default: `900000`)
- `RATE_LIMIT_MAX_REQUESTS`: Maximum requests per window (default: `100`)

## VS Code Setup

### Quick Setup with Roo Code Extension

1. **Configure Roo Code** in VS Code settings (search for "roo" → MCP Servers):
   ```json
   {
     "mem0-http": {
       "transport": "sse",
       "url": "http://localhost:8484/sse",
       "headers": {
         "Authorization": "Bearer your-secure-api-token-here"
       },
       "env": {
         "HTTP_SERVER_ENABLED": "true",
         "HTTP_SERVER_PORT": "8484",
         "API_TOKEN": "your-secure-api-token-here",
         "STORAGE_PROVIDER": "local",
         "DEFAULT_USER_ID": "vscode-user"
       },
       "description": "Mem0 MCP Server via HTTP - Save memories to current project directory"
     }
   }
   ```

2. **Use in VS Code**:
   ```bash
   # Save a memory
   @mem0-http save_memory "This project uses React with TypeScript"
   
   # Search memories
   @mem0-http search_memories "React"
   
   # Get all memories
   @mem0-http get_all_memories
   ```

**📖 [Complete VS Code Setup Guide](docs/VSCODE_SETUP_GUIDE.md)**

### Environment Variable Overrides

The `env` key in the MCP configuration allows you to override environment variables without needing a separate `.env` file. This is particularly useful for VS Code extensions where you want to configure the server directly from the MCP client configuration.

**Key Benefits:**
- No need to manage separate `.env` files
- Configuration is centralized in your MCP client settings
- Environment variables from `env` key take precedence over system environment variables

### Claude Desktop Setup

Add this to your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "mem0-nodejs": {
      "command": "node",
      "args": ["path/to/mem0_mcp_server_nodejs/src/main.js"],
      "env": {
        "TRANSPORT": "stdio",
        "STORAGE_PROVIDER": "local",
        "LOCAL_STORAGE_DIR": ".Mem0-Files",
        "DEFAULT_USER_ID": "claude-user"
      },
      "description": "Mem0 MCP Server - Long-term memory storage and retrieval"
    }
  }
}
```

**📋 [Complete Claude Desktop Config Example](examples/claude-desktop-config.json)**

## HTTP API

### Public Endpoints (No Auth)
- `GET /` - API information
- `GET /api/health` - Health check
- `GET /api/info` - Server information

### Memory Endpoints (Requires Auth)
- `POST /api/memory/save` - Save memory
- `GET /api/memory/all` - Get all memories
- `GET /api/memory/search` - Search memories
- `GET /api/memory/:id` - Get specific memory
- `PUT /api/memory/:id` - Update memory
- `DELETE /api/memory/:id` - Delete memory

### Authentication
Include in all API requests:
```
Authorization: Bearer your-api-token
```

### Example API Usage
```bash
# Save a memory
curl -X POST http://localhost:3000/api/memory/save \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-token" \
  -d '{"text": "Your memory here", "userId": "vscode-user"}'

# Search memories
curl "http://localhost:3000/api/memory/search?query=memory&userId=vscode-user" \
  -H "Authorization: Bearer your-token"
```

**📚 [Complete HTTP API Reference](docs/HTTP_API.md)**

## Available MCP Tools

### save_memory
Store information in long-term memory.
- `text` (required): Content to store
- `userId` (optional): User identifier

### get_all_memories
Retrieve all stored memories for a user.
- `userId` (optional): User identifier
- `limit` (optional): Maximum number of memories (default: 50)

### search_memories
Search memories using text-based search.
- `query` (required): Search query
- `userId` (optional): User identifier
- `limit` (optional): Maximum results (default: 3)

## Memory Storage

Memories are stored locally in this structure:
```
.Mem0-Files/
├── users/
│   └── [userId]/
│       ├── [memoryId1].json
│       ├── [memoryId2].json
│       └── ...
└── index/
    └── [userId].json
```

## Development

### Running in Development Mode
```bash
npm run dev:http
```

### Testing
```bash
npm test
```

### Docker
```bash
# Build and run
npm run docker:build
npm run docker:run
```

## Project Status

### ✅ Implemented
- [x] Basic MCP server setup
- [x] Local file storage provider
- [x] Core MCP tools (save, get, search)
- [x] HTTP API server with Express.js
- [x] SSE transport support for MCP clients
- [x] Token-based authentication
- [x] Rate limiting and security
- [x] VS Code integration via SSE transport
- [x] Comprehensive documentation

### 🚧 Planned
- [ ] Enhanced Mem0 integration with LLM processing
- [ ] Semantic search with embeddings
- [ ] PostgreSQL storage provider

## Contributing

This project is in active development. Contributions are welcome!

## License

MIT License