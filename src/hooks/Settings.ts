import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const getName = async () => {
  // return await GetName();
};

export const useName = () => {
  const {
    data: name,
    isLoading,
    isError,
    error,
  } = useQuery(["name"], getName, {
    retry: false,
  });

  return {
    name,
    isLoading,
    isError,
    error: error as string,
  };
};

export const useUpdateName = () => {
  const queryClient = useQueryClient();
  // const setName = SetName;

  const { mutate, isLoading, isSuccess, isError, error } = useMutation({
    // mutationFn: setName,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["name"] });
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
