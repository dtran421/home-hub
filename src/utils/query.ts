import { type TRPCRouterLike } from "@/server/api/root";
import { getQueryKey } from "@trpc/react-query";

export const generateQueryKey = <T>(route: TRPCRouterLike, params: T) => ({
  queryKey: [
    ...getQueryKey(route),
    {
      input: params,
      type: "query",
    },
  ],
});
