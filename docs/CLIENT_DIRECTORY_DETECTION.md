# Client Directory Detection for Memory Storage

## Overview

The Mem0 MCP Server now automatically detects the client's working directory and stores memory files in the active project directory instead of the server's directory.

## How It Works

When `STORAGE_PROVIDER=local`, the server uses multiple detection methods to identify the client's working directory:

### Detection Methods (in order of priority)

1. **VSCODE_CWD** - VSCode-specific environment variable
2. **PWD** - Unix shell working directory (if different from server's CWD)
3. **INIT_CWD** - npm/yarn invocation directory (if different from server's CWD)
4. **PROJECT_DIR** - Custom environment variable for explicit project directory
5. **Project file detection** - Searches parent directories for common project indicators

### Project Indicators

The server looks for these files to identify project directories:
- `package.json` (Node.js)
- `pyproject.toml` (Python)
- `Cargo.toml` (Rust)
- `go.mod` (Go)
- `pom.xml` (Java/Maven)
- `.git` (Git repository)
- `.vscode` (VSCode workspace)

## Configuration

### Environment Variables

- `LOCAL_STORAGE_DIR` - Directory name for memory files (default: `.Mem0-Files`)
- `PROJECT_DIR` - Explicit project directory path (overrides auto-detection)
- `VSCODE_CWD` - VSCode working directory (automatically set by VSCode)

### Examples

#### Default behavior (auto-detection)
```bash
# Memory files stored in: /path/to/your/project/.Mem0-Files
STORAGE_PROVIDER=local
```

#### Explicit project directory
```bash
# Memory files stored in: /path/to/your/project/.Mem0-Files
STORAGE_PROVIDER=local
PROJECT_DIR=/path/to/your/project
```

#### Custom storage directory name
```bash
# Memory files stored in: /path/to/your/project/.memories
STORAGE_PROVIDER=local
LOCAL_STORAGE_DIR=.memories
```

#### Absolute storage path
```bash
# Memory files stored in: /absolute/path/to/memories
STORAGE_PROVIDER=local
LOCAL_STORAGE_DIR=/absolute/path/to/memories
```

## Fallback Behavior

If client directory detection fails, the server falls back to storing memory files relative to the server's working directory (original behavior).

## Testing

You can test the detection by setting environment variables:

```bash
# Test with VSCode environment
VSCODE_CWD=/your/project/path node src/main.js

# Test with custom project directory
PROJECT_DIR=/your/project/path node src/main.js
```

## Logging

The server logs information about storage directory detection:

- `INFO: Using client working directory for storage: /path/to/client`
- `INFO: Memory files will be stored in: /path/to/client/.Mem0-Files`
- `WARN: Could not detect client working directory, using server directory`