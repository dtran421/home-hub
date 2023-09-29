import axios from "axios";
import { eq } from "drizzle-orm";
import { ApiResponse } from "utils-toolkit";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { nylasAccounts, nylasCalendars } from "@/server/db/schema";
import {
  type Calendar,
  type Calendars,
  type CalendarsJSON,
  type Events,
  type EventsJSON,
  NylasAuthProvider,
} from "@/types/Nylas";
import { NYLAS_BASE_URL } from "@/utils/common";

const upsertAccount = protectedProcedure
  .input(
    z.object({
      accountId: z.string().min(1),
      provider: z.enum(NylasAuthProvider),
      accessToken: z.string().min(1),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    await ctx.db
      .insert(nylasAccounts)
      .values({
        userId: ctx.session.user.id,
        ...input,
      })
      .onDuplicateKeyUpdate({ set: { accessToken: input.accessToken } });

    console.info(
      `Successfully upserted Nylas account for user ${ctx.session.user.id}`,
    );

    return ApiResponse(input);
  });

const processCalendarResponse = (
  provider: (typeof NylasAuthProvider)[number],
  data: CalendarsJSON,
): Omit<Calendar, "active">[] =>
  data.map((calendar) => ({
    provider,
    name: calendar.name,
    description: calendar.description,
    location: calendar.location,
    timezone: calendar.timezone,
    id: calendar.id,
    object: calendar.object,
    accountId: calendar.account_id,
    readOnly: calendar.read_only,
    isPrimary: calendar.is_primary,
    hexColor: calendar.hex_color,
  }));

const getCalendars = protectedProcedure.query(async ({ ctx }) => {
  const userNylasAccounts = await ctx.db.query.nylasAccounts.findMany({
    where: eq(nylasAccounts.userId, ctx.session.user.id),
    columns: {
      provider: true,
      accessToken: true,
    },
    with: {
      nylasCalendars: {
        columns: {
          calendarId: true,
          active: true,
        },
      },
    },
  });

  const existingCalendarMap = userNylasAccounts.reduce(
    (map, account) => {
      account.nylasCalendars.forEach((cal) => {
        map[cal.calendarId] = !!cal.active;
      });
      return map;
    },
    {} as Record<string, boolean>,
  );

  const endpoint = "/calendars";

  try {
    const calendarsPromises = userNylasAccounts.map(async (account) => {
      const { data } = await axios.get<CalendarsJSON>(
        `${NYLAS_BASE_URL}${endpoint}`,
        {
          headers: {
            Authorization: `Bearer ${account.accessToken}`,
            "Accept-Version": "v1",
          },
        },
      );

      return processCalendarResponse(account.provider, data);
    });

    const calendarsForAccounts = await Promise.all(calendarsPromises);
    const calendars = calendarsForAccounts.flat();

    const calendarsToInsert = calendars
      .filter((cal) => !(cal.id in existingCalendarMap))
      .map((calendar) => ({
        accountId: calendar.accountId,
        calendarId: calendar.id,
        provider: calendar.provider,
      }));

    if (calendarsToInsert.length) {
      await ctx.db.insert(nylasCalendars).values(calendarsToInsert);
    }

    return ApiResponse<Calendars>(
      calendars.map((cal) => ({
        ...cal,
        active: existingCalendarMap[cal.id] ?? true,
      })),
    );
  } catch (error) {
    if (!(error instanceof Error)) {
      return ApiResponse<Calendars>(new Error("500 Internal Error"));
    }

    if (axios.isAxiosError(error)) {
      console.error("Something went wrong with axios: ", error.toJSON());
    } else {
      console.error("Something went wrong: ", error.message);
    }
    return ApiResponse<Calendars>(error);
  }
});

const updateCalendar = protectedProcedure
  .input(
    z.object({
      name: z.string(),
      description: z.string().nullable(),
      location: z.string().nullable(),
      timezone: z.string().nullable(),
      id: z.string(),
      object: z.literal("calendar"),
      provider: z.enum(NylasAuthProvider),
      accountId: z.string(),
      readOnly: z.boolean(),
      isPrimary: z.boolean().optional().nullable(),
      hexColor: z.string().optional().nullable(),
      active: z.boolean(),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const { id, active } = input;

    const calendar = await ctx.db.query.nylasCalendars.findFirst({
      where: eq(nylasCalendars.calendarId, id),
    });
    if (!calendar) {
      return ApiResponse<Calendar>(new Error("404 Calendar not found"));
    }

    await ctx.db
      .update(nylasCalendars)
      .set({ active: active ? 1 : 0 })
      .where(eq(nylasCalendars.calendarId, id));

    console.info(`Successfully updated calendar ${id}`);

    return ApiResponse<Calendar>({
      ...input,
      active,
    });
  });

const processEventResponse = (data: EventsJSON): Events =>
  data.map((event) => {
    const formattedEvent = {
      id: event.id,
      title: event.title,
      description: event.description,
      location: event.location,
      object: event.object,
      status: event.status,

      accountId: event.account_id,
      calendarId: event.calendar_id,
      reminders: {
        remainderMinutes: event.reminders?.remainder_minutes,
        reminderMethod: event.reminders?.reminder_method,
      },
      organizerEmail: event.organizer_email,
      organizerName: event.organizer_name,
      updatedAt: event.updated_at,
    };

    switch (event.when?.object) {
      case "timespan":
        return {
          ...formattedEvent,
          when: {
            object: event.when.object,
            startTime: event.when.start_time,
            endTime: event.when.end_time,
            startTimezone: event.when.start_timezone,
            endTimezone: event.when.end_timezone,
          },
        };
      case "datespan":
        return {
          ...formattedEvent,
          when: {
            object: event.when.object,
            startDate: event.when.start_date,
            endDate: event.when.end_date,
          },
        };
      case "time":
      case "date":
      default:
        return {
          ...formattedEvent,
          when: event.when,
        };
    }
  });

const getEvents = protectedProcedure.query(async ({ ctx }) => {
  const userNylasAccounts = await ctx.db.query.nylasAccounts.findMany({
    where: eq(nylasAccounts.userId, ctx.session.user.id),
    columns: {
      accessToken: true,
    },
  });
  const nylasAccessTokens = userNylasAccounts.map(
    (account) => account.accessToken,
  );

  const endpoint = "/events";

  try {
    const eventsPromises = nylasAccessTokens.map(async (accessToken) => {
      const { data } = await axios.get<EventsJSON>(
        `${NYLAS_BASE_URL}${endpoint}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Accept-Version": "v1",
          },
        },
      );

      return processEventResponse(data);
    });

    const events = await Promise.all(eventsPromises);
    return ApiResponse<Events>(events.flat());
  } catch (error) {
    if (!(error instanceof Error)) {
      return ApiResponse<Events>(new Error("500 Internal Error"));
    }

    if (axios.isAxiosError(error)) {
      console.error("Something went wrong with axios: ", error.toJSON());
    } else {
      console.error("Something went wrong: ", error.message);
    }
    return ApiResponse<Events>(error);
  }
});

export const nylasRouter = createTRPCRouter({
  upsertAccount,
  getCalendars,
  updateCalendar,
  getEvents,
});
