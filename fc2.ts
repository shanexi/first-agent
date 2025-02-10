// https://sdk.vercel.ai/docs/ai-sdk-core/generating-structured-data

import { generateObject, extractReasoningMiddleware, wrapLanguageModel } from 'ai';
import { z } from 'zod'
import { createOpenAI } from '@ai-sdk/openai';
import * as readline from 'readline';
import { createOllama } from "ollama-ai-provider";

const openai = createOpenAI({
    apiKey: process.env.OPENAI_KEY,
    baseURL: process.env.OPENAI_BASEURL,
});

const ollama = createOllama({
    baseURL: "http://localhost:11434/api",
});

const schema = z.object({
    actions: z.enum(['calendar', 'tennis', 'unknown']),
    startDatetime: z
        .string(),
    endDatetime: z
        .string()
}).describe(`当前时间 ${new Date().toLocaleDateString()}`)

const prompt = '后天上午还有哪些日程'

console.log('prompt', prompt)

async function run() {
    const { object: o1 } = await generateObject({
        model: openai('gpt-4o-mini'), // 可以处理日期类 $ 0.15 /M tokens | $ 0.6 /M tokens
        output: 'object',
        schema,
        prompt,
    });

    console.log('o1', o1)

    const { object: o2 } = await generateObject({
        model: ollama("qwen2.5-coder:14b"),
        output: 'object',
        schema,
        prompt,
    });

    console.log('o1', o2)
}

run()
