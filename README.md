# Mem0 MCP Server - Node.js (HTTP-Only)

A Node.js implementation of the Mem0 MCP (Model Context Protocol) server with **HTTP-only operation** for simplified deployment and integration.

This was based on this repo [coleam00/mcp-mem0.git](https://github.com/coleam00/mcp-mem0.git)

## Features

- **HTTP-Only Operation**: Simplified server that runs exclusively via HTTP API
- **Workspace Integration**: Automatically stores memories in your active project directory
- **RESTful API**: Easy integration with web applications, VSCode extensions, and MCP clients
- **Local File Storage**: Stores memories in a `.Mem0-Files` directory in your workspace root
- **MCP Tools**: Provides `save_memory`, `get_all_memories`, and `search_memories` tools
- **Authentication**: Token-based authentication for secure API access
- **Rate Limiting**: Built-in protection against API abuse
- **Configurable Storage**: Plugin architecture supports multiple storage backends
- **ESM Modules**: Modern Node.js implementation using ES modules
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
   # Start the HTTP server (default port 8484)
   npm start
   
   # Start with specific workspace (recommended)
   npm run start:workspace /path/to/your/project
   
   # Start in development mode with auto-restart
   npm run dev
   ```

4. **Verify it's working**:
   ```bash
   # Check server status
   curl http://localhost:8484/
   
   # Or open in browser: http://localhost:8484
   ```

5. **Use the HTTP API**:
   ```bash
   # Save a memory
   curl -X POST http://localhost:8484/api/memory/save \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer 550EA5B7-4C7B-4B17-9BF7-5A6B6D232FA2" \
     -d '{"text": "Your memory here", "userId": "vscode-user"}'
   
   # Search memories
   curl "http://localhost:8484/api/memory/search?query=memory&userId=vscode-user" \
     -H "Authorization: Bearer 550EA5B7-4C7B-4B17-9BF7-5A6B6D232FA2"
   ```

## Configuration

The server is configured via environment variables. Copy `.env.example` to `.env` and configure:

### Basic Configuration
- `HOST`: Host to bind to (default: `0.0.0.0`)
- `PORT`: Port to listen on (default: `8484`)
- `STORAGE_PROVIDER`: Storage backend (`local` or `postgresql`) - currently only `local` is implemented
- `LOCAL_STORAGE_DIR`: Directory for local storage (default: `.Mem0-Files`)
- `PROJECT_DIR`: Workspace directory where memories will be stored (auto-detected or set explicitly)

### HTTP Server Configuration (Always Enabled)
- `HTTP_SERVER_ENABLED`: Enable HTTP API server (`true` or `false`, default: `false`)
- `HTTP_SERVER_PORT`: HTTP server port (default: `3000`)
- `HTTP_SERVER_HOST`: HTTP server host (default: `0.0.0.0`)
- `API_TOKEN`: Authentication token for HTTP API (required when HTTP server is enabled)
- `CORS_ORIGINS`: Allowed CORS origins (default: `http://localhost:*,https://localhost:*`)
- `RATE_LIMIT_WINDOW_MS`: Rate limiting window in milliseconds (default: `900000` - 15 minutes)
- `RATE_LIMIT_MAX_REQUESTS`: Maximum requests per window (default: `100`)

### LLM Configuration (for future Mem0 integration)
- `LLM_PROVIDER`: LLM provider (`openai`, `openrouter`, or `ollama`)
- `LLM_API_KEY`: API key for your LLM provider
- `LLM_CHOICE`: Model to use (e.g., `gpt-4o-mini`)
- `EMBEDDING_MODEL_CHOICE`: Embedding model (e.g., `text-embedding-3-small`)

## MCP Client Configuration

### VS Code with Roo Code Extension

To use this MCP server with VS Code and the Roo Code extension:

#### Setup Steps:

1. **Install the Roo Code extension** in VS Code from the marketplace
2. **Generate configuration** by running: `npm run config` (this will show the exact paths)
3. **Open VS Code Settings** (Cmd/Ctrl + ,)
4. **Search for "roo"** to find Roo Code settings
5. **Find "MCP Servers" configuration** in the Roo Code settings
6. **Copy and paste the generated configuration** from step 2

#### Configuration Examples:

**Option 1: Stdio Transport (Direct Process Communication)**
Add this configuration to your Roo Code MCP servers settings:

```json
{
  "mem0-nodejs": {
    "command": "node",
    "args": ["/absolute/path/to/mem0_mcp_server_nodejs/src/main.js"],
    "env": {
      "TRANSPORT": "stdio",
      "STORAGE_PROVIDER": "local",
      "LOCAL_STORAGE_DIR": ".Mem0-Files",
      "DEFAULT_USER_ID": "vscode-user",
      "DEBUG": "false"
    }
  }
}
```

**Option 2: SSE Transport (HTTP-based Communication)**
First, start the server with SSE transport:
```bash
TRANSPORT=sse HTTP_SERVER_ENABLED=true npm start
```

Then add this configuration to your Roo Code MCP servers settings:
```json
{
  "mcpServers": {
    "mem0-sse": {
      "transport": "sse",
      "url": "http://localhost:8484/sse",
      "headers": {
        "Authorization": "Bearer YOUR_API_TOKEN_HERE"
      },
      "description": "Mem0 MCP Server via SSE transport"
    }
  }
}
```

#### Usage in VS Code:

Once configured, you can use the memory tools in Roo Code:

- **Save memories**: Use the `save_memory` tool to store information about your project, coding patterns, or decisions
- **Retrieve memories**: Use `get_all_memories` to see all stored information
- **Search memories**: Use `search_memories` to find specific information

#### Example Usage:
```
@mem0-nodejs save_memory "This project uses ESM modules and stores data in .Mem0-Files directory"
@mem0-nodejs search_memories "ESM modules"
@mem0-nodejs get_all_memories
```

#### Important Notes:
- Replace `/absolute/path/to/mem0_mcp_server_nodejs/` with the actual absolute path to your project
- The server will create a `.Mem0-Files` directory in the project root
- Each VS Code workspace can have its own memory storage
- Memories are isolated by the `DEFAULT_USER_ID` setting
- You can find the exact path using `pwd` command in your project directory

### VS Code with HTTP API (Recommended)

For the easiest setup with VS Code and Roo Code, use the HTTP API which eliminates the need for absolute file paths:

**📖 [Complete VS Code Setup Guide](docs/VSCODE_SETUP_GUIDE.md)**

**Quick Setup:**
1. **Start the HTTP server**:
   ```bash
   API_TOKEN=your-secure-token HTTP_SERVER_ENABLED=true npm start
   ```

2. **Configure Roo Code** in VS Code settings:
   ```json
   {
     "mem0-http": {
       "transport": "sse",
       "url": "http://localhost:3000",
       "headers": {
         "Authorization": "Bearer your-secure-token"
       }
     }
   }
   ```

3. **Use in VS Code**:
   ```
   @mem0-http save_memory "This project uses React with TypeScript"
   @mem0-http search_memories "React"
   ```

**📚 Documentation:**
- [Complete Setup Guide](docs/VSCODE_SETUP_GUIDE.md) - Step-by-step instructions
- [Quick Reference](docs/QUICK_REFERENCE.md) - Commands and troubleshooting
- [HTTP API Reference](docs/HTTP_API.md) - Complete API documentation

### Claude Desktop (stdio)

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
        "LOCAL_STORAGE_DIR": ".Mem0-Files"
      }
    }
  }
}
```

## Available Tools

### save_memory
Store information in long-term memory.

**Parameters:**
- `text` (required): Content to store
- `userId` (optional): User identifier (defaults to configured user)

### get_all_memories
Retrieve all stored memories for a user.

**Parameters:**
- `userId` (optional): User identifier
- `limit` (optional): Maximum number of memories to return (default: 50)

### search_memories
Search memories using text-based search.

**Parameters:**
- `query` (required): Search query
- `userId` (optional): User identifier
- `limit` (optional): Maximum results to return (default: 3)

## Local Storage Structure

The local storage provider creates the following structure:

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

Each memory file contains:
```json
{
  "id": "uuid",
  "userId": "user",
  "memory": "memory content",
  "metadata": {
    "originalText": "original input",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

## Development

### Running in Development Mode
```bash
npm run dev
```

### Testing
```bash
npm test
```

### Linting
```bash
npm run lint
```

## Docker

### Build Image
```bash
npm run docker:build
```

### Run Container
```bash
npm run docker:run
```

## Project Status

This is an early implementation with the following status:

### ✅ Implemented
- [x] Basic MCP server setup
- [x] Local file storage provider
- [x] Core MCP tools (save, get, search)
- [x] Project structure and configuration
- [x] Basic text-based search
- [x] HTTP API server with Express.js
- [x] Token-based authentication
- [x] Rate limiting and security
- [x] Dual transport support (stdio + HTTP)
- [x] Comprehensive API documentation
- [x] VS Code integration via HTTP

### 🚧 In Progress
- [ ] Enhanced Mem0 integration
- [ ] Semantic search with embeddings
- [ ] PostgreSQL storage provider
- [ ] SSE transport support (HTTP server ready, SSE endpoint pending)

### 📋 Planned
- [ ] Full LLM integration for memory processing
- [ ] Advanced search algorithms
- [ ] Memory analytics and management
- [ ] Web-based memory browser

## Development Notes

For development documentation, implementation details, and project planning files, see the [`Dev-Notes/`](Dev-Notes/) folder.

## Contributing

This project is in active development. Contributions are welcome!

## License

MIT License