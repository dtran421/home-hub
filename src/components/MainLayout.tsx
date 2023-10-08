import { type ReactNode } from "react";
import Head from "next/head";
import Image from "next/image";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import _ from "lodash";

import { NavMenu } from "./NavMenu";

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();

  const page = _.startCase(router.pathname.slice(1)) || "Home";

  return (
    <>
      <Head>
        <title>{`Home Hub | ${page}`}</title>
        <meta name="description" content="Modern digital hub for the home" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="relative h-screen w-full">
        {sessionStatus === "authenticated" ? (
          <Image
            alt="user profile picture"
            className="mask mask-hexagon absolute right-8 top-6 z-50"
            src={
              session?.user?.image ??
              "https://freepngimg.com/thumb/google/66726-customer-account-google-service-button-search-logo.png" // default Google profile picture
            }
            height={96}
            width={96}
          />
        ) : null}
        <div className="flex h-full w-full flex-col items-center justify-center bg-base-100 p-4">
          {children}
        </div>
        <NavMenu />
      </main>
    </>
  );
};

export default MainLayout;
