import moment from "moment";
import { ApiResponse, consumeApiResponse, Option } from "utils-toolkit";

import { type MbscCalendarEvent } from "@mobiscroll/react";
import { useQueryClient } from "@tanstack/react-query";

import { type TRPCRouterLike } from "@/server/api/root";
import { type Calendar, type Calendars, type Events } from "@/types/Nylas";
import { api } from "@/utils/api";
import { generateQueryKey, getError } from "@/utils/query";

export const useUpsertNylasAccount = () => {
  const queryClient = useQueryClient();

  const { mutate, isLoading, isSuccess, isError, error } =
    api.nylas.upsertAccount.useMutation({
      onSuccess: () => {
        void queryClient.invalidateQueries(
          // TODO: this typing needs to be fixed lol
          generateQueryKey(api.nylas.getCalendars as unknown as TRPCRouterLike),
        );
        void queryClient.invalidateQueries(
          // TODO: this typing needs to be fixed lol
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

export type CalendarType = "All" | "Tasks";

const getCalendarType = (calendar: Calendar): CalendarType =>
  calendar.description === "Task Calendar" ? "Tasks" : "All";

const postProcessCalendars = (
  calendars: Calendars,
): Record<CalendarType, Calendars> | null =>
  !calendars.length
    ? null
    : calendars
        .filter((calendar) => !calendar.name.includes("⚠️"))
        .sort((a, b) => {
          if (a.isPrimary && !b.isPrimary) {
            return -1;
          }

          if (!a.isPrimary && b.isPrimary) {
            return 1;
          }

          if (a.name < b.name) {
            return -1;
          }

          if (a.name > b.name) {
            return 1;
          }

          return 0;
        })
        .reduce(
          (map, calendar) => {
            const key = getCalendarType(calendar);
            return {
              ...map,
              [key]: [...(map[key] ?? []), calendar],
            };
          },
          {} as Record<CalendarType, Calendars>,
        );

export const useGetCalendars = () => {
  const {
    data: calendars,
    isLoading,
    isError,
    error: queryError,
  } = api.nylas.getCalendars.useQuery(undefined, {
    refetchOnWindowFocus: false,
    retry: 1,
    staleTime: 1000 * 60 * 15, // 15 minutes
  });

  const apiResponse = Option(calendars).coalesce(ApiResponse<Calendars>(null));
  const maybeCalendars = consumeApiResponse(apiResponse);
  const isErr = !maybeCalendars.ok;

  const error = getError({
    isServerError: isErr,
    isUncaughtError: isError,
    responseError: isErr ? maybeCalendars.unwrap() : null,
    uncaughtError: queryError,
  });

  return {
    calendars: !isErr
      ? postProcessCalendars(maybeCalendars.unwrap().coalesce([])!)
      : null,
    isLoading,
    isError: isErr || isError,
    error,
  };
};

const updateCalendarData = (
  oldData: ApiResponse<Calendars> | undefined,
  newCalendar: Calendar | null,
) => {
  const oldApiResponse = consumeApiResponse(
    Option(oldData).coalesce(ApiResponse<Calendars>(null)),
  );
  if (!oldApiResponse.ok) {
    return oldData;
  }

  const data = oldApiResponse.unwrap().coalesce([]);

  return ApiResponse<Calendars>(
    data.map((calendar) => {
      if (calendar.id === newCalendar?.id) {
        return newCalendar;
      }
      return calendar;
    }),
  );
};

export const useUpdateCalendar = () => {
  const queryClient = useQueryClient();

  const { queryKey: getCalendarsQueryKey } = generateQueryKey(
    api.nylas.getCalendars as unknown as TRPCRouterLike,
  );

  const { mutate, isLoading, isSuccess, isError, error } =
    api.nylas.updateCalendar.useMutation({
      onMutate: (newCalendar: Calendar) => {
        const previousCalendars =
          queryClient.getQueryData(getCalendarsQueryKey);

        queryClient.setQueryData(
          getCalendarsQueryKey,
          (previousCalendars: ApiResponse<Calendars> | undefined) =>
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
      onSettled: (data: ApiResponse<Calendar | null> | undefined, error) => {
        const apiResponse = Option(data).coalesce(ApiResponse<Calendar>(null));
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
          (previousCalendars: ApiResponse<Calendars> | undefined) =>
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

const formatEvents = (events: Events): MbscCalendarEvent[] =>
  events.map((event) => {
    const mbscEvent = {
      id: event.id,
      allDay:
        !event.when ||
        event.when.object === "date" ||
        event.when.object === "datespan",
      resource: event.object,
      title: event.title,
      timezone: "America/New_York",
    };

    switch (event.when.object) {
      case "time":
        const start = moment(event.when.time);
        return {
          ...mbscEvent,
          start: start.toDate(),
          end: start.add(1, "hour").toDate(),
          timezone: event.when.timezone,
        };
      case "timespan":
        return {
          ...mbscEvent,
          start: moment.unix(event.when.startTime).toDate(),
          end: moment.unix(event.when.endTime).toDate(),
          timezone: event.when.startTimezone,
        };
      case "date":
        return {
          ...mbscEvent,
          date: moment(event.when.date).toDate(),
        };
      case "datespan":
        return {
          ...mbscEvent,
          start: moment(event.when.startDate).toDate(),
          end: moment(event.when.endDate).toDate(),
        };
    }
  });

export const useGetEvents = () => {
  const {
    data: events,
    isLoading,
    isError,
    error: queryError,
  } = api.nylas.getEvents.useQuery(undefined, {
    refetchOnWindowFocus: false,
    retry: 1,
    staleTime: 1000 * 60 * 15, // 15 minutes
  });

  const apiResponse = Option(events).coalesce(ApiResponse<Events>(null));
  const maybeEvents = consumeApiResponse(apiResponse);
  const isErr = !maybeEvents.ok;

  const error = getError({
    isServerError: isErr,
    isUncaughtError: isError,
    responseError: isErr ? maybeEvents.unwrap() : null,
    uncaughtError: queryError,
  });

  return {
    events: !isErr ? formatEvents(maybeEvents.unwrap().coalesce([])!) : null,
    isLoading,
    isError: isErr || isError,
    error,
  };
};
