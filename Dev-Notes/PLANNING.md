# Mem0 Local MCP Server

## Summary / Features
Create a local Mem0 MCP server using node js and esm written in vanilla javascript.  

The MCP will be hosted locally and be accessible to to any project.  The Mem0 MCP server will have the following features:

- Creates a folder in Project Root Directory called '.Mem0-Files'
- Stores any memories for the project as a file or files in this folder

## Instructions
Please review this git repo [mcp-mem0](./mcp-mem0/) carefully.  The repo is written in python and run in docker and would like to convert it to node js (esm modules) and also run it in docker.  

I would like to create an API for the Mem0 MCP server so the way it saves memories can be configured separately. The API would be based on the CRUD operations required for the MCP server to Read/Write/Delete and Edit memory data.

This current repo is designed to save memories to a postgres database this should be saved as a configuration file or plugin.  I would like to create a another configuration plugin or file which will configure the Mem0 MCP Server to save memories to a local folder in the root directory of a project.  

Please carefully review the existing repo and create a file called TASKS.md.  Create a list of tasks needed logically grouping them.  This list will be used to determine progress of the project.

Example:
- [ ] Unchecked Task
- [x] Checked Task






