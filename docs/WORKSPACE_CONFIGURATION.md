# Dynamic Workspace Configuration for Memory Storage

## Automatic Workspace Detection

The Mem0 MCP Server now automatically detects your current VSCode workspace and stores memory files in the root of your active project directory.

### How It Works

When you're working on a project like:
```
/Users/sonjuane/Dropbox/Projects/WEB-COMPONENTS/markdown-component/version-4/
```

Memory files will be automatically stored in:
```
/Users/sonjuane/Dropbox/Projects/WEB-COMPONENTS/markdown-component/version-4/.Mem0-Files/
```

### HTTP-Only Setup (Recommended)

Since this is an HTTP-only server, the recommended approach is:

#### 1. Start the Server with Workspace Context

```bash
# Navigate to the server directory
cd /path/to/mem0_mcp_server

# Start server with your current workspace
VSCODE_WORKSPACE_FOLDER=/Users/sonjuane/Dropbox/Projects/WEB-COMPONENTS/markdown-component/version-4 npm start
```

#### 2. Use HTTP API Calls

Your applications/extensions should make HTTP calls to the running server:

```bash
# Save a memory
curl -X POST http://localhost:8484/api/memory/save \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-api-token" \
  -d '{"text": "Your memory here", "userId": "vscode-user"}'

# Search memories
curl "http://localhost:8484/api/memory/search?query=your-search&userId=vscode-user" \
  -H "Authorization: Bearer your-api-token"
```

#### 3. VSCode Extension Integration

If building a VSCode extension:

```javascript
// Get current workspace
const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;

// Start server with workspace context (if not already running)
const { spawn } = require('child_process');
const serverProcess = spawn('npm', ['start'], {
  env: {
    ...process.env,
    VSCODE_WORKSPACE_FOLDER: workspaceFolder,
    HOST: '0.0.0.0',
    PORT: '8484',
    API_TOKEN: 'your-secure-token'
  },
  cwd: '/path/to/mem0_mcp_server'
});

// Make HTTP calls to save/retrieve memories
const saveMemory = async (text) => {
  const response = await fetch('http://localhost:8484/api/memory/save', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer your-secure-token'
    },
    body: JSON.stringify({ text, userId: 'vscode-user' })
  });
  return response.json();
};
```

### Manual Override (Optional)

You can override workspace detection by setting `PROJECT_DIR`:

```bash
PROJECT_DIR=/path/to/specific/project npm start
```

## How to Find Your VSCode MCP Configuration

1. **For VSCode with Roo/Claude Desktop**: Look for a file like:
   - `~/.config/Code/User/globalStorage/rooveterinaryinc.roo-cline/settings/cline_mcp_settings.json`
   - Or check VSCode settings for MCP server configurations

2. **For Claude Desktop**: Look for:
   - `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS)
   - `%APPDATA%/Claude/claude_desktop_config.json` (Windows)

## Verification

After updating your configuration:

1. Restart VSCode or reload the MCP server
2. Save a memory using the Mem0 MCP server
3. Check that the `.Mem0-Files` directory appears in your project root: `/Users/sonjuane/Dropbox/Projects/LAB-EX-AI/.Mem0-Files`

## Current Memory Location

If you want to find where your memories are currently stored, check:
- `/Users/sonjuane/Dropbox/Projects/LAB-EX-AI/_MCPS/mem0_mcp_server/.Mem0-Files`

You can move these files to your desired location if needed.