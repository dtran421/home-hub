import { eq } from "drizzle-orm";
import { ApiResponse, Option } from "utils-toolkit";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { type User, users } from "@/server/db/schema";

export const usersRouter = createTRPCRouter({
  get: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.query.users.findFirst({
      where: eq(users.id, ctx.session.user.id),
    });

    return ApiResponse(Option(user).coalesce());
  }),

  update: protectedProcedure
    .input(
      z.object({
        name: z.string().optional(),
        city: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userObj: Partial<User> = {};

      if (input.name) {
        userObj.name = input.name;
      }

      if (input.city) {
        userObj.city = input.city;
      }

      await ctx.db
        .update(users)
        .set(userObj)
        .where(eq(users.id, ctx.session.user.id));

      console.info(`Successfully updated user ${ctx.session.user.id}`);
    }),
});
