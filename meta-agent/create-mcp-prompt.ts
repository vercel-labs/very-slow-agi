export function createMcpPrompt(task: string, toolName: string) {
  return `
Your job is to create one or more MCP tools for the given task given below.
Use 'server.tool' in 'app/[transport]/route.ts' to register a new MCP method named '${toolName}'.
The 'server' variable is of the type McpServer as defined in Anthropic's MCP SDK for TypeScript.
Use 'zod' to define schema for arguments and return values. Use structured
return values where possible.
Use Zod's 'describe' to describe the schema in a way that is easy to understand for LLMs.
For example, give examples of the input and output, and provide a description of the tool including
examples for what it might be used for.
You do not have access to any APIs key. If you need to access the internet, it must be to
publicly available HTTP APIs or scraping from web pages.
You can install npm packages using the 'pnpm add' command.

Task: ${task}`;
}
