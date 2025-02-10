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

async function run() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    while (true) {
        const prompt = await new Promise<string>((resolve) => {
            rl.question('请输入你的问题 (输入 exit 退出): ', (answer) => {
                resolve(answer);
            });
        });

        if (prompt.toLowerCase() === 'exit' || prompt.toLowerCase() === 'quit') {
            rl.close();
            break;
        }

        // 不支持 function calling
        const model = wrapLanguageModel({
            // model: ollama("deepseek-r1:14b"),
            model: ollama("deepseek-r1:14b"),
            middleware: extractReasoningMiddleware({ tagName: 'think' }),
        });

        const { object } = await generateObject({
            // model: openai('gpt-4o-mini'), // 可以处理日期类
            // model: openai('DeepSeek-R1'), // 不支持 function calling
            // model: model,
            model: ollama("qwen2.5-coder:32b"), // 至少 32b 模型
            output: 'object',
            schema: z.object({
                actions: z.enum(['calendar', 'tennis', 'unknown']),
                startDatetime: z
                    .string(),
                endDatetime: z
                    .string()
            }).describe(`当前时间 ${new Date().toLocaleDateString()}`),
            prompt: prompt,
        });
        console.log('回答:', object);
        console.log('-------------------');
    }
}

run()
