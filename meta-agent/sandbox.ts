import ms from "ms";
import { Sandbox } from "@vercel/sandbox";
import { setTimeout } from "timers/promises";
import { createMcpPrompt } from "./create-mcp-prompt";
import { experimental_createMCPClient as createMCPClient } from "ai";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

if (!process.env.ANTHROPIC_API_KEY) {
  throw new Error("ANTHROPIC_API_KEY is not set");
}

declare global {
  var activeSandbox: SandboxEnv | undefined;
}

interface SandboxEnv {
  sandbox: Sandbox;
  getUrl: () => Promise<string>;
  index: number;
}

let index = 0;
export async function createSandbox(): Promise<SandboxEnv | undefined> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is not set");
  }
  const sandbox = await Sandbox.create({
    source: {
      url: "https://github.com/uncurated-tests/mcp-in-sandbox.git",
      type: "git",
    },
    resources: { vcpus: 4 },
    // Timeout in milliseconds: ms('10m') = 600000
    // Defaults to 5 minutes. The maximum is 45 minutes.
    timeout: ms("20m"),
    ports: [3000],
    runtime: "node22",
  });

  console.log(`Installing dependencies...`);
  const install = await sandbox.runCommand({
    cmd: "pnpm",
    args: ["i"],
    stderr: process.stderr,
    stdout: process.stdout,
  });

  if (install.exitCode != 0) {
    console.log("installing packages failed");
    sandbox.stop();
    return;
  }

  await sandbox.writeFiles([
    {
      path: "~/.claude/settings.json",
      content: Buffer.from(
        JSON.stringify({
          apiKeyHelper: "~/.claude/anthropic_key.sh",
        })
      ),
    },
    {
      path: "~/.claude/anthropic_key.sh",
      content: Buffer.from(
        `#!/bin/bash
        echo $ANTHROPIC_API_KEY
        `
      ),
    },
  ]);
  const chmod = await sandbox.runCommand({
    cmd: "chmod",
    args: ["+x", "~/.claude/anthropic_key.sh"],
    stderr: process.stderr,
    stdout: process.stdout,
  });
  if (chmod.exitCode != 0) {
    console.log("setting permissions failed");
    sandbox.stop();
    return;
  }

  await setTimeout(500);
  let exposedUrl: string | null = null;
  return {
    index,
    getUrl: async () => {
      if (exposedUrl) {
        return exposedUrl;
      }
      console.log(`Starting the development server...`);
      await sandbox.runCommand({
        cmd: "pnpm",
        args: ["run", "dev"],
        stderr: process.stderr,
        stdout: process.stdout,
        detached: true,
      });
      const url = sandbox.domain(3000);
      const before = Date.now();
      while (true) {
        if (Date.now() - before > 10000) {
          throw new Error("Sandbox did not start in time");
        }
        const response = await fetch(`${url}/ping.html`);
        if (response.status === 200) {
          break;
        }
        await setTimeout(100);
      }
      console.log(`Sandbox URL: ${url}`);
      exposedUrl = url;
      return url;
    },
    sandbox,
  };
}

export async function createMcpTool(task: string, toolName: string) {
  return createMcpToolInternal(task, toolName);
}

export async function getCurrentMcpTools(
  sandbox: SandboxEnv | undefined = undefined
) {
  console.log("Getting current MCP tools", globalThis.activeSandbox?.index);
  const env = sandbox || globalThis.activeSandbox || (await createSandbox());
  globalThis.activeSandbox = env;
  if (!env) {
    return {};
  }
  const url = await env.getUrl();
  const mcpClient = await createMcpClient(`${url}/mcp`);
  const tools = await mcpClient.tools();
  delete tools.echo;
  console.log("Tools", tools);
  return tools;
}

export async function createMcpToolInternal(task: string, toolName: string) {
  const env = globalThis.activeSandbox || (await createSandbox());
  globalThis.activeSandbox = env;
  if (!env) {
    return { success: false, error: "Failed to create sandbox" };
  }
  const prompt = createMcpPrompt(task, toolName);
  console.log("Running claude code", prompt);
  const response = await env.sandbox.runCommand({
    cmd: "node_modules/@anthropic-ai/claude-code/cli.js",
    args: ["--dangerously-skip-permissions", "-p", prompt],
    stderr: process.stderr,
    stdout: process.stdout,
    env: {
      ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || "",
    },
  });
  if (response.exitCode != 0) {
    console.log("Failed to create MCP tool", response);
    return { success: false, error: "Failed to create MCP tool" };
  }
  await env.sandbox.runCommand({
    cmd: "git",
    args: ["add", "."],
    stderr: process.stderr,
    stdout: process.stdout,
  });
  await env.sandbox.runCommand({
    cmd: "git",
    args: ["diff", "HEAD"],
    stderr: process.stderr,
    stdout: process.stdout,
  });
  console.log("Creating MCP client");
  const tools = await getCurrentMcpTools(env);
  return {
    success: true,
    error: null,
    tools,
  };
}

async function createMcpClient(urlString: string) {
  const url = new URL(urlString);
  return createMCPClient({
    transport: new StreamableHTTPClientTransport(url),
  });
}
