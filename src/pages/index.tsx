import { type FormEvent, useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/router";
import { type Session } from "next-auth";
import { signIn, useSession } from "next-auth/react";
import moment from "moment";
import { FcGoogle } from "react-icons/fc";
import { FiEdit2, FiRefreshCw } from "react-icons/fi";

import { ErrorAlert } from "@/components/Alerts/ErrorAlert";
import { WarningAlert } from "@/components/Alerts/WarningAlert";
import { NavMenu } from "@/components/NavMenu";
import { useGetUnsplashImage } from "@/hooks/Unsplash";
import { useGetUser, useUpdateUser } from "@/hooks/User";
import { type User } from "@/server/db/schema";

const getHeaderText = (
  session: Session | null,
  user: User | null,
  loading: boolean,
) => {
  if (loading) {
    return "Loading...";
  }

  if (user) {
    return `Welcome home, ${user.name ?? "stranger"}`;
  }

  if (session) {
    return "Hello, what may I call you?";
  }

  return "Sign in to get started";
};

interface MainPageProps {
  refreshBg: () => void;
  isRefreshingBg: boolean;
}

const MainPage = ({ refreshBg, isRefreshingBg }: MainPageProps) => {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession({
    required: false,
  });

  const {
    user,
    isFetched: isUserFetched,
    isLoading: isLoadingUser,
    isError,
    error,
  } = useGetUser(session);
  const updateUser = useUpdateUser();

  const [showEditor, toggleShowEditor] = useState(session && !user?.name);
  useEffect(() => {
    toggleShowEditor(session && !user?.name);
  }, [session, user?.name]);

  const [name, setName] = useState(user?.name ?? "");
  useEffect(() => {
    setName(user?.name ?? "");
  }, [user?.name]);

  const [time, setTime] = useState(moment().format("h:mm A"));
  useEffect(() => {
    const interval = setInterval(
      () => setTime(moment().format("h:mm A")),
      1000,
    );
    return () => clearInterval(interval);
  }, []);

  const [customError, setCustomError] = useState("");
  useEffect(() => {
    if (customError) {
      setTimeout(() => setCustomError(""), 5000);
    }
  }, [customError]);

  const submitHandler = (e: FormEvent) => {
    e.preventDefault();

    updateUser.mutate({
      name,
    });
  };

  const signInCallbackUrl = router.query.callbackUrl as string | undefined;

  const loadingUser =
    sessionStatus === "loading" ||
    (isUserFetched && isLoadingUser) ||
    updateUser.isLoading;
  const headerText = getHeaderText(session, user, loadingUser);

  return (
    <>
      <div className="indicator">
        {!!user?.name && (
          <button
            className="badge indicator-item badge-secondary"
            onClick={() => toggleShowEditor(!showEditor)}
          >
            <FiEdit2 />
          </button>
        )}
        <div className="flex flex-col items-center space-y-8 rounded-md bg-neutral/30 px-8 py-6 backdrop-blur-sm">
          {loadingUser ? (
            <span className="loading loading-bars loading-md text-accent" />
          ) : (
            <h1 className="text-center font-mono text-2xl font-bold text-gray-100">
              {headerText}
            </h1>
          )}
          {!loadingUser && !session && (
            <button
              className="btn btn-neutral btn-wide"
              onClick={() =>
                void signIn("google", {
                  callbackUrl: signInCallbackUrl ?? "/",
                })
              }
            >
              <FcGoogle size={20} /> Sign in with Google
            </button>
          )}
          {!loadingUser && showEditor && (
            <form onSubmit={submitHandler}>
              <input
                type="text"
                placeholder="Tony Stark"
                className="input input-bordered input-primary w-full max-w-xs text-center"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              {updateUser.isLoading && (
                <span className="loading loading-spinner loading-md text-accent" />
              )}
            </form>
          )}
          {!loadingUser && user?.name ? (
            <h2 className="text-center font-mono text-6xl font-bold text-white">
              {time}
            </h2>
          ) : null}
        </div>
      </div>
      <div className="absolute bottom-4 right-4">
        <button
          className="btn btn-circle text-accent"
          onClick={() => {
            if (!user) {
              setCustomError("Please sign in to refresh the background");
              return;
            }
            refreshBg();
          }}
          disabled={isRefreshingBg}
        >
          <FiRefreshCw size={20} />
        </button>
      </div>
      <NavMenu />
      {isError && <ErrorAlert message={error?.message} />}
      {customError && (
        <WarningAlert
          message={customError}
          onClose={() => {
            setCustomError("");
          }}
        />
      )}
    </>
  );
};

const Home = () => {
  const { img, isFetching, isError, error, refresh } = useGetUnsplashImage();

  return (
    <main className="flex h-screen w-full flex-col items-center justify-center bg-base-100 p-4">
      {img && (
        <figure className="fixed h-full w-full">
          <Image alt="unsplash bg image" src={img.urls.full} fill priority />
        </figure>
      )}
      <div className="z-10">
        <MainPage refreshBg={refresh} isRefreshingBg={isFetching} />
        {isError && <ErrorAlert message={error?.message} />}
      </div>
    </main>
  );
};

export default Home;
