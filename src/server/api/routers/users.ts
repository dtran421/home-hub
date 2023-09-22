import { eq } from "drizzle-orm";
import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { type User, users } from "@/server/db/schema";

export const usersRouter = createTRPCRouter({
  get: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.db.query.users.findFirst({
        where: eq(users.id, input.id),
      });

      return user ?? null;
    }),

  insert: publicProcedure
    .input(z.object({ name: z.string(), city: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.insert(users).values({
        id: "1",
        name: input.name,
        email: "abc@acme.org",
        city: input.city,
      });

      return user;
    }),

  update: publicProcedure
    .input(
      z.object({
        id: z.string(),
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

      const user = await ctx.db
        .update(users)
        .set(userObj)
        .where(eq(users.id, "1"));

      return user;
    }),
});
