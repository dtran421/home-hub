import { type AppRouter, type TRPCRouterLike } from "@/server/api/root";
import { api } from "@/utils/api";
import { generateQueryKey } from "@/utils/query";
import { useQueryClient } from "@tanstack/react-query";
import { TRPCClientError, type TRPCClientErrorLike } from "@trpc/client";
import { useCallback } from "react";
import { consumeApiResponse, Option } from "utils-toolkit";

const DEFAULT_PARAMS = {
  topics: "nature",
  orientation: "landscape",
};

const getError = ({
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

export const useGetUnsplashImage = () => {
  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
    isError,
    error: queryError,
  } = api.unsplash.getRandomImage.useQuery(DEFAULT_PARAMS, {
    refetchOnWindowFocus: false,
    retry: 1,
    staleTime: 1000 * 60 * 20, // 20 minutes
  });

  const maybeImg = consumeApiResponse(Option(data).coalesce());
  const isErr = !maybeImg.ok;

  const error: TRPCClientErrorLike<AppRouter> | null = getError({
    isServerError: isErr,
    isUncaughtError: isError,
    responseError: isErr ? maybeImg.unwrap() : null,
    uncaughtError: queryError,
  });

  const refresh = useCallback(() => {
    const queryKey = generateQueryKey(
      api.unsplash.getRandomImage as TRPCRouterLike,
      DEFAULT_PARAMS,
    );
    void queryClient.invalidateQueries(queryKey);
  }, [queryClient]);

  return {
    img: !isErr ? maybeImg.unwrap() : null,
    isLoading,
    isError: isErr || isError,
    error,
    refresh,
  };
};
