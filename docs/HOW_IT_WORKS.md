# How does Mem0 know what memories to save?

The Mem0 MCP Server provides the **tools** for memory storage, but the **decision of what to save** is made by the LLM (like Claude, GPT-4, etc.) that's using the server. Here's how it works:

## How LLMs Decide What to Save

### 1. **LLM-Driven Decision Making**
The LLM using the Mem0 MCP Server makes intelligent decisions about what information is worth storing based on:

- **Context relevance** - Information that seems important for future conversations
- **User preferences** - Things the user explicitly mentions wanting to remember
- **Project-specific details** - Code patterns, architectural decisions, configuration details
- **Learning patterns** - Repeated questions or topics that come up frequently

### 2. **Typical Memory Scenarios**

**What LLMs Usually Save:**
```
✅ "Remember that this project uses ESM modules and TypeScript"
✅ "The user prefers functional programming patterns"
✅ "Database connection string is stored in .env file"
✅ "User's coding style: always use const/let, never var"
✅ "This API uses Bearer token authentication"
```

**What LLMs Usually Ignore:**
```
❌ Temporary debugging output
❌ Generic code examples from documentation
❌ One-time error messages
❌ Routine acknowledgments ("OK", "Thanks")
❌ System-generated logs
```

### 3. **User Guidance Strategies**

**Explicit Instructions:**
```
"Remember that I prefer using pnpm instead of npm for this project"
"Save this API endpoint configuration for future reference"
"Don't save debugging output, only save architectural decisions"
```

**Implicit Learning:**
The LLM learns from patterns:
- If you repeatedly ask about the same configuration, it might save it
- If you correct the same mistake multiple times, it might remember the correction
- If you mention preferences consistently, it might save them

### 4. **Memory Categories**

LLMs typically categorize memories into:

**Project Context:**
- Technology stack choices
- Architecture patterns
- Configuration preferences
- Coding standards

**User Preferences:**
- Preferred tools and libraries
- Coding style guidelines
- Communication preferences
- Workflow patterns

**Domain Knowledge:**
- Business rules
- API specifications
- Database schemas
- Integration details

### 5. **Best Practices for Users**

**To Encourage Good Memory Saving:**
```
✅ "Remember this pattern for future API implementations"
✅ "Save this configuration as the standard for this project"
✅ "This is important for understanding our authentication flow"
```

**To Prevent Unnecessary Saving:**
```
✅ "This is just a temporary debug - don't save it"
✅ "Just for this one-time task"
✅ "Ignore this error, it's already fixed"
```

### 6. **Memory Quality Control**

The LLM should ideally:
- **Filter out noise** - Temporary, irrelevant, or duplicate information
- **Synthesize information** - Combine related facts into coherent memories
- **Prioritize relevance** - Save information that's likely to be useful later
- **Respect user intent** - Follow explicit save/don't-save instructions

### 7. **Current Implementation Note**

In the current Mem0 MCP Server implementation, the memory processing is simplified (the Mem0 client returns the original text). When full Mem0 integration is added, it will include:

- **Intelligent extraction** - LLM-powered fact extraction from conversations
- **Deduplication** - Avoiding redundant memories
- **Semantic organization** - Grouping related memories
- **Relevance scoring** - Prioritizing important information

## Summary

The key is that the **LLM acts as the intelligent filter**, deciding what's worth remembering based on context, user behavior, and explicit instructions. The Mem0 MCP Server simply provides the reliable storage and retrieval mechanism for those decisions.

The Express.js HTTP server implementation we just completed makes this process even more accessible by allowing easy integration with VS Code and other tools without complex file path configurations.