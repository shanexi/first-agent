// https://sdk.vercel.ai/docs/ai-sdk-core/generating-structured-data

import { generateObject } from 'ai';
import { z } from 'zod'
import { createOpenAI } from '@ai-sdk/openai';
import * as readline from 'readline';

const openai = createOpenAI({
    apiKey: process.env.OPENAI_KEY,
    baseURL: process.env.OPENAI_BASEURL,
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

        const { object } = await generateObject({
            model: openai('gpt-4o-mini'),
            output: 'array',
            schema: z.enum(['calendar', 'tenis', 'unknown']),
            prompt,
        });
        console.log('回答:', object);
        console.log('-------------------');
    }
}

run()
