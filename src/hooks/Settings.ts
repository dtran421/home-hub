import { type User } from "@/server/db/schema";
import { api } from "@/utils/api";
import { generateQueryKey } from "@/utils/query";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

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

export const useUpsertUser = (user?: User | null) => {
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();

  if (user === null) {
    return createUser;
  }

  return updateUser;
};

const getCity = async () => {
  // return await GetCity();
};

export const useCity = () => {
  const {
    data: city,
    isLoading,
    isSuccess,
    isError,
    error,
  } = useQuery(["city"], getCity, {
    retry: false,
  });

  return {
    city,
    isLoading,
    isSuccess,
    isError,
    error: error as string,
  };
};

export const useUpdateCity = () => {
  const queryClient = useQueryClient();
  // const setCity = SetCity;

  const { mutate, isLoading, isError, error } = useMutation({
    // mutationFn: setCity,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["city"] });
      void queryClient.invalidateQueries({ queryKey: ["5-day-forecast"] });
    },
  });

  return {
    mutate,
    isLoading,
    isError,
    error,
  };
};
