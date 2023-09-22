import { getQueryKey } from "@trpc/react-query";

import { type TRPCRouterLike } from "@/server/api/root";

export const generateQueryKey = <T>(route: TRPCRouterLike, params: T) => ({
  queryKey: [
    ...getQueryKey(route),
    {
      input: params,
      type: "query",
    },
  ],
});
