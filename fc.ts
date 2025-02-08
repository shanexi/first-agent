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
            output: 'enum',
            enum: ['calendar', 'tenis', 'unknown'],
            // schema: z.object({
            //     recipe: z.object({
            //         name: z.string(),
            //         ingredients: z.array(z.object({ name: z.string(), amount: z.string() })),
            //         steps: z.array(z.string()),
            //     }),
            // }),
            prompt,
        });
        console.log('回答:', object);
        console.log('-------------------');
    }
}

run()

/*
first-agent git:(function-calling) ✗ npm start fc.ts

> first-agent@1.0.0 start
> NODE_OPTIONS='--import=tsx' node --env-file=.env fc.ts

请输入你的问题 (输入 exit 退出): 明天天气如何
回答: unknown
-------------------
请输入你的问题 (输入 exit 退出): 帮忙预定明天的网球课
回答: tenis
-------------------
请输入你的问题 (输入 exit 退出): 创建明天的日历
回答: calendar
-------------------
请输入你的问题 (输入 exit 退出): exit
*/