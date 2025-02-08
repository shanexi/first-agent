import { assign, setup, assertEvent, createActor, createMachine } from 'xstate';
import { z } from 'zod';
import { createAgent, fromDecision } from '@statelyai/agent';
import { createOpenAI } from '@ai-sdk/openai';
import { fromTerminal } from './helpers/helpers.ts';
import { createOllama } from "ollama-ai-provider";

const openai = createOpenAI({
    apiKey: process.env.OPENAI_KEY,
    baseURL: process.env.OPENAI_BASEURL,
});

const ollama = createOllama({
    baseURL: "http://localhost:11434/api",
});

const agent = createAgent({
    name: 'todo',
    model: openai('gpt-4o-mini'),
    // model: ollama("qwen2.5:14b"),
    events: {
        addTodo: z.object({
            title: z.string().min(1).max(100).describe('The title of the todo'),
            content: z.string().min(1).max(100).describe('The content of the todo'),
        }),
        deleteTodo: z.object({
            index: z.number().describe('The index of the todo to delete'),
        }),
        toggleTodo: z
            .object({
                index: z.number().describe('The index of the todo to toggle'),
            })
            .describe('Toggle whether the todo item is done or not'),
        doNothing: z.object({}).describe('Do nothing'),
    },
});

interface Todo {
    title: string;
    content: string;
    done: boolean;
}

const machine = setup({
    types: {
        context: {} as {
            todos: Todo[];
            command: string | null;
        },
        events: {} as
            | typeof agent.types.events
            | { type: 'assist'; command: string },
    },
    actors: { agent: fromDecision(agent), getFromTerminal: fromTerminal },
}).createMachine({
    /** @xstate-layout N4IgpgJg5mDOIC5QAoC2BDAxgCwJYDswBKAYnQggBUB7CagbQAYBdRUAB2tlwBddr8bEAA9EAFgBMAGhABPRAEYAzBIB0jDRoAcATkZaFjBQDYArAF9zMtFjyFSEMABswPMDTpNWSEJ258BIVEESRl5BAkJLVUxUyUFCWVdMWUdLUtrDBwCYhIeaigoFw8GFiE-Xn5BH2DQuUQVMVU9YwklJS0AdkZOiWMlDJAbbPsSOgA5ah47KC9yrkrAmvFpeoQDVVNNRnaVLS0JU2NB4btiVVwIFzGBMAv8ADdqAGs705yiC6uwBAInzHQAXwXjmPgqQKC4niqm68SUOyUOgkRgUpjCiiiqnhmi6Oi2PTSJyyZ0+l2u6Fg3FgPFBHAWEOWIWhsOUCKRKLRa0iChhcQSiIUWjMpjEx0G+FocCE73s838VUhCAAtMZ0crTM0dFrtTrtQMrENiR8vi45YtqqBggodMZmokut02qYdJ0xGqFCl1H1TL1Eb0jPrMrZjRSqXx8FAzQzLYhjGImrE4aYTJ0tPDVWsPTytM69D74XFRRZLOYgA */
    context: {
        command: null,
        todos: [],
    },
    on: {
        addTodo: {
            actions: assign({
                todos: ({ context, event }) => [
                    ...context.todos,
                    {
                        title: event.title,
                        content: event.content,
                        done: false,
                    },
                ],
                command: null,
            }),
            target: '.idle',
        },
        deleteTodo: {
            actions: assign({
                todos: ({ context, event }) => {
                    const todos = [...context.todos];
                    todos.splice(event.index, 1);
                    return todos;
                },
                command: null,
            }),
            target: '.idle',
        },
        toggleTodo: {
            actions: assign({
                todos: ({ context, event }) => {
                    const todos = context.todos.map((todo, i) => {
                        if (i === event.index) {
                            return {
                                ...todo,
                                done: !todo.done,
                            };
                        }
                        return todo;
                    });

                    return todos;
                },
                command: null,
            }),
            target: '.idle',
        },
        doNothing: { target: '.idle' },
    },
    initial: 'idle',
    states: {
        idle: {
            invoke: {
                src: 'getFromTerminal',
                input: '\nEnter a command:',
                onDone: {
                    actions: assign({
                        command: ({ event }) => event.output,
                    }),
                    target: 'assisting',
                },
            },
            on: {
                assist: {
                    target: 'assisting',
                    actions: assign({
                        command: ({ event }) => event.command,
                    }),
                },
            },
        },
        assisting: {
            invoke: {
                src: 'agent',
                input: ({ context }) => ({
                    context: {
                        command: context.command,
                        todos: context.todos,
                    },
                    goal: 'Interpret the command as an action for this todo list; for example, "I need donuts" would add a todo item with the message "Get donuts".',
                }),
            },
        },
    },
});

const actor = createActor(machine);
actor.subscribe((s) => {
    console.log(s.context.todos);
});
actor.start();