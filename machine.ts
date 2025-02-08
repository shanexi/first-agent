import { setup, createActor, assign } from "xstate";
import { agent } from "./agent";
import { fromDecision, fromText } from "@statelyai/agent";

const machine = setup({
  types: {
    events: agent.types.events,
  },
  actors: { agent: fromDecision(agent), summarizer: fromText(agent) },
}).createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QAoC2BDAxgCwJYDswBKAOlgFdUMAnXALwKgGIIB7QkggN1YGswSaLHkKkKVdLQb4oCbq0zoALrnYBtAAwBdTVsSgADq1i4V7fSAAeiAGwaSATgAcAFgDMNgKye3DgOwabn4ANCAAnogAjH6eJBp+TpFuGp4ATJ4u-jYAvtmhQjgExGSUNPSMLOwC8vyCGIWiJRJSjHL4PIpm+GqROtoWRiZdFtYIdo6uHt6+AUGhEQiJJJkOq05OyTYukZFOufn1IsXiZdLMugPGpqr4I4jp9oGRqW5OfjapXpHO84huO44NB9Mp4PjZng5cnkQPhWBA4BYCkciJchjc7ggALSRX5YnLQpFFMSlSTlGSo67mJBWRAuELhe5+NwkLxg1LswIZFL7ECExonUl0SAU4bU0YeGxxBxBIIuDQvXY4hkIVJOSWs9IeBwZb5uKHZIA */
  initial: "summarizing",
  context: {
    patientVisit:
      "在我就诊期间，医生清楚地解释了我的病情。她倾听了我的担忧，并推荐了一个治疗方案。经过一系列检查后，我的病情被诊断为X。我对有了明确的健康管理方向感到放心。此外，工作人员在登记和结账时非常友好且乐于助人。而且，设施干净整洁，维护良好。",
  },
  states: {
    summarizing: {
      invoke: [
        {
          src: "summarizer",
          input: ({ context }) => ({
            context,
            prompt:
              "将患者的就诊情况总结为一句话。总结应使用英语。",
          }),
          onDone: {
            actions: assign({
              englishSummary: ({ event }) => event.output.text,
            }),
          },
        },
        {
          src: "summarizer",
          input: ({ context }) => ({
            context,
            prompt:
              "将患者的就诊情况总结为一句话。总结应使用中文。",
          }),
          onDone: {
            actions: assign({
              chineseSummary: ({ event }) => event.output.text,
            }),
          },
        },
      ],
      always: {
        guard: ({ context }) =>
          context.englishSummary && context.chineseSummary,
        target: "summarized",
      },
    },
    summarized: {
      entry: ({ context }) => {
        console.log(context.englishSummary);
        console.log(context.chineseSummary);
      },
    },
  },
});

const actor = createActor(machine);

actor.subscribe((s) => {
  console.log(s.context);
});

actor.start();
