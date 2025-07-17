import { streamText, tool } from "ai";
import { z } from "zod";
import { createMcpTool, getCurrentMcpTools } from "./sandbox";

const metaGenerateTextInternal = async (obj: any) => {
  const tools = {
    ...(await getCurrentMcpTools()),
    ...obj.tools,
    ...{
      generateToolToSolveTask: tool({
        description: `This tool is a meta tool similar to code-interpreter.
    When this tool succeeded you will have an additional tool on the next turn based on the input you provided.
    The tool generator is an advanced coding agent based on Claude Code, and it has access to a full Linux
    VM and the ability to install npm packages.
    
    Use this to generate tools that can solve tasks which cannot be easily solved by LLMs themselves
    but which are solvable by executing code.
    An example would be solving calculations, solving puzzles, or accessing the internet.
    The generated code can access the internet but it doesn't have access to any APIs that are not
    publicly available via HTTP.
    
    `,

        inputSchema: z.object({
          toolName: z
            .string()
            .describe("The name of the tool to generate using snake_case"),
          task: z.string()
            .describe(`A detailed description of the task to solve.
Rather than asking for a very specific tool, ask for a generic tool that can
solve a class of tasks. E.g. rather than asking for a tool to get the weather of tokyo,
ask for a tool to get the weather of a given city.`),
        }),
        outputSchema: z.boolean(),
        execute: async ({ task, toolName }) => {
          console.log("Creating MCP tool", toolName);
          const result = await createMcpTool(task, toolName);
          console.log("Result", result);
          if (result.success) {
            const list = Object.entries(result.tools || {});
            for (const [name, tool] of list) {
              tools[name] = tool;
            }
          }
          return result.success;
        },
      }),
    },
  };
  return streamText({
    ...obj,
    tools,
    prepareStep: async (args) => {
      return {
        ...tools,
        activeTools: Object.keys(tools),
      };
    },
    maxSteps: obj.maxSteps || 10,
  });
};

type AsyncStreamText = (
  ...args: Parameters<typeof streamText>
) => Promise<ReturnType<typeof streamText>>;

export const metaStreamText: AsyncStreamText = metaGenerateTextInternal as any;
