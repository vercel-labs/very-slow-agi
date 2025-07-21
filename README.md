# Very Slow AGI

Very Slow AGI is an AI with a single very special tool: `generateToolToSolveTask`. This tool allows the AI to make new tools. Think of it as [Code Interpreter](https://platform.openai.com/docs/assistants/tools/code-interpreter) on very strong steroids. Because this tools spaws a real VM (based on [Vercel Sandbox](https://vercel.com/docs/vercel-sandbox)) and then runs **Claude Code** on the VM to generate the desired code. The tools generated on the Sandbox are then exposed as an MCP server to the original AI, such that it can cal it directly.

<img width="1055" height="632" alt="Graphic showing how very slow AGI works" src="https://github.com/user-attachments/assets/4094b454-acf5-44b7-bf67-c87212b8100f" />

There is a lot of code in this repository (it's a fork of [Chat SDK](https://chat-sdk.dev/)). But you can ignore it all, and [start your code reading journey here](https://github.com/vercel-labs/very-slow-agi/blob/main/meta-agent/meta-agent.ts).
