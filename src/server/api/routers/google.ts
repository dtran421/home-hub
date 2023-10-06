import axios from "axios";
import { eq } from "drizzle-orm";
import { ApiResponse } from "utils-toolkit";
import { z } from "zod";

import { googleCalendars, users } from "@/server/db/schema";
import {
  type GoogleCalendar,
  type GoogleCalendars,
  type GoogleCalendarsJSON,
} from "@/types/Google";

import { createTRPCRouter, protectedProcedure } from "../trpc";

const GOOGLE_BASE_URL = "https://www.googleapis.com/calendar/v3/users/me";

const processCalendarResponse = (
  calendars: GoogleCalendarsJSON,
): GoogleCalendars =>
  calendars.items.map((calendar) => ({
    id: calendar.id,
    description: calendar.description ?? null,
    kind: calendar.kind,
    name: calendar.summary,
    timezone: calendar.timeZone ?? null,
    readOnly: true,
    isPrimary: calendar.primary ?? null,
    hexColor: calendar.backgroundColor ?? null,
    active: true,
  }));

const getCalendars = protectedProcedure.query(async ({ ctx }) => {
  const user = await ctx.db.query.users.findFirst({
    where: eq(users.id, ctx.session.user.id),
    with: {
      accounts: {
        columns: {
          access_token: true,
        },
      },
      googleCalendars: {
        columns: {
          calendarId: true,
          active: true,
        },
      },
    },
  });

  if (!user?.accounts?.length) {
    return ApiResponse<GoogleCalendars>(new Error("500 Internal Error"));
  }

  const { access_token: accessToken } = user.accounts[0]!;

  const existingCalendarMap = user.googleCalendars.reduce(
    (map, cal) => {
      map[cal.calendarId] = !!cal.active;
      return map;
    },
    {} as Record<string, boolean>,
  );

  const endpoint = "/calendarList";

  try {
    const { data } = await axios.get<GoogleCalendarsJSON>(
      `${GOOGLE_BASE_URL}${endpoint}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
        },
      },
    );

    const calendars = processCalendarResponse(data);

    const calendarsToInsert = calendars
      .filter((cal) => !(cal.id in existingCalendarMap))
      .map((calendar) => ({
        userId: ctx.session.user.id,
        calendarId: calendar.id,
      }));

    if (calendarsToInsert.length) {
      await ctx.db.insert(googleCalendars).values(calendarsToInsert);
    }

    return ApiResponse<GoogleCalendars>(
      calendars.map((cal) => ({
        ...cal,
        active: existingCalendarMap[cal.id] ?? true,
      })),
    );
  } catch (error) {
    if (!(error instanceof Error)) {
      return ApiResponse<GoogleCalendars>(new Error("500 Internal Error"));
    }

    if (axios.isAxiosError(error)) {
      console.error("Something went wrong with axios: ", error.toJSON());
    } else {
      console.error("Something went wrong: ", error.message);
    }
    return ApiResponse<GoogleCalendars>(error);
  }
});

const updateCalendar = protectedProcedure
  .input(
    z.object({
      name: z.string(),
      description: z.string().nullable(),
      timezone: z.string().nullable(),
      id: z.string(),
      kind: z.literal("calendar#calendarListEntry"),
      readOnly: z.literal(true),
      isPrimary: z.boolean().optional().nullable(),
      hexColor: z.string().optional().nullable(),
      active: z.boolean(),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const { id, active } = input;

    const calendar = await ctx.db.query.googleCalendars.findFirst({
      where: eq(googleCalendars.calendarId, id),
    });
    if (!calendar) {
      return ApiResponse<GoogleCalendar>(new Error("404 Calendar not found"));
    }

    await ctx.db
      .update(googleCalendars)
      .set({ active: active ? 1 : 0 })
      .where(eq(googleCalendars.calendarId, id));

    console.info(`Successfully updated Google calendar ${id}`);

    return ApiResponse<GoogleCalendar>({
      ...input,
      active,
    });
  });

export const googleRouter = createTRPCRouter({
  getCalendars,
  updateCalendar,
  // getEvents,
});
