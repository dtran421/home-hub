import { type Session } from "next-auth";
import { ApiResponse, consumeApiResponse, Option } from "utils-toolkit";

import { useQueryClient } from "@tanstack/react-query";

import { type TRPCRouterLike } from "@/server/api/root";
import { api } from "@/utils/api";
import { generateQueryKey, getError } from "@/utils/query";

export const useGetUser = (session: Session | null) => {
  const queryClient = useQueryClient();

  if (!session?.user?.id) {
    queryClient.removeQueries(
      generateQueryKey(api.users.get as unknown as TRPCRouterLike),
    );
  }

  const {
    data,
    isFetched,
    isLoading,
    isError,
    error: queryError,
  } = api.users.get.useQuery(undefined, {
    refetchOnWindowFocus: false,
    retry: false,
    enabled: !!session?.user?.id,
  });

  const apiResponse = Option(data).coalesce(ApiResponse(null));
  const maybeUser = consumeApiResponse(apiResponse);
  const isErr = !maybeUser.ok;

  const error = getError({
    isServerError: isErr,
    isUncaughtError: isError,
    responseError: isErr ? maybeUser.unwrap() : null,
    uncaughtError: queryError,
  });

  return {
    user: !isErr ? maybeUser.unwrap().coalesce() : null,
    isFetched,
    isLoading,
    isError: isErr || isError,
    error,
  };
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();

  const { mutate, isLoading, isSuccess, isError, error } =
    api.users.update.useMutation({
      onSuccess: () => {
        void queryClient.invalidateQueries(
          // TODO: this typing needs to be fixed lol
          generateQueryKey(api.users.get as unknown as TRPCRouterLike),
        );
      },
    });

  return {
    mutate,
    isLoading,
    isSuccess,
    isError,
    error,
  };
};
