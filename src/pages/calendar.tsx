import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { type NextRouter, useRouter } from "next/router";
import { useSession } from "next-auth/react";

import { ErrorAlert } from "@/components/Alerts/ErrorAlert";
import { NavMenu } from "@/components/NavMenu";
import { env } from "@/env.mjs";
import { useGetEvents, useUpsertNylasAccount } from "@/hooks/Nylas";
import { useGetUser } from "@/hooks/User";
import { type User } from "@/server/db/schema";
import { type NylasAuthProvider } from "@/types/Nylas";
import { NYLAS_BASE_URL } from "@/utils/common";

const EventCalendar = dynamic(
  () => import("../components/Calendar").then((mod) => mod.Calendar),
  {
    ssr: false,
  },
);

const redirectToNylasAuth = (router: NextRouter) => {
  const baseUrl = window?.location.origin ? window.location.origin : "";

  const params = new URLSearchParams({
    client_id: env.NEXT_PUBLIC_NYLAS_CLIENT_ID ?? "",
    redirect_uri: `${baseUrl}/calendar`,
    response_type: "token",
    scopes: "calendar.read_only",
  });

  void router.push(`${NYLAS_BASE_URL}/oauth/authorize?${params.toString()}`);
};

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

  // const { calendars, isLoading: isLoadingCalendars } = useGetCalendars();
  const { events, isLoading: isLoadingEvents } = useGetEvents();

  useEffect(() => {
    const nylasProvider =
      (router.query.provider as (typeof NylasAuthProvider)[number]) ?? "";
    const nylasAccessToken = (router.query.access_token as string) ?? "";

    if (!nylasProvider || !nylasAccessToken || upsertNylasAccount.isLoading) {
      return;
    }

    // * This is the callback from Nylas OAuth, so we need to save the token
    upsertNylasAccount.mutate({
      provider: nylasProvider,
      accessToken: nylasAccessToken,
    });

    void router.replace("/calendar", undefined, { shallow: true });
  }, [router, upsertNylasAccount]);

  // * If the user is not authenticated with Nylas, redirect to the Nylas auth page
  if (
    !isLoadingUser &&
    !userHasNylasAuth(user) &&
    !upsertNylasAccount.isSuccess
  ) {
    redirectToNylasAuth(router);
  }

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
      <div className="flex h-4/5 w-4/5 items-center">
        <EventCalendar events={events} setError={setCustomError} />
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
