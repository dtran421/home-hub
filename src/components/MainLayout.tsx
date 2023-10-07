import { type ReactNode } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import _ from "lodash";

import { NavMenu } from "./NavMenu";

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const router = useRouter();
  const page = _.startCase(router.pathname.slice(1)) || "Home";

  return (
    <>
      <Head>
        <title>{`Home Hub | ${page}`}</title>
        <meta name="description" content="Modern digital hub for the home" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="relative h-screen w-full">
        <div className="flex h-full w-full flex-col items-center justify-center bg-base-100 p-4">
          {children}
        </div>
        <NavMenu />
      </main>
    </>
  );
};

export default MainLayout;
