import axios, { type AxiosError } from "axios";

import { type inferReactQueryProcedureOptions } from "@trpc/react-query";
import { type RouterLike, type UtilsLike } from "@trpc/react-query/shared";
import { type inferRouterInputs, type inferRouterOutputs } from "@trpc/server";

import { unsplashRouter } from "@/server/api/routers/unsplash";
import { createTRPCRouter } from "@/server/api/trpc";

import { IS_PROD } from "../utils";

import { googleRouter } from "./routers/google";
import { nylasRouter } from "./routers/nylas";
import { usersRouter } from "./routers/users";
import { weatherRouter } from "./routers/weather";

// Add a request interceptor
axios.interceptors.request.clear();
axios.interceptors.request.use(
  (config) => {
    if (!IS_PROD) {
      console.info(`[${config.method?.toUpperCase()}]: ${config.url}`);
      if (config.data) {
        console.info(`Body: ${JSON.stringify(config.data)}`);
      }
    }

    return config;
  },
  (error: AxiosError) => {
    const { cause, config } = error;
    console.error(
      `[${config?.method?.toUpperCase()}]: ${config?.url}${
        cause && `==> ${cause.message}`
      }`,
    );

    return Promise.reject(error);
  },
);

// Add a response interceptor
axios.interceptors.response.clear();
axios.interceptors.response.use(
  (response) => {
    if (!IS_PROD) {
      console.info(
        `[${response.config.method?.toUpperCase()}]: ${
          response.config.url
        } ==> ${response.status} ${response.statusText}`,
      );
    }

    return response;
  },
  (error: AxiosError) => {
    const { cause, config, response } = error;
    console.error(
      `[${config?.method?.toUpperCase()}]: ${config?.url} ==> ${response?.status} ${response?.statusText}`,
    );
    if (cause) {
      console.error(`Error: ${cause.message}`);
    }

    return Promise.reject(error);
  },
);

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  unsplash: unsplashRouter,
  users: usersRouter,
  weather: weatherRouter,
  nylas: nylasRouter,
  google: googleRouter,
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
