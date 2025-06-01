# Express Server Implementation - Quick Start Guide

## Overview
This guide provides a quick reference for implementing the Express server functionality for the Mem0 MCP Server.

## Prerequisites
- Existing Mem0 MCP Server (Node.js implementation) is functional
- Node.js 18+ installed
- Basic understanding of Express.js and MCP protocol

## Quick Implementation Checklist

### 1. Dependencies (5 minutes)
```bash
npm install express cors helmet express-rate-limit jsonwebtoken bcryptjs
npm install --save-dev supertest
```

### 2. Environment Setup (5 minutes)
Add to `.env`:
```env
HTTP_SERVER_ENABLED=true
HTTP_SERVER_PORT=3000
HTTP_SERVER_HOST=0.0.0.0
API_TOKEN=your-secure-token-here
```

### 3. Core Files to Create (Priority Order)

#### High Priority (MVP)
1. `src/server/express.js` - Main Express server
2. `src/server/middleware/auth.js` - Authentication
3. `src/server/routes/memory.js` - API routes
4. `src/services/MemoryService.js` - Shared business logic

#### Medium Priority
5. `src/server/middleware/errorHandler.js` - Error handling
6. `test/http-api.test.js` - API testing
7. `docs/HTTP_API.md` - API documentation

#### Low Priority
8. `examples/http-server-config.json` - VS Code config
9. Process management files (systemd, PM2)

### 4. Key API Endpoints to Implement

```javascript
POST   /api/memory/save      // Save new memory
GET    /api/memory/all       // Get all memories
GET    /api/memory/search    // Search memories
GET    /api/memory/:id       // Get specific memory
PUT    /api/memory/:id       // Update memory
DELETE /api/memory/:id       // Delete memory
GET    /api/health           // Health check
```

### 5. Integration Points

#### Modify `src/main.js`:
```javascript
// Add HTTP server startup logic
if (process.env.HTTP_SERVER_ENABLED === 'true') {
  const { startExpressServer } = await import('./server/express.js');
  await startExpressServer(mcpServer);
}
```

#### Extract shared logic to `src/services/MemoryService.js`:
```javascript
export class MemoryService {
  constructor(storageProvider, mem0Client) {
    this.storage = storageProvider;
    this.mem0 = mem0Client;
  }
  
  async saveMemory(userId, text, metadata) {
    // Shared logic for both MCP and HTTP
  }
  
  // ... other methods
}
```

## Testing Strategy

### 1. Unit Tests
```bash
npm test -- test/http-api.test.js
```

### 2. Integration Test
```bash
# Terminal 1: Start server
HTTP_SERVER_ENABLED=true npm start

# Terminal 2: Test API
curl -H "Authorization: Bearer your-token" \
     -H "Content-Type: application/json" \
     -d '{"text":"Test memory"}' \
     http://localhost:3000/api/memory/save
```

### 3. VS Code Integration Test
Update VS Code MCP config:
```json
{
  "mem0-nodejs": {
    "transport": "sse",
    "url": "http://localhost:3000",
    "headers": {
      "Authorization": "Bearer your-token"
    }
  }
}
```

## Common Issues and Solutions

### Issue: Port Already in Use
```bash
# Find process using port 3000
lsof -i :3000
# Kill process
kill -9 <PID>
```

### Issue: Authentication Fails
- Check API_TOKEN in .env matches request header
- Ensure Bearer token format: `Authorization: Bearer <token>`

### Issue: CORS Errors
- Add your origin to CORS_ORIGINS environment variable
- Check browser developer tools for specific CORS error

## Performance Considerations

### Expected Latency
- HTTP API: +5-20ms vs stdio transport
- File operations: 10-50ms (dominant factor)
- Authentication: <1ms

### Memory Usage
- Express server: ~10-20MB additional
- Per request: ~1-5MB (temporary)

### Optimization Tips
1. Use connection pooling for database storage
2. Implement response caching for read operations
3. Add request compression middleware
4. Use streaming for large memory exports

## Security Checklist

- [ ] API token is cryptographically secure (32+ characters)
- [ ] Rate limiting is enabled and configured appropriately
- [ ] CORS origins are restricted to known domains
- [ ] Security headers are set via Helmet
- [ ] Input validation on all endpoints
- [ ] Error messages don't leak sensitive information

## Deployment Options

### Development
```bash
HTTP_SERVER_ENABLED=true npm run dev
```

### Production (PM2)
```bash
pm2 start ecosystem.config.js
```

### Docker
```bash
docker build -t mem0-mcp-http .
docker run -p 3000:3000 --env-file .env mem0-mcp-http
```

## Monitoring

### Health Check
```bash
curl http://localhost:3000/api/health
```

### Logs
```bash
# View logs in development
tail -f logs/app.log

# PM2 logs
pm2 logs mem0-mcp

# Docker logs
docker logs <container-id>
```

## Next Steps After Basic Implementation

1. **Performance Testing**: Use `ab` or `wrk` for load testing
2. **Security Audit**: Run `npm audit` and security scanning
3. **Documentation**: Complete API documentation with examples
4. **Monitoring**: Add metrics collection and alerting
5. **CI/CD**: Set up automated testing and deployment

## Resources

- [Express.js Documentation](https://expressjs.com/)
- [MCP Protocol Specification](https://modelcontextprotocol.io/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [API Security Checklist](https://github.com/shieldfy/API-Security-Checklist)

---

**Last Updated**: 2025-06-01  
**Estimated Implementation Time**: 20-30 hours  
**Difficulty Level**: Intermediate