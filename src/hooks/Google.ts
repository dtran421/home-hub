import { ApiResponse, consumeApiResponse, Option } from "utils-toolkit";

import { useQueryClient } from "@tanstack/react-query";

import { type TRPCRouterLike } from "@/server/api/root";
import { type User } from "@/server/db/schema";
import { type GoogleCalendar, type GoogleCalendars } from "@/types/Google";
import { api } from "@/utils/api";
import { generateQueryKey, getError } from "@/utils/query";

export const useGetGoogleCalendars = (user: User | null) => {
  const {
    data: calendars,
    isLoading,
    isError,
    error: queryError,
  } = api.google.getCalendars.useQuery(undefined, {
    enabled: !!user,
    refetchOnWindowFocus: false,
    retry: 1,
    staleTime: 1000 * 60 * 15, // 15 minutes
  });

  const apiResponse = Option<ApiResponse<GoogleCalendars>>(calendars).coalesce(
    ApiResponse<GoogleCalendars>(null),
  );
  const maybeCalendars = consumeApiResponse(apiResponse);
  const isErr = !maybeCalendars.ok;

  const error = getError({
    isServerError: isErr,
    isUncaughtError: isError,
    responseError: isErr ? maybeCalendars.unwrap() : null,
    uncaughtError: queryError,
  });

  return {
    calendars: !isErr ? maybeCalendars.unwrap().coalesce([]) : null,
    isLoading,
    isError: isErr || isError,
    error,
  };
};

const updateCalendarData = (
  oldData: ApiResponse<GoogleCalendars> | undefined,
  newCalendar: GoogleCalendar | null,
) => {
  const oldApiResponse = consumeApiResponse(
    Option(oldData).coalesce(ApiResponse<GoogleCalendars>(null)),
  );
  if (!oldApiResponse.ok) {
    return oldData;
  }

  const data = oldApiResponse.unwrap().coalesce([]);

  return ApiResponse<GoogleCalendars>(
    newCalendar
      ? data.map((cal) => (cal.id === newCalendar.id ? newCalendar : cal))
      : data,
  );
};

export const useUpdateGoogleCalendar = () => {
  const queryClient = useQueryClient();

  const { queryKey: getCalendarsQueryKey } = generateQueryKey(
    api.google.getCalendars as unknown as TRPCRouterLike,
  );

  const { mutate, isLoading, isSuccess, isError, error } =
    api.google.updateCalendar.useMutation({
      onMutate: (newCalendar: GoogleCalendar) => {
        const previousCalendars =
          queryClient.getQueryData(getCalendarsQueryKey);

        queryClient.setQueryData(
          getCalendarsQueryKey,
          (previousCalendars: ApiResponse<GoogleCalendars> | undefined) =>
            updateCalendarData(previousCalendars, newCalendar),
        );

        return { previousCalendars };
      },
      onError: (err, _newCalendar, context) => {
        console.error(
          `Something went wrong with the calendar update: ${err.message}`,
        );
        queryClient.setQueryData(
          getCalendarsQueryKey,
          context?.previousCalendars,
        );
      },
      onSettled: (
        data: ApiResponse<GoogleCalendar | null> | undefined,
        error,
      ) => {
        const apiResponse = Option(data).coalesce(
          ApiResponse<GoogleCalendar>(null),
        );
        const calendarResult = consumeApiResponse(apiResponse);
        const isErr = !calendarResult.ok;

        if (error ?? isErr) {
          return;
        }

        const maybeCalendar = calendarResult.unwrap();
        if (!maybeCalendar.some) {
          console.error("Something went wrong with the calendar update");
          return;
        }

        const newCalendar = maybeCalendar.coalesce();

        queryClient.setQueryData<typeof updateCalendarData>(
          getCalendarsQueryKey,
          (previousCalendars: ApiResponse<GoogleCalendars> | undefined) =>
            updateCalendarData(previousCalendars, newCalendar),
        );

        void queryClient.invalidateQueries(
          generateQueryKey(api.nylas.getEvents as unknown as TRPCRouterLike),
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
