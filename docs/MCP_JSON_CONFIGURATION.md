# MCP JSON Configuration

The Mem0 MCP Server now supports reading configuration from an `mcp.json` file in your VS Code project directory. This allows you to specify custom storage providers and storage directories directly in your MCP client configuration.

## Configuration File Location

The server will look for `mcp.json` in the following locations (in order of priority):

1. `PROJECT_DIR` environment variable + `/mcp.json`
2. `VSCODE_WORKSPACE_FOLDER` environment variable + `/mcp.json`
3. `VSCODE_CWD` environment variable + `/mcp.json`
4. `PWD` environment variable + `/mcp.json` (if different from server directory)
5. `INIT_CWD` environment variable + `/mcp.json` (if different from server directory)
6. Detected VS Code workspace directory + `/mcp.json`
7. Current working directory + `/mcp.json`
8. Custom path via `MCP_CONFIG_PATH` environment variable

## Configuration Format

The `mcp.json` file should follow the standard MCP client configuration format with additional custom fields:

```json
{
  "mcpServers": {
    "mem0-sse": {
      "transport": "sse",
      "url": "http://localhost:8484/sse",
      "headers": {
        "Authorization": "Bearer 550EA5B7-4C7B-4C17-9BF7-5A6B6D232FA2"
      },
      "description": "Mem0 MCP Server via SSE transport",
      "storage_provider": "local",
      "storage_directory": "/Users/sonjuane/Dropbox/Projects/WEB-COMPONENTS/markdown-component/version-4",
      "default_user_id": "project-user",
      "max_search_results": 10,
      "alwaysAllow": [
        "get_all_memories",
        "save_memory"
      ]
    }
  }
}
```

## Supported Custom Fields

### `storage_provider`
- **Type**: `string`
- **Values**: `"local"` or `"postgresql"`
- **Description**: Specifies which storage provider to use
- **Default**: Falls back to `STORAGE_PROVIDER` environment variable or `"local"`

### `storage_directory`
- **Type**: `string`
- **Description**: Custom path where memory files will be stored
- **Example**: `"/Users/username/Projects/my-project/memories"`
- **Behavior**: 
  - Memories will be stored in `{storage_directory}/.Mem0-files/`
  - Directory will be created automatically if it doesn't exist
  - Must be writable by the server process
- **Default**: Falls back to automatic detection or `LOCAL_STORAGE_DIR` environment variable

### `default_user_id`
- **Type**: `string`
- **Description**: Default user ID for memory operations
- **Default**: Falls back to `DEFAULT_USER_ID` environment variable or `"user"`

### `max_search_results`
- **Type**: `number`
- **Description**: Maximum number of search results to return
- **Default**: Falls back to `MAX_SEARCH_RESULTS` environment variable or `10`

## Configuration Priority

Configuration values are applied in the following order (highest to lowest priority):

1. **MCP JSON Configuration** - Values from `mcp.json`
2. **Environment Variables** - Standard environment variables
3. **Default Values** - Built-in defaults

## Example Usage

1. **Create `mcp.json` in your VS Code project root:**

```json
{
  "mcpServers": {
    "mem0-sse": {
      "transport": "sse",
      "url": "http://localhost:8484/sse",
      "headers": {
        "Authorization": "Bearer your-token-here"
      },
      "description": "Mem0 MCP Server for this project",
      "storage_provider": "local",
      "storage_directory": "/path/to/your/project/memories"
    }
  }
}
```

2. **Start the Mem0 MCP Server:**

```bash
node src/main.js
```

3. **The server will automatically:**
   - Detect your VS Code workspace
   - Read the `mcp.json` configuration
   - Create the storage directory if needed
   - Store memories in `{storage_directory}/.Mem0-files/`

## Validation

The server performs the following validations:

- **Storage Directory**: Checks if the directory exists or can be created
- **Write Permissions**: Verifies the server can write to the storage directory
- **Configuration Format**: Validates the JSON structure

If validation fails, the server will fall back to environment variables or defaults and log appropriate warnings.

## Benefits

- **Project-Specific Storage**: Each project can have its own memory storage location
- **Version Control**: Configuration can be committed to your project repository
- **Team Collaboration**: Shared configuration across team members
- **Flexibility**: Override any server setting per project
- **Automatic Detection**: Works seamlessly with VS Code workspace detection

## Troubleshooting

### Configuration Not Found
- Ensure `mcp.json` is in your project root directory
- Check VS Code workspace folder detection in server logs
- Verify file permissions

### Storage Directory Issues
- Ensure the specified directory path is valid
- Check write permissions for the server process
- Review server logs for validation errors

### Environment Variable Conflicts
- MCP JSON configuration takes precedence over environment variables
- Use environment variables for server-wide defaults
- Use MCP JSON for project-specific overrides