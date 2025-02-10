// https://sdk.vercel.ai/docs/ai-sdk-core/generating-structured-data

import { createOpenAI } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { createOllama } from "ollama-ai-provider";
import { z } from 'zod';

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

const prompt = '周三之前还有哪些日程'

console.log('prompt', prompt)

async function runModel(model: string, type: 'ollama' | 'openai' = 'openai') {
    const { object } = await generateObject({
        model: type === 'openai' ? openai(model) : ollama(model),
        output: 'object',
        schema,
        prompt,
    });

    console.log(model, object)
}

async function run() {
    await runModel('gpt-4o-mini')
    await runModel('gpt-4o')
    await runModel('qwen2.5-coder:14b', 'ollama')
}

run()
