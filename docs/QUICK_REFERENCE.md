# Mem0 MCP Server - Quick Reference

## 🚀 Quick Start Commands

### Start Server
```bash
# HTTP Server (recommended for VS Code)
npm run start:http

# Both stdio and HTTP
npm run start:both

# Development mode with auto-restart
npm run dev:http
```

### Health Check
```bash
curl http://localhost:3000/api/health
```

## 🔧 VS Code Configuration

Add to Roo Code MCP servers settings:
```json
{
  "mem0-http": {
    "transport": "sse",
    "url": "http://localhost:3000",
    "headers": {
      "Authorization": "Bearer your-api-token"
    }
  }
}
```

## 💾 Memory Commands in VS Code

```bash
# Save a memory
@mem0-http save_memory "Your memory text here"

# Save with specific user ID (project-specific)
@mem0-http save_memory "Project uses Next.js" --userId="my-nextjs-app"

# Search memories
@mem0-http search_memories "search term"

# Get all memories
@mem0-http get_all_memories

# Get memories for specific user
@mem0-http get_all_memories --userId="my-nextjs-app"
```

## 🌐 HTTP API Endpoints

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

## 🔐 Authentication

Include in all API requests:
```
Authorization: Bearer your-api-token
```

## 📁 Memory Storage Locations

### Default Location
```
~/.Mem0-Files/users/vscode-user/
```

### Project-Specific Location
```
./your-project/.Mem0-Files/users/your-user-id/
```

## ⚙️ Environment Variables

```env
# Required for HTTP server
HTTP_SERVER_ENABLED=true
HTTP_SERVER_PORT=3000
API_TOKEN=your-secure-token

# Optional
STORAGE_PROVIDER=local
DEFAULT_USER_ID=vscode-user
CORS_ORIGINS=http://localhost:*
```

## 🐛 Troubleshooting

### Server Won't Start
```bash
# Check if port is in use
lsof -i :3000

# Use different port
HTTP_SERVER_PORT=3001 npm run start:http
```

### Authentication Errors
- Verify API token matches in `.env` and VS Code config
- Check server logs for detailed error messages

### VS Code Not Connecting
- Restart VS Code after configuration changes
- Check Developer Console for errors
- Verify server is running: `curl http://localhost:3000/api/health`

### Test API Directly
```bash
# Save memory via curl
curl -X POST http://localhost:3000/api/memory/save \
  -H "Authorization: Bearer your-token" \
  -H "Content-Type: application/json" \
  -d '{"text": "Test memory"}'

# Search memories via curl
curl -H "Authorization: Bearer your-token" \
  "http://localhost:3000/api/memory/search?query=test"
```

## 📖 Full Documentation

- [Complete VS Code Setup Guide](VSCODE_SETUP_GUIDE.md)
- [HTTP API Reference](HTTP_API.md)
- [Main README](../README.md)

## 💡 Pro Tips

1. **Project-Specific Memories**: Use different `userId` values for different projects
2. **Persistent Server**: Use PM2 or similar to keep server running
3. **Security**: Use strong, unique API tokens
4. **Backup**: Memory files are stored as JSON - easy to backup/restore
5. **Multiple Projects**: Run separate server instances on different ports if needed

---

**Need Help?** See the [Complete Setup Guide](VSCODE_SETUP_GUIDE.md) for detailed instructions.