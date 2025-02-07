import { createOllama } from "ollama-ai-provider";
import { createAgent } from "@statelyai/agent";
import { z } from "zod";

const ollama = createOllama({
  baseURL: "http://localhost:11434/api",
});

export const agent = createAgent({
  name: "todo",
  // model: ollama("qwen2.5:14b"),
  model: ollama("deepseek-r1:14b"),
  events: {
    "agent.englishSummary": z.object({
      text: z.string().describe("The summary in English"),
    }),
    "agent.chineseSummary": z.object({
      text: z.string().describe("The summary in Chinese"),
    }),
  },
});
