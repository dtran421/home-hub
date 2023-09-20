import { api } from "@/utils/api";
import { generateQueryKey } from "@/utils/query";
import { useQueryClient } from "@tanstack/react-query";

export const useGetUser = () => {
  const {
    data: user,
    isLoading,
    isError,
    error,
  } = api.users.get.useQuery(
    {
      id: "1",
    },
    {
      retry: false,
    },
  );

  return {
    user,
    isLoading,
    isError,
    error,
  };
};

export const useCreateUser = () => {
  const queryClient = useQueryClient();

  const { mutate, isLoading, isSuccess, isError, error } =
    api.users.insert.useMutation({
      onSuccess: () => {
        void queryClient.invalidateQueries(
          generateQueryKey(api.users.get, {
            id: "1",
          }),
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

export const useUpdateUser = () => {
  const queryClient = useQueryClient();

  const { mutate, isLoading, isSuccess, isError, error } =
    api.users.update.useMutation({
      onSuccess: () => {
        void queryClient.invalidateQueries(
          generateQueryKey(api.users.get, {
            id: "1",
          }),
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
