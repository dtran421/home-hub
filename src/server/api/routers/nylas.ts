import axios from "axios";
import { eq } from "drizzle-orm";
import { ApiResponse } from "utils-toolkit";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { nylasAccounts } from "@/server/db/schema";
import { type Events, type EventsJSON, NylasAuthProvider } from "@/types/Nylas";
import { NYLAS_BASE_URL } from "@/utils/common";

const processResponse = (data: EventsJSON): Events =>
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

export const nylasRouter = createTRPCRouter({
  upsertAccount: protectedProcedure
    .input(
      z.object({
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
    }),

  getEvents: protectedProcedure.query(async ({ ctx }) => {
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

        return processResponse(data);
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
  }),
});
