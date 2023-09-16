import { api } from "@/utils/api";
import { generateQueryKey } from "@/utils/query";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

const DEFAULT_PARAMS = {
  topics: "nature",
  orientation: "landscape",
};

export const useGetUnsplashImage = () => {
  const queryClient = useQueryClient();

  const { data: img, isLoading } = api.unsplash.getRandomImage.useQuery(
    DEFAULT_PARAMS,
    {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 1000 * 60 * 20, // 20 minutes
    },
  );

  const refresh = useCallback(() => {
    const queryKey = generateQueryKey(
      api.unsplash.getRandomImage,
      DEFAULT_PARAMS,
    );
    void queryClient.invalidateQueries(queryKey);
  }, [queryClient]);

  return {
    img,
    isLoading,
    refresh,
  };
};
