import { getQueryKey } from "@trpc/react-query";

/**
 * Note that even though `query` is typed as `never`, it should only be a derived
 * route from `api` (e.g. `api.unsplash.getRandomImage`).
 */
export const generateQueryKey = <T>(query: unknown, params: T) => ({
  queryKey: [
    // @ts-expect-error: `query` is typed as `never`, but it should be a derived route from `api`.
    ...getQueryKey(query),
    {
      input: params,
      type: "query",
    },
  ],
});
