# Express Server Implementation Task for Mem0 MCP Server

## Task Overview

Implement an Express.js HTTP server wrapper for the existing Mem0 MCP Server to enable easier integration with VS Code and other tools by eliminating the need for absolute file paths and providing a persistent service architecture.

## Current Project Context

### Project Structure
```
mem0_mcp_server_nodejs/
├── src/
│   ├── main.js              # Current MCP server entry point
│   ├── storage/
│   │   ├── index.js         # Storage provider factory
│   │   ├── local.js         # Local file storage implementation
│   │   └── postgresql.js    # PostgreSQL placeholder
│   ├── mem0/
│   │   └── client.js        # Mem0 integration (simplified)
│   └── utils/
│       └── logger.js        # Logging utility
├── test/
│   └── basic-functionality.test.js
├── examples/
│   ├── demo.js
│   ├── claude-desktop-config.json
│   ├── claude-desktop-docker-config.json
│   └── vscode-roo-config.json
├── scripts/
│   └── get-config-path.js
├── package.json
├── .env.example
├── README.md
└── TASKS.md
```

### Current Dependencies
```json
{
  "dependencies": {
    "@modelcontextprotocol/sdk": "^0.5.0",
    "dotenv": "^16.4.5",
    "node-fetch": "^3.3.2",
    "uuid": "^10.0.0"
  }
}
```

### Current MCP Tools
1. `save_memory` - Store information in long-term memory
2. `get_all_memories` - Retrieve all stored memories for a user
3. `search_memories` - Search memories using text-based search

### Current Storage System
- Local file storage in `.Mem0-Files` directory
- User-isolated memory storage (`users/[userId]/`)
- JSON-based memory files with UUIDs
- Search indexing system

## Implementation Phases

### Phase 1: Project Setup and Dependencies
**Estimated Time: 2-4 hours**

#### Milestone 1.1: Add Express Dependencies
- [ ] Add Express.js and related middleware to package.json
- [ ] Add CORS support for cross-origin requests
- [ ] Add authentication middleware dependencies
- [ ] Add API documentation dependencies (optional)

**Required Dependencies:**
```json
{
  "express": "^4.18.2",
  "cors": "^2.8.5",
  "helmet": "^7.1.0",
  "express-rate-limit": "^7.1.5",
  "jsonwebtoken": "^9.0.2",
  "bcryptjs": "^2.4.3"
}
```

#### Milestone 1.2: Environment Configuration
- [ ] Extend `.env.example` with Express server configuration
- [ ] Add HTTP server port, host, and security settings
- [ ] Add API authentication token configuration
- [ ] Update existing environment validation

**New Environment Variables:**
```env
# Express Server Configuration
HTTP_SERVER_ENABLED=true
HTTP_SERVER_PORT=3000
HTTP_SERVER_HOST=0.0.0.0
API_TOKEN=your-secure-api-token-here
CORS_ORIGINS=http://localhost:*,https://localhost:*
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

#### Success Criteria:
- [ ] All dependencies installed without conflicts
- [ ] Environment configuration extended
- [ ] No breaking changes to existing functionality

### Phase 2: Core Express Server Implementation
**Estimated Time: 6-8 hours**

#### Milestone 2.1: Basic Express Server Structure
- [ ] Create `src/server/express.js` - Main Express server implementation
- [ ] Create `src/server/middleware/` directory for custom middleware
- [ ] Create `src/server/routes/` directory for API routes
- [ ] Create `src/server/controllers/` directory for business logic

#### Milestone 2.2: Authentication and Security
- [ ] Implement token-based authentication middleware
- [ ] Add rate limiting to prevent abuse
- [ ] Add CORS configuration
- [ ] Add security headers with Helmet
- [ ] Add request logging and error handling

**File: `src/server/middleware/auth.js`**
```javascript
export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }
  
  if (token !== process.env.API_TOKEN) {
    return res.status(403).json({ error: 'Invalid token' });
  }
  
  next();
}
```

#### Milestone 2.3: API Route Implementation
- [ ] Create `/api/memory/save` endpoint (POST)
- [ ] Create `/api/memory/all` endpoint (GET)
- [ ] Create `/api/memory/search` endpoint (GET)
- [ ] Create `/api/memory/:id` endpoint (GET, PUT, DELETE)
- [ ] Create `/api/health` endpoint for health checks
- [ ] Create `/api/info` endpoint for server information

**API Endpoint Specifications:**

```javascript
// POST /api/memory/save
{
  "text": "Memory content",
  "userId": "optional-user-id",
  "metadata": { "optional": "metadata" }
}

