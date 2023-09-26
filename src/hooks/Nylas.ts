import moment from "moment";
import { ApiResponse, consumeApiResponse, Option } from "utils-toolkit";

import { type MbscCalendarEvent } from "@mobiscroll/react";
import { useQueryClient } from "@tanstack/react-query";

import { type TRPCRouterLike } from "@/server/api/root";
import { type Events } from "@/types/Nylas";
import { api } from "@/utils/api";
import { generateQueryKey, getError } from "@/utils/query";

/* export const useGetCalendars = () => {
  const getCalendars = async () => await GetCalendars("icloud");
  const { data, isLoading } = useQuery(["calendars"], getCalendars, {
    refetchOnWindowFocus: false,
    retry: 1,
    staleTime: 1000 * 60 * 15, // 15 minutes
  });

  return {
    calendars: data?.calendars,
    isLoading,
  };
};*/

export const useUpsertNylasAccount = () => {
  const queryClient = useQueryClient();

  const { mutate, isLoading, isSuccess, isError, error } =
    api.nylas.upsertAccount.useMutation({
      onSuccess: () => {
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
