import { useCallback } from "react";
import { ApiResponse, consumeApiResponse, Option } from "utils-toolkit";

import { useQueryClient } from "@tanstack/react-query";

import { type TRPCRouterLike } from "@/server/api/root";
import { type UnsplashRandomImage } from "@/types/Unsplash";
import { api } from "@/utils/api";
import { generateQueryKey, getError } from "@/utils/query";

const DEFAULT_PARAMS = {
  topics: "nature",
  orientation: "landscape",
  query: "outdoors landscape nature beautiful",
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

  const apiResponse = Option(data).coalesce(
    ApiResponse<UnsplashRandomImage>(null),
  );
  const maybeImg = consumeApiResponse(apiResponse);
  const isErr = !maybeImg.ok;

  const error = getError({
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
    img: !isErr ? maybeImg.unwrap().coalesce() : null,
    isLoading,
    isError: isErr || isError,
    error,
    refresh,
  };
};