// GET /api/memory/all?userId=user&limit=50
// GET /api/memory/search?query=search-term&userId=user&limit=10
// GET /api/memory/:id?userId=user
// PUT /api/memory/:id (with body similar to save)
// DELETE /api/memory/:id?userId=user
```

#### Success Criteria:
- [ ] Express server starts without errors
- [ ] All API endpoints respond correctly
- [ ] Authentication works properly
- [ ] Rate limiting functions as expected
- [ ] CORS headers are set correctly

### Phase 3: Integration with Existing MCP Server
**Estimated Time: 4-6 hours**

#### Milestone 3.1: Dual Transport Support
- [ ] Modify `src/main.js` to support both stdio and HTTP transports
- [ ] Create transport selection logic based on environment variables
- [ ] Ensure both transports can run simultaneously if needed
- [ ] Add graceful shutdown handling for HTTP server

**File: `src/main.js` (Modified)**
```javascript
async function main() {
  const server = new Mem0MCPServer();
  await server.initialize();
  
  const transport = process.env.TRANSPORT || 'stdio';
  const httpEnabled = process.env.HTTP_SERVER_ENABLED === 'true';
  
  if (transport === 'stdio') {
    // Existing stdio implementation
  }
  
  if (httpEnabled) {
    // Start Express server
    const { startExpressServer } = await import('./server/express.js');
    await startExpressServer(server);
  }
}
```

#### Milestone 3.2: Shared Business Logic
- [ ] Extract memory operations into reusable service classes
- [ ] Create `src/services/MemoryService.js` for shared logic
- [ ] Ensure both MCP tools and HTTP endpoints use the same service
- [ ] Add proper error handling and logging

#### Milestone 3.3: Configuration Management
- [ ] Update configuration system to handle both transports
- [ ] Add validation for HTTP server configuration
- [ ] Create startup scripts for different modes
- [ ] Update package.json scripts

**New Package.json Scripts:**
```json
{
  "start:stdio": "TRANSPORT=stdio node src/main.js",
  "start:http": "HTTP_SERVER_ENABLED=true node src/main.js",
  "start:both": "TRANSPORT=stdio HTTP_SERVER_ENABLED=true node src/main.js",
  "dev:http": "HTTP_SERVER_ENABLED=true node --watch src/main.js"
}
```

#### Success Criteria:
- [ ] Both stdio and HTTP transports work independently
- [ ] Shared business logic functions correctly
- [ ] Configuration system handles all scenarios
- [ ] No regression in existing MCP functionality

### Phase 4: Testing and Validation
**Estimated Time: 4-6 hours**

#### Milestone 4.1: HTTP API Testing
- [ ] Create `test/http-api.test.js` for Express server testing
- [ ] Test all API endpoints with various scenarios
- [ ] Test authentication and authorization
- [ ] Test rate limiting and error handling
- [ ] Test CORS functionality

#### Milestone 4.2: Integration Testing
- [ ] Test dual transport mode (stdio + HTTP)
- [ ] Test memory consistency between transports
- [ ] Test concurrent access scenarios
- [ ] Test server startup and shutdown procedures

#### Milestone 4.3: Performance Testing
- [ ] Create performance benchmarks for HTTP endpoints
- [ ] Compare performance between stdio and HTTP transports
- [ ] Test memory usage and resource consumption
- [ ] Test with high request volumes

#### Success Criteria:
- [ ] All tests pass consistently
- [ ] Performance meets acceptable thresholds
- [ ] No memory leaks or resource issues
- [ ] Concurrent access works correctly

### Phase 5: Documentation and Examples
**Estimated Time: 3-4 hours**

#### Milestone 5.1: API Documentation
- [ ] Create `docs/HTTP_API.md` with complete API documentation
- [ ] Document all endpoints with examples
- [ ] Document authentication and error responses
- [ ] Create OpenAPI/Swagger specification (optional)

#### Milestone 5.2: Configuration Examples
- [ ] Create `examples/http-server-config.json` for VS Code
- [ ] Update existing configuration examples
- [ ] Create Docker configuration for HTTP mode
- [ ] Update `scripts/get-config-path.js` for HTTP mode

#### Milestone 5.3: Usage Documentation
- [ ] Update main README.md with HTTP server information
- [ ] Create setup guides for different deployment scenarios
- [ ] Document migration from stdio to HTTP mode
- [ ] Create troubleshooting guide

#### Success Criteria:
- [ ] Documentation is complete and accurate
- [ ] Examples work as documented
- [ ] Setup guides are clear and actionable
- [ ] Migration path is well-documented

### Phase 6: Production Readiness
**Estimated Time: 2-4 hours**

#### Milestone 6.1: Docker Support
- [ ] Update Dockerfile to support HTTP mode
- [ ] Create docker-compose configuration for HTTP server
- [ ] Add health checks for containerized deployment
- [ ] Test Docker deployment scenarios

#### Milestone 6.2: Process Management
- [ ] Create systemd service file for Linux deployment
- [ ] Create PM2 configuration for process management
- [ ] Add graceful shutdown handling
- [ ] Add restart and recovery mechanisms

#### Milestone 6.3: Monitoring and Logging
- [ ] Add structured logging for HTTP requests
- [ ] Add metrics collection (optional)
- [ ] Add health check endpoints
- [ ] Add debugging and diagnostic tools

#### Success Criteria:
- [ ] Production deployment works correctly
- [ ] Process management is reliable
- [ ] Monitoring and logging provide adequate visibility
- [ ] System is resilient to failures

## Persistent Data Requirements

### Session Continuity Data
To ensure continuity when resuming this task:

1. **Implementation Progress Tracking**
   - File: `EXPRESS_IMPLEMENTATION_PROGRESS.json`
   - Content: Phase completion status, milestone checkmarks, test results

2. **Configuration State**
   - Current environment variables and their values
   - Package.json dependencies and versions
   - Any configuration changes made during implementation

3. **Code Architecture Decisions**
   - File structure decisions and rationale
   - API design choices and endpoint specifications
   - Authentication and security implementation details

4. **Test Results and Benchmarks**
   - Performance test results
   - Integration test outcomes
   - Any identified issues or limitations

### Files to Monitor for Changes
- `package.json` - Dependency changes
- `src/main.js` - Core server modifications
- `.env.example` - Configuration updates
- `README.md` - Documentation updates
- `TASKS.md` - Task completion tracking

## Technical Specifications

### API Response Format
```json
{
  "success": true,
  "data": { /* response data */ },
  "error": null,
  "timestamp": "2024-01-01T00:00:00.000Z",
  "requestId": "uuid"
}
```

### Error Response Format
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": { /* additional error context */ }
  },
  "timestamp": "2024-01-01T00:00:00.000Z",
  "requestId": "uuid"
}
```

