import { type GetServerSidePropsContext } from "next";
import {
  type DefaultSession,
  getServerSession,
  type NextAuthOptions,
} from "next-auth";
import type { Adapter } from "next-auth/adapters";
import GoogleProvider, { type GoogleProfile } from "next-auth/providers/google";
import { eq } from "drizzle-orm";
import { mysqlTable } from "drizzle-orm/mysql-core";
import moment from "moment";

import { DrizzleAdapter } from "@auth/drizzle-adapter";

import { env } from "@/env.mjs";
import { db } from "@/server/db";
import { type UserRole } from "@/types/User";

import { accounts, users } from "./db/schema";

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
  interface User {
    id: string;
    role: UserRole;
  }

  interface Session extends DefaultSession {
    user: User & DefaultSession["user"];
  }
}

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authOptions: NextAuthOptions = {
  pages: {
    signIn: "/",
    // error: "/auth/error", // Error code passed in query string as ?error=
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user, account }) {
      if (!account?.access_token || !account?.expires_at) {
        return true;
      }

      await db
        .update(accounts)
        .set({
          access_token: account.access_token,
          expires_at: account.expires_at,
        })
        .where(eq(accounts.userId, user.id));

      return true;
    },
    /* @ts-expect-error: force return empty object if access token is expired */
    async session({ session, token }) {
      if (!session.user || !token) {
        return session;
      }

      if (token.sub) {
        session.user.id = token.sub;

        const user = await db.query.users.findFirst({
          where: eq(users.id, token.sub),
          columns: {
            role: true,
          },
          with: {
            accounts: {
              columns: {
                expires_at: true,
              },
            },
          },
        });

        session.user.role = user?.role ?? "user";

        const expires_at = user?.accounts?.[0]?.expires_at;
        session.expires = (
          expires_at ? moment.unix(expires_at) : moment().add(1, "hours")
        ).toISOString();
      }

      if (moment(session.expires).isSameOrBefore(moment())) {
        return {};
      }

      return session;
    },
    redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      }

      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) {
        return url;
      }

      return baseUrl;
    },
  },
  adapter: DrizzleAdapter(db, mysqlTable) as Adapter,
  providers: [
    GoogleProvider<GoogleProfile>({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          scope:
            "openid email profile https://www.googleapis.com/auth/calendar.readonly",
        },
      },
    }),
  ],
};

/**
 * Wrapper for `getServerSession` so that you don't need to import the `authOptions` in every file.
 *
 * @see https://next-auth.js.org/configuration/nextjs
 */
export const getServerAuthSession = (ctx: {
  req: GetServerSidePropsContext["req"];
  res: GetServerSidePropsContext["res"];
}) => {
  return getServerSession(ctx.req, ctx.res, authOptions);
};
