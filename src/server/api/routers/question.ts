import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
} from "@/server/api/trpc";

export const questionRouter = createTRPCRouter({
  create: protectedProcedure
    .input(z.object({
        title: z.string().min(1),
        description: z.string().min(1),
        answers: z.array(z.object({
            entry: z.string().min(1),
            correct: z.boolean(),
        }))
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.question.create({
        data: {
          title: input.title,
          description: input.description,
          createdBy: { connect: { id: ctx.session.user.id } },
          answers: {
            createMany: {
                data: input.answers.map(answer => ({
                  entry: answer.entry,
                  correct: answer.correct,
                })),
            },
          }
        },
      });
    }),
});
