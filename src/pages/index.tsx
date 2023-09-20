import { useState, useEffect, type FormEvent, type ReactNode } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import Head from "next/head";
import { FiEdit2, FiRefreshCw } from "react-icons/fi";

import { useCreateUser, useGetUser, useUpdateUser } from "@/hooks/User";
import { ErrorAlert } from "@/components/Alerts/ErrorAlert";
import { NavMenu } from "@/components/NavMenu";
import { useGetUnsplashImage } from "@/hooks/Unsplash";

const Home = () => {
  const { user, isLoading, isError, error } = useGetUser();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();

  const [showEditor, toggleShowEditor] = useState(!user?.name);
  useEffect(() => {
    toggleShowEditor(!user?.name);
  }, [user?.name]);

  const [name, setName] = useState(user?.name ?? "");

  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const [refreshBg, toggleRefreshBg] = useState(false);
  useEffect(() => {
    if (refreshBg) {
      toggleRefreshBg(false);
    }
  }, [refreshBg]);

  const submitHandler = (e: FormEvent) => {
    e.preventDefault();

    if (user === null) {
      return createUser.mutate({ name });
    }

    updateUser.mutate({
      id: "1",
      name,
    });
  };

  const loading = isLoading || createUser.isLoading || updateUser.isLoading;
  let headerText;
  if (!showEditor) {
    headerText = `Welcome home, ${user?.name ?? "stranger"}`;
  } else if (!loading) {
    headerText = "Hello, what may I call you?";
  }

  return (
    <>
      <Head>
        <title>Home Hub</title>
        <meta name="description" content="Modern digital hub for the home" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <BackgroundContainer refreshBg={refreshBg}>
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
            {loading ? (
              <span className="loading loading-bars loading-md text-accent" />
            ) : (
              <h1 className="text-center font-mono text-2xl font-bold text-gray-100">
                {headerText}
              </h1>
            )}
            {!loading && showEditor && (
              <form onSubmit={submitHandler}>
                <input
                  type="text"
                  placeholder="Tony Stark"
                  className="input input-bordered input-primary w-full max-w-xs text-center"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                {(createUser.isLoading || updateUser.isLoading) && (
                  <span className="loading loading-spinner loading-md text-accent" />
                )}
              </form>
            )}
            {!loading && user?.name ? (
              <h2 className="text-center font-mono text-6xl font-bold text-white">
                {time.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </h2>
            ) : null}
          </div>
        </div>
        <div className="absolute bottom-4 right-4">
          <button
            className="btn btn-circle text-accent"
            onClick={() => toggleRefreshBg(true)}
          >
            <FiRefreshCw size={20} />
          </button>
        </div>
        <NavMenu />
        {isError && <ErrorAlert message={error?.message} />}
      </BackgroundContainer>
    </>
  );
};

interface BackgroundContainerProps {
  refreshBg: boolean;
  children: ReactNode;
}

const BackgroundContainer = (props: BackgroundContainerProps) => {
  const { img, isLoading, refresh } = useGetUnsplashImage();

  if (props.refreshBg) {
    refresh();
  }

  return isLoading ? (
    <main className="flex h-screen w-full flex-col items-center justify-center bg-base-100 p-4">
      {props.children}
    </main>
  ) : (
    <main
      className="flex h-screen w-full flex-col items-center justify-center bg-cover bg-center p-4"
      style={{
        backgroundImage: `url(${img?.urls.full})`,
      }}
    >
      {props.children}
    </main>
  );
};

/* function AuthShowcase() {
  const { data: sessionData } = useSession();

  const { data: secretMessage } = api.example.getSecretMessage.useQuery(
    undefined, // no input
    { enabled: sessionData?.user !== undefined },
  );

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <p className="text-center text-2xl text-white">
        {sessionData && <span>Logged in as {sessionData.user?.name}</span>}
        {secretMessage && <span> - {secretMessage}</span>}
      </p>
      <button
        className="rounded-full bg-white/10 px-10 py-3 font-semibold text-white no-underline transition hover:bg-white/20"
        onClick={sessionData ? () => void signOut() : () => void signIn()}
      >
        {sessionData ? "Sign out" : "Sign in"}
      </button>
    </div>
  );
} */

export default Home;
