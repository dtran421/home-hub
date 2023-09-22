import { type RouterLike, type UtilsLike } from "@trpc/react-query/shared";
import { createTRPCRouter } from "@/server/api/trpc";
import { exampleRouter } from "@/server/api/routers/example";
import { unsplashRouter } from "@/server/api/routers/unsplash";
import { usersRouter } from "./routers/users";
import { weatherRouter } from "./routers/weather";
import { type inferReactQueryProcedureOptions } from "@trpc/react-query";
import { type inferRouterInputs, type inferRouterOutputs } from "@trpc/server";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  example: exampleRouter,
  unsplash: unsplashRouter,
  users: usersRouter,
  weather: weatherRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

// Infer the type of router, and then generate the abstract types for use in the client
type TRPCRouterType = ReturnType<typeof createTRPCRouter>;
export type TRPCRouterLike = RouterLike<TRPCRouterType>;
export type TRPCRouterUtilsLike = UtilsLike<TRPCRouterType>;

// Infer the types for router
export type ReactQueryOptions = inferReactQueryProcedureOptions<AppRouter>;
export type RouterInputs = inferRouterInputs<AppRouter>;
export type RouterOutputs = inferRouterOutputs<AppRouter>;
