import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { FiPlusSquare } from "react-icons/fi";
import { cn } from "utils-toolkit";

import { ErrorAlert } from "@/components/Alerts/ErrorAlert";
import { NavMenu } from "@/components/NavMenu";
import { env } from "@/env.mjs";
import {
  useGetCalendars,
  useGetEvents,
  useUpdateCalendar,
  useUpsertNylasAccount,
} from "@/hooks/Nylas";
import { useGetUser } from "@/hooks/User";
import { type User } from "@/server/db/schema";
import { Calendar, type NylasAuthProvider } from "@/types/Nylas";
import { NYLAS_BASE_URL } from "@/utils/common";

const EventCalendar = dynamic(
  () => import("../components/Calendar").then((mod) => mod.Calendar),
  {
    ssr: false,
  },
);

const userHasNylasAuth = (user: User | null) => user?.nylasAccounts?.length;

const Calendar = () => {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();

  const {
    user,
    isLoading: isLoadingUser,
    isError,
    error,
  } = useGetUser(session);
  const upsertNylasAccount = useUpsertNylasAccount();

  const [customError, setCustomError] = useState("");

  const { calendars, isLoading: isLoadingCalendars } = useGetCalendars();
  const updateCalendar = useUpdateCalendar();

  const { events, isLoading: isLoadingEvents } = useGetEvents();

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

  const toggleCalendarActive = (calendar: Calendar) => {
    updateCalendar.mutate({
      ...calendar,
      active: !calendar.active,
    });
  };

  console.log("calendars", calendars);

  const loading =
    sessionStatus === "loading" ||
    isLoadingUser ||
    upsertNylasAccount.isLoading ||
    isLoadingEvents;

  return (
    <div className="flex h-screen w-full flex-col items-center">
      <div className="flex w-full items-center justify-start gap-x-4 px-14 py-8">
        <h1 className="text-4xl font-bold text-gray-200">Calendar</h1>
        {loading ? (
          <span className="loading loading-spinner loading-md text-accent" />
        ) : null}
      </div>
      <div className="flex h-full w-full items-center justify-center space-x-48 px-16 pb-20">
        <div className="flex w-1/5 flex-col">
          {isLoadingCalendars ? (
            <span className="loading loading-spinner loading-md text-accent" />
          ) : null}
          {calendars ? (
            <div className="space-y-10">
              {Object.entries(calendars).map(([calType, cals]) => (
                <div key={calType}>
                  <h2 className="base-content text-xl font-semibold">
                    {calType}
                  </h2>
                  <div className="divider" />
                  <ul className="space-y-2">
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
                </div>
              ))}
            </div>
          ) : null}
        </div>
        <div className="flex h-4/5 w-3/5 flex-col items-end gap-y-4 overflow-hidden rounded-lg">
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
