import {
  getQueryKey,
  TRPCClientError,
  type TRPCClientErrorLike,
} from "@trpc/react-query";

import { type AppRouter, type TRPCRouterLike } from "@/server/api/root";

interface QueryKeyMetadata<T> {
  input?: T;
  type: "query";
}

export const generateQueryKey = <T>(route: TRPCRouterLike, params?: T) => {
  const metadata: QueryKeyMetadata<T> = {
    type: "query",
  };

  if (params) {
    metadata.input = params;
  }

  return {
    queryKey: [...getQueryKey(route), metadata],
  };
};

export const getError = ({
  isServerError,
  isUncaughtError,
  responseError,
  uncaughtError,
}: {
  isServerError?: boolean;
  isUncaughtError?: boolean;
  responseError?: Error | null;
  uncaughtError?: TRPCClientErrorLike<AppRouter> | null;
}) => {
  const genericError = new TRPCClientError(
    "Something went wrong! Please refresh the page.",
  );

  if (isUncaughtError) {
    console.error(uncaughtError ?? genericError);
    return uncaughtError ?? genericError;
  }

  if (isServerError && responseError) {
    console.error(responseError ?? genericError);
    return (
      new TRPCClientError(responseError.message, {
        cause: responseError,
        meta: {
          ...responseError,
        },
      }) ?? genericError
    );
  }

  return null;
};
