import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { FiPlusSquare } from "react-icons/fi";
import { cn } from "utils-toolkit";

import { ErrorAlert } from "@/components/Alerts/ErrorAlert";
import { NavMenu } from "@/components/NavMenu";
import { env } from "@/env.mjs";
import { useGetGoogleCalendars, useUpdateGoogleCalendar } from "@/hooks/Google";
import {
  useGetEvents,
  useGetNylasCalendars,
  useUpdateNylasCalendar,
  useUpsertNylasAccount,
} from "@/hooks/Nylas";
import { useGetUser } from "@/hooks/User";
import { type User } from "@/server/db/schema";
import { type GoogleCalendar, type GoogleCalendars } from "@/types/Google";
import {
  getNylasAuthProvider,
  type NylasAuthProvider,
  type NylasAuthProviderString,
  type NylasCalendar,
  type NylasCalendars,
} from "@/types/Nylas";
import { NYLAS_BASE_URL } from "@/utils/common";

const EventCalendar = dynamic(
  () => import("../components/Calendar").then((mod) => mod.Calendar),
  {
    ssr: false,
  },
);

type CalendarType = "All" | "Tasks";

type Calendars = (NylasCalendar | GoogleCalendar)[];

type ProviderCalendarMap = Record<
  (typeof NylasAuthProviderString)[number],
  Calendars
>;

type TypeCalendarMap = Record<CalendarType, Partial<ProviderCalendarMap>>;

const getCalendarType = (
  calendar: NylasCalendar | GoogleCalendar,
): CalendarType => {
  if ("kind" in calendar) {
    return "All";
  }

  return calendar.description === "Task Calendar" ? "Tasks" : "All";
};

const postProcessCalendars = (
  nylasCalendars: NylasCalendars | null,
  googleCalendars: GoogleCalendars | null,
): Partial<TypeCalendarMap> | null => {
  const typeCalendarMap: Partial<TypeCalendarMap> = {};

  if (nylasCalendars?.length) {
    nylasCalendars
      .filter((calendar) => !calendar.name.includes("⚠️"))
      .forEach((calendar) => {
        const calendarType = getCalendarType(calendar);
        const provider = getNylasAuthProvider(calendar.provider);

        if (!typeCalendarMap[calendarType]) {
          typeCalendarMap[calendarType] = {
            [provider]: [],
          };
        }

        if (!typeCalendarMap[calendarType]![provider]) {
          typeCalendarMap[calendarType]![provider] = [];
        }

        typeCalendarMap[calendarType]![provider]!.push(calendar);
      });
  }

  if (googleCalendars?.length) {
    const calendarType = "All";
    const provider = "Gmail";

    if (!typeCalendarMap[calendarType]) {
      typeCalendarMap[calendarType] = {
        [provider]: [],
      };
    }

    if (!typeCalendarMap[calendarType]![provider]) {
      typeCalendarMap[calendarType]![provider] = [];
    }

    typeCalendarMap[calendarType]![provider]!.push(...googleCalendars);
  }

  if (!Object.keys(typeCalendarMap).length) {
    return null;
  }

  Object.values(typeCalendarMap).forEach((providerMap) => {
    Object.values(providerMap).forEach((calendars) => {
      calendars.sort((a, b) => {
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
      });
    });
  });

  return typeCalendarMap;
};

const userHasNylasAuth = (user: User | null) => user?.nylasAccounts?.length;

const Calendar = () => {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession({
    required: true,
  });

  const {
    user,
    isLoading: isLoadingUser,
    isError,
    error,
  } = useGetUser(session);
  const upsertNylasAccount = useUpsertNylasAccount();

  const [customError, setCustomError] = useState("");

  const { calendars: nylasCalendars, isLoading: isLoadingNylasCalendars } =
    useGetNylasCalendars(user);
  const updateNylasCalendar = useUpdateNylasCalendar();

  const { calendars: googleCalendars, isLoading: isLoadingGoogleCalendars } =
    useGetGoogleCalendars(user);
  const updateGoogleCalendar = useUpdateGoogleCalendar();

  const calendars = useMemo(
    () => postProcessCalendars(nylasCalendars, googleCalendars),
    [googleCalendars, nylasCalendars],
  );

  const { events, isLoading: isLoadingEvents } = useGetEvents(user);

  const nylasAccountId = (router.query.account_id as string) ?? "";
  const nylasProvider =
    (router.query.provider as (typeof NylasAuthProvider)[number]) ?? "";
  const nylasAccessToken = (router.query.access_token as string) ?? "";

  const redirectToNylasAuth = useCallback(() => {
    const baseUrl = window?.location.origin ? window.location.origin : "";

    const params = new URLSearchParams({
      client_id: env.NEXT_PUBLIC_NYLAS_CLIENT_ID ?? "",
      redirect_uri: `${baseUrl}/calendar`,
      response_type: "token",
      scopes: "calendar.read_only",
    });

    void router.push(`${NYLAS_BASE_URL}/oauth/authorize?${params.toString()}`);
  }, [router]);

  useEffect(() => {
    if (
      nylasAccountId &&
      nylasAccessToken &&
      nylasProvider &&
      !upsertNylasAccount.isLoading
    ) {
      // * This is the callback from Nylas OAuth, so we need to save the token
      void upsertNylasAccount.mutate({
        accountId: nylasAccountId,
        accessToken: nylasAccessToken,
        provider: nylasProvider,
      });

      void router.replace("/calendar", undefined, { shallow: true });
    }

    // * If the user is not authenticated with Nylas, redirect to the Nylas auth page
    if (
      !isLoadingUser &&
      !userHasNylasAuth(user) &&
      !upsertNylasAccount.isLoading
    ) {
      redirectToNylasAuth();
    }
  }, [
    isLoadingUser,
    nylasAccessToken,
    nylasAccountId,
    nylasProvider,
    redirectToNylasAuth,
    router,
    upsertNylasAccount,
    user,
  ]);

  const toggleCalendarActive = (calendar: NylasCalendar | GoogleCalendar) => {
    if ("kind" in calendar) {
      void updateGoogleCalendar.mutate({
        ...calendar,
        active: !calendar.active,
      });
      return;
    }

    void updateNylasCalendar.mutate({
      ...calendar,
      active: !calendar.active,
    });
  };

  console.log("calendars", calendars);

  const loading =
    sessionStatus === "loading" ||
    isLoadingUser ||
    upsertNylasAccount.isLoading ||
    updateGoogleCalendar.isLoading ||
    isLoadingEvents;

  return (
    <div className="flex h-screen w-full flex-col items-center">
      <div className="flex w-full items-center justify-start gap-x-4 px-14 py-8">
        <h1 className="text-4xl font-bold text-gray-200">Calendar</h1>
        {loading ? (
          <span className="loading loading-spinner loading-md text-accent" />
        ) : null}
      </div>
      <div className="flex h-full w-full items-center justify-center space-x-36 px-16 pb-20">
        <div className="flex w-1/5 flex-col">
          {isLoadingNylasCalendars || isLoadingGoogleCalendars ? (
            <span className="loading loading-spinner loading-md text-accent" />
          ) : null}
          {calendars ? (
            <div className="space-y-10">
              {Object.entries(calendars).map(([type, calMap]) => (
                <div key={type}>
                  <h2 className="base-content mb-4 text-xl font-semibold">
                    {type}
                  </h2>
                  <ul className="menu rounded-box bg-base-200">
                    {Object.entries(calMap).map(([provider, cals]) => (
                      <li key={provider}>
                        <span className="menu-dropdown-show menu-dropdown-toggle">
                          {provider}
                        </span>
                        <ul className="menu-dropdown-show menu-dropdown">
                          {cals.map((cal) => (
                            <li key={cal.id} className="form-control">
                              <label
                                className={cn(
                                  "label cursor-pointer gap-x-4",
                                  "justify-start",
                                )}
                              >
                                <input
                                  type="checkbox"
                                  checked={cal.active}
                                  onChange={() => toggleCalendarActive(cal)}
                                  className={cn("checkbox checkbox-sm", {
                                    "checkbox-primary": cal.active,
                                  })}
                                />
                                <h3
                                  className={cn("", {
                                    "text-gray-500": !cal.active,
                                  })}
                                >
                                  {cal.name}
                                </h3>
                              </label>
                            </li>
                          ))}
                        </ul>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : null}
        </div>
        <div className="flex h-4/5 w-3/5 flex-col items-end gap-y-4">
          <button
            className="btn btn-secondary"
            onClick={() => redirectToNylasAuth()}
          >
            <FiPlusSquare size={20} />
            Link Calendar
          </button>
          <EventCalendar events={events} setError={setCustomError} />
        </div>
      </div>
      <NavMenu />
      {isError ||
        (upsertNylasAccount.isError && (
          <ErrorAlert
            message={error?.message ?? upsertNylasAccount.error?.message}
          />
        ))}
      {customError && <ErrorAlert message={customError} />}
    </div>
  );
};

export default Calendar;