### Authentication Header Format
```
Authorization: Bearer your-api-token-here
```

## Risk Assessment and Mitigation

### High Risk Items
1. **Breaking existing MCP functionality** - Mitigation: Comprehensive testing
2. **Security vulnerabilities** - Mitigation: Security review and best practices
3. **Performance degradation** - Mitigation: Performance testing and optimization

### Medium Risk Items
1. **Configuration complexity** - Mitigation: Clear documentation and examples
2. **Deployment challenges** - Mitigation: Docker and process management tools
3. **Maintenance overhead** - Mitigation: Good code structure and documentation

## Success Metrics

### Functional Metrics
- [ ] All existing MCP tools work via HTTP API
- [ ] Authentication and authorization function correctly
- [ ] Performance is within 20% of stdio transport
- [ ] VS Code integration works without absolute paths

### Quality Metrics
- [ ] Test coverage > 80%
- [ ] No security vulnerabilities in dependencies
- [ ] Documentation completeness score > 90%
- [ ] Zero critical bugs in production deployment

### User Experience Metrics
- [ ] Setup time reduced by > 50% for VS Code users
- [ ] Configuration complexity reduced significantly
- [ ] Error messages are clear and actionable
- [ ] Troubleshooting documentation is comprehensive

## Next Steps After Completion

1. **Community Feedback** - Gather user feedback on the HTTP API
2. **Performance Optimization** - Fine-tune based on real-world usage
3. **Feature Enhancements** - Add advanced features like webhooks, bulk operations
4. **Integration Examples** - Create examples for other editors and tools
5. **Monitoring Dashboard** - Build a web interface for memory management

---

**Task Created:** 2025-06-01
**Estimated Total Time:** 20-30 hours
**Priority:** High
**Dependencies:** Existing Mem0 MCP Server implementation
**Assignee:** Development Team