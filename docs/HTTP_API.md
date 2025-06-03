# HTTP API Documentation

## Overview

The Mem0 MCP Server HTTP API provides RESTful endpoints for memory storage and retrieval operations. This API enables easy integration with VS Code and other tools without requiring absolute file paths.

## Base URL

```
http://localhost:8484
```

**Note:** The default port is 8484, but this can be configured via the `HTTP_SERVER_PORT` environment variable or the `env` key in your MCP configuration.

## Authentication

All memory operations require Bearer token authentication. Include the token in the Authorization header:

```
Authorization: Bearer your-api-token-here
```

Configure the expected token using either:
- The `API_TOKEN` environment variable
- The `env` key in your MCP configuration (recommended for VS Code setups)

## Response Format

All API responses follow a consistent format:

### Success Response
```json
{
  "success": true,
  "data": { /* response data */ },
  "error": null,
  "timestamp": "2025-06-01T21:00:00.000Z",
  "requestId": "req_1234567890_abcdef123"
}
```

### Error Response
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": { /* additional error context */ }
  },
  "timestamp": "2025-06-01T21:00:00.000Z",
  "requestId": "req_1234567890_abcdef123"
}
```

## Endpoints

### MCP Transport Endpoints (SSE)

#### GET /sse
Establish an SSE connection for MCP client communication.

**Headers:**
- `Accept: text/event-stream`
- `Cache-Control: no-cache`

**Response:**
- Content-Type: `text/event-stream`
- Establishes a persistent SSE connection for MCP protocol communication

#### POST /message
Send MCP protocol messages via the established SSE connection.

**Query Parameters:**
- `sessionId` (required): The SSE session ID from the established connection

**Request Body:**
- Raw MCP protocol message data

### Public Endpoints (No Authentication Required)

#### GET /
Get API information and available endpoints.

**Response:**
```json
{
  "success": true,
  "data": {
    "name": "Mem0 MCP Server - HTTP API",
    "version": "0.1.0",
    "description": "HTTP API for long term memory storage and retrieval with Mem0",
    "endpoints": { /* endpoint list */ },
    "authentication": "Bearer token required for memory operations",
    "documentation": "See docs/HTTP_API.md for detailed API documentation"
  }
}
```

#### GET /api/health
Health check endpoint.

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2025-06-01T21:00:00.000Z",
    "storage": {
      "provider": "LocalStorageProvider",
      "initialized": true
    },
    "mem0": {
      "enabled": true,
      "status": "connected"
    }
  }
}
```

#### GET /api/info
Get server information and capabilities.

**Response:**
```json
{
  "success": true,
  "data": {
    "name": "mem0-mcp-server-nodejs",
    "version": "0.1.0",
    "description": "MCP server for long term memory storage and retrieval with Mem0 - Node.js implementation",
    "capabilities": {
      "tools": ["save_memory", "get_all_memories", "search_memories"],
      "transports": ["stdio", "http"],
      "storage": "LocalStorageProvider",
      "mem0": true
    }
  }
}
```

### Memory Endpoints (Authentication Required)

#### POST /api/memory/save
Save a new memory.

**Request Body:**
```json
{
  "text": "Memory content to save",
  "userId": "optional-user-id",
  "metadata": {
    "optional": "metadata"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "memory-uuid",
    "message": "Successfully saved memory: Memory content to save",
    "userId": "user-id"
  }
}
```

#### GET /api/memory/all
Get all memories for a user.

**Query Parameters:**
- `userId` (optional): User identifier (defaults to DEFAULT_USER_ID)
- `limit` (optional): Maximum number of memories to return (default: 50, max: 1000)

**Response:**
```json
{
  "success": true,
  "data": {
    "memories": [
      {
        "id": "memory-uuid",
        "userId": "user-id",
        "memory": "Memory content",
        "metadata": {
          "originalText": "Original memory text",
          "timestamp": "2025-06-01T21:00:00.000Z",
          "createdAt": "2025-06-01T21:00:00.000Z",
          "updatedAt": "2025-06-01T21:00:00.000Z"
        }
      }
    ],
    "count": 1,
    "userId": "user-id",
    "limit": 50
  }
}
```

#### GET /api/memory/search
Search memories using text-based or semantic search.

**Query Parameters:**
- `query` (required): Search query string
- `userId` (optional): User identifier (defaults to DEFAULT_USER_ID)
- `limit` (optional): Maximum number of results (default: 10, max: 100)

**Response:**
```json
{
  "success": true,
  "data": {
    "memories": [
      {
        "id": "memory-uuid",
        "userId": "user-id",
        "memory": "Matching memory content",
        "metadata": { /* metadata */ },
        "relevanceScore": 2
      }
    ],
    "count": 1,
    "query": "search term",
    "userId": "user-id",
    "limit": 10
  }
}
```

#### GET /api/memory/:id
Get a specific memory by ID.

**Path Parameters:**
- `id`: Memory UUID

**Query Parameters:**
- `userId` (optional): User identifier (defaults to DEFAULT_USER_ID)

**Response:**
```json
{
  "success": true,
  "data": {
    "memory": {
      "id": "memory-uuid",
      "userId": "user-id",
      "memory": "Memory content",
      "metadata": { /* metadata */ }
    },
    "userId": "user-id"
  }
}
```

#### PUT /api/memory/:id
Update a memory.

**Path Parameters:**
- `id`: Memory UUID

**Request Body:**
```json
{
  "text": "Updated memory content",
  "userId": "optional-user-id",
  "metadata": {
    "optional": "updated metadata"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "memory-uuid",
    "message": "Memory updated successfully",
    "userId": "user-id"
  }
}
```

#### DELETE /api/memory/:id
Delete a memory.

**Path Parameters:**
- `id`: Memory UUID

**Query Parameters:**
- `userId` (optional): User identifier (defaults to DEFAULT_USER_ID)

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "memory-uuid",
    "message": "Memory deleted successfully",
    "userId": "user-id"
  }
}
```

## Error Codes

| Code | Description |
|------|-------------|
| `MISSING_TOKEN` | Authorization token not provided |
| `INVALID_TOKEN` | Invalid authorization token |
| `VALIDATION_ERROR` | Request validation failed |
| `MEMORY_NOT_FOUND` | Memory with specified ID not found |
| `RATE_LIMIT_EXCEEDED` | Too many requests |
| `ROUTE_NOT_FOUND` | API endpoint not found |
| `INTERNAL_SERVER_ERROR` | Server error occurred |

## Rate Limiting

The API implements rate limiting to prevent abuse:
- Default: 100 requests per 15 minutes per IP
- Configurable via `RATE_LIMIT_MAX_REQUESTS` and `RATE_LIMIT_WINDOW_MS` environment variables

## CORS

Cross-Origin Resource Sharing (CORS) is configured to allow requests from:
- `http://localhost:*`
- `https://localhost:*`
- Additional origins can be configured via `CORS_ORIGINS` environment variable

## Examples

### Save a Memory
```bash
curl -X POST http://localhost:8484/api/memory/save \
  -H "Authorization: Bearer your-api-token" \
  -H "Content-Type: application/json" \
  -d '{"text": "Remember to update the documentation", "userId": "user123"}'
```

### Search Memories
```bash
curl -H "Authorization: Bearer your-api-token" \
  "http://localhost:8484/api/memory/search?query=documentation&userId=user123"
```

### Get All Memories
```bash
curl -H "Authorization: Bearer your-api-token" \
  "http://localhost:8484/api/memory/all?userId=user123&limit=10"
```

## VS Code Integration

To use with VS Code, configure your MCP client with the `env` key for centralized configuration:

```json
{
  "transport": "sse",
  "url": "http://localhost:8484/sse",
  "headers": {
    "Authorization": "Bearer your-api-token-here"
  },
  "env": {
    "HTTP_SERVER_ENABLED": "true",
    "HTTP_SERVER_PORT": "8484",
    "API_TOKEN": "your-api-token-here",
    "STORAGE_PROVIDER": "local",
    "DEFAULT_USER_ID": "vscode-user"
  },
  "description": "Mem0 MCP Server via HTTP - Save memories to current project directory"
}
```

The server supports both HTTP REST API and SSE (Server-Sent Events) transport for MCP clients. The `env` key allows you to configure the server directly from your MCP client configuration, eliminating the need for separate environment files.

### SSE Transport Endpoints

When using SSE transport, the server provides these additional endpoints:
- `GET /sse` - Establish SSE connection for MCP communication
- `POST /message` - Send MCP messages via SSE transport

## Environment Variables

These variables can be set either as system environment variables or via the `env` key in your MCP configuration:

| Variable | Description | Default |
|----------|-------------|---------|
| `HTTP_SERVER_ENABLED` | Enable HTTP server | `false` |
| `HTTP_SERVER_PORT` | HTTP server port | `8484` |
| `HTTP_SERVER_HOST` | HTTP server host | `0.0.0.0` |
| `API_TOKEN` | Authentication token | Required |
| `STORAGE_PROVIDER` | Storage backend | `local` |
| `DEFAULT_USER_ID` | Default user identifier | `user` |
| `CORS_ORIGINS` | Allowed CORS origins | `http://localhost:*,https://localhost:*` |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window | `900000` (15 minutes) |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | `100` |

**Note:** When using the `env` key in MCP configuration, these values will override any system environment variables, providing centralized configuration management.

## Security Considerations

1. **Authentication**: Always use a strong, unique API token
2. **HTTPS**: Use HTTPS in production environments
3. **Rate Limiting**: Monitor and adjust rate limits based on usage
4. **CORS**: Configure CORS origins appropriately for your environment
5. **Network**: Consider firewall rules and network security