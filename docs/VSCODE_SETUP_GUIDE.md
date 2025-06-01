# VS Code Setup Guide: Mem0 MCP Server with HTTP

This guide provides step-by-step instructions to set up the Mem0 MCP Server with HTTP transport for use with Roo Code in VS Code. This setup allows you to save memories directly into your current project directory.

## Prerequisites

- **Node.js** (version 18 or higher)
- **VS Code** with the **Roo Code extension** installed
- **Git** (for cloning the repository)

## Step 1: Install and Setup the Mem0 MCP Server

### 1.1 Clone the Repository

```bash
# Clone the repository to a permanent location (not in your project folder)
git clone https://github.com/your-username/mem0_mcp_server_nodejs.git
cd mem0_mcp_server_nodejs
```

### 1.2 Install Dependencies

```bash
# Install all required dependencies
npm install
```

### 1.3 Configure Environment Variables

```bash
# Copy the example environment file
cp .env.example .env
```

Edit the `.env` file with your preferred settings:

```env
# HTTP Server Configuration
HTTP_SERVER_ENABLED=true
HTTP_SERVER_PORT=3000
HTTP_SERVER_HOST=0.0.0.0

# Security - IMPORTANT: Change this to a secure token
API_TOKEN=your-secure-api-token-here

# Storage Configuration
STORAGE_PROVIDER=local
DEFAULT_USER_ID=vscode-user

# Optional: CORS and Rate Limiting
CORS_ORIGINS=http://localhost:*,https://localhost:*
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

**⚠️ Important:** Replace `your-secure-api-token-here` with a strong, unique token (e.g., `mem0-token-abc123xyz789`).

## Step 2: Start the Mem0 MCP Server

### 2.1 Start the HTTP Server

```bash
# Start the server with HTTP enabled
npm run start:http
```

You should see output similar to:
```
[INFO] Express server started on http://0.0.0.0:3000
[INFO] Available endpoints:
[INFO]   GET  /                    - API information
[INFO]   GET  /api/health          - Health check
[INFO]   POST /api/memory/save     - Save memory
[INFO]   GET  /api/memory/all      - Get all memories
[INFO]   GET  /api/memory/search   - Search memories
```

### 2.2 Verify the Server is Running

Open a new terminal and test the server:

```bash
# Test the health endpoint
curl http://localhost:3000/api/health
```

You should get a response like:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2025-06-01T21:00:00.000Z"
  }
}
```

## Step 3: Configure Roo Code in VS Code

### 3.1 Open VS Code Settings

1. Open **VS Code**
2. Press `Cmd/Ctrl + ,` to open Settings
3. Search for **"roo"** in the settings search bar
4. Look for **"Roo Code"** settings section

### 3.2 Configure MCP Servers

1. Find the **"MCP Servers"** configuration in Roo Code settings
2. Click **"Edit in settings.json"** or add the configuration manually

### 3.3 Add the Mem0 Server Configuration

Add this configuration to your Roo Code MCP servers settings:

```json
{
  "mem0-http": {
    "transport": "sse",
    "url": "http://localhost:3000",
    "headers": {
      "Authorization": "Bearer your-secure-api-token-here"
    }
  }
}
```

**⚠️ Important:** Replace `your-secure-api-token-here` with the same token you used in the `.env` file.

### 3.4 Alternative: Direct Configuration

If you prefer to configure it directly in VS Code settings JSON:

1. Press `Cmd/Ctrl + Shift + P`
2. Type "Preferences: Open User Settings (JSON)"
3. Add this to your settings:

```json
{
  "roo.mcpServers": {
    "mem0-http": {
      "transport": "sse",
      "url": "http://localhost:3000",
      "headers": {
        "Authorization": "Bearer your-secure-api-token-here"
      }
    }
  }
}
```

## Step 4: Configure Memory Storage Location

### 4.1 Project-Specific Memory Storage

To save memories in your current project directory, you have two options:

**Option A: Set Project-Specific User ID (Recommended)**

When using the memory tools, specify a project-specific user ID:

```
@mem0-http save_memory "This project uses React with TypeScript" --userId="my-react-project"
```

**Option B: Start Server in Project Directory**

For automatic project-specific storage:

1. Copy the Mem0 server to your project or create a symlink
2. Start the server from within your project directory:

```bash
# From your project directory
cd /path/to/your/project
node /path/to/mem0_mcp_server_nodejs/src/main.js
```

This will create a `.Mem0-Files` directory in your current project.

## Step 5: Test the Setup

### 5.1 Restart VS Code

1. Close VS Code completely
2. Reopen VS Code
3. Open any project or file

### 5.2 Test Memory Operations

Try these commands in Roo Code:

```
# Save a memory
@mem0-http save_memory "This project uses ESM modules and stores data locally"

# Search memories
@mem0-http search_memories "ESM modules"

# Get all memories
@mem0-http get_all_memories
```

### 5.3 Verify Memory Storage

Check that memories are being saved:

```bash
# If using default location
ls -la ~/.Mem0-Files/users/vscode-user/

# If using project-specific location
ls -la ./.Mem0-Files/users/your-user-id/
```

## Step 6: Usage Examples

### 6.1 Saving Project Information

```
@mem0-http save_memory "This is a Next.js project with TypeScript, using Tailwind CSS for styling"
@mem0-http save_memory "Database connection is configured in lib/db.ts using Prisma ORM"
@mem0-http save_memory "API routes are in pages/api/ and use NextAuth for authentication"
```

### 6.2 Searching for Information

```
@mem0-http search_memories "database"
@mem0-http search_memories "authentication"
@mem0-http search_memories "styling"
```

### 6.3 Project-Specific Memories

```
@mem0-http save_memory "Preferred coding style: functional components with hooks" --userId="my-react-app"
@mem0-http search_memories "coding style" --userId="my-react-app"
```

## Troubleshooting

### Common Issues

**1. Server Not Starting**
```bash
# Check if port 3000 is already in use
lsof -i :3000

# Use a different port
HTTP_SERVER_PORT=3001 npm run start:http
```

**2. Authentication Errors**
- Verify the API token matches in both `.env` and VS Code configuration
- Ensure the token doesn't contain special characters that need escaping

**3. VS Code Not Connecting**
- Restart VS Code after configuration changes
- Check the VS Code Developer Console for error messages
- Verify the server URL is accessible: `curl http://localhost:3000/api/health`

**4. Memories Not Saving**
- Check server logs for error messages
- Verify write permissions in the storage directory
- Test API directly: `curl -X POST http://localhost:3000/api/memory/save -H "Authorization: Bearer your-token" -H "Content-Type: application/json" -d '{"text":"test memory"}'`

### Getting Help

1. **Check Server Logs** - Look at the terminal where the server is running
2. **Test API Directly** - Use curl commands to test the HTTP API
3. **Check VS Code Console** - Open Developer Tools in VS Code to see error messages
4. **Verify Configuration** - Double-check all configuration files and tokens

## Advanced Configuration

### Running as a Service

For production use, consider running the server as a system service:

**Using PM2:**
```bash
# Install PM2 globally
npm install -g pm2

# Start the server with PM2
pm2 start npm --name "mem0-server" -- run start:http

# Save PM2 configuration
pm2 save
pm2 startup
```

### Multiple Projects

To use different memory stores for different projects:

1. Use project-specific user IDs in your commands
2. Or run separate server instances on different ports for each project

### Security Considerations

1. **Use Strong Tokens** - Generate cryptographically secure API tokens
2. **Network Security** - Consider firewall rules if exposing beyond localhost
3. **File Permissions** - Ensure proper permissions on memory storage directories

---

## Quick Reference

**Start Server:** `npm run start:http`
**Health Check:** `curl http://localhost:3000/api/health`
**Save Memory:** `@mem0-http save_memory "your memory text"`
**Search:** `@mem0-http search_memories "search term"`
**Get All:** `@mem0-http get_all_memories`

For complete API documentation, see [`HTTP_API.md`](HTTP_API.md).