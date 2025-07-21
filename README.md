# Very Slow AGI

Very Slow AGI is an agent with a single very special tool: `generateToolToSolveTask`. This tool allows the agent to make new tools. Think of it as [Code Interpreter](https://platform.openai.com/docs/assistants/tools/code-interpreter) on very strong steroids. It spaws a real VM (based on [Vercel Sandbox](https://vercel.com/docs/vercel-sandbox)) and then runs **Claude Code** on the VM to generate the desired code. The tools generated on the Sandbox are then exposed as an MCP server to the original agent, such that it can call it directly.

<img width="1055" height="632" alt="Graphic showing how very slow AGI works" src="https://github.com/user-attachments/assets/4094b454-acf5-44b7-bf67-c87212b8100f" />

There is a lot of code in this repository (it's a fork of [Chat SDK](https://chat-sdk.dev/)). But you can ignore it all, and [start your code reading journey here](https://github.com/vercel-labs/very-slow-agi/blob/main/meta-agent/meta-agent.ts).

## Persist to Git

There is a second tool to push the generated code to a git repository. [Over here you can see the tools I generated](https://github.com/vercel-labs/very-slow-agi-sandbox/blob/main/app/%5Btransport%5D/route.ts) while playing around with this (and yes `count_letter_occurrences` enables LLMs to count the Rs in strawberry, hence the name of this project). 

## Why

Running Claude Code is excruciatingly slow, yet it is also insanely powerful. This project provides an eye into a future where "LLM with tools in a loop" can do almost anything. And while it might be slow, computers are relentless: They'll keep running that loop until they figured it out.
