import { type AdapterAccount } from "next-auth/adapters";
import { relations, sql } from "drizzle-orm";
import {
  index,
  int,
  mysqlEnum,
  mysqlTable,
  primaryKey,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

import { NylasAuthProvider } from "@/types/Nylas";
import { UserRoles } from "@/types/User";

export const users = mysqlTable("user", {
  id: varchar("id", { length: 191 })
    .primaryKey()
    .notNull()
    .$defaultFn(() => crypto.randomUUID()),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 255 }).notNull(),
  emailVerified: timestamp("emailVerified", {
    mode: "date",
    fsp: 3,
  }).default(sql`CURRENT_TIMESTAMP(3)`),
  image: varchar("image", { length: 255 }),
  city: varchar("city", { length: 255 }),
  role: mysqlEnum("role", UserRoles).notNull().default("user"),
});

// return type when queried
export type User = typeof users.$inferSelect & {
  nylasAccounts?: Partial<typeof nylasAccounts.$inferSelect>[];
};
// insert type
export type NewUser = typeof users.$inferInsert;

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  nylasAccounts: many(nylasAccounts),
}));

export const accounts = mysqlTable(
  "account",
  {
    userId: varchar("userId", { length: 255 }).notNull(),
    type: varchar("type", { length: 255 })
      .$type<AdapterAccount["type"]>()
      .notNull(),
    provider: varchar("provider", { length: 255 }).notNull(),
    providerAccountId: varchar("providerAccountId", { length: 255 }).notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: int("expires_at"),
    token_type: varchar("token_type", { length: 255 }),
    scope: varchar("scope", { length: 255 }),
    id_token: text("id_token"),
    session_state: varchar("session_state", { length: 255 }),
  },
  (account) => ({
    compoundKey: primaryKey(account.provider, account.providerAccountId),
    userIdIdx: index("userId_idx").on(account.userId),
  }),
);

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const nylasAccounts = mysqlTable(
  "nylasAccount",
  {
    userId: varchar("userId", { length: 255 }).notNull(),
    accountId: varchar("accountId", { length: 255 }).notNull().primaryKey(),
    provider: mysqlEnum("provider", NylasAuthProvider).notNull(),
    accessToken: text("accessToken").notNull(),
  },
  (account) => ({
    userIdIdx: index("userId_idx").on(account.userId),
  }),
);

export const nylasAccountsRelations = relations(
  nylasAccounts,
  ({ one, many }) => ({
    user: one(users, {
      fields: [nylasAccounts.userId],
      references: [users.id],
    }),
    nylasCalendars: many(nylasCalendars),
  }),
);

export const nylasCalendars = mysqlTable("nylasCalendar", {
  accountId: varchar("accountId", { length: 255 }).notNull(),
  calendarId: varchar("calendarId", { length: 255 }).primaryKey().notNull(),
  provider: mysqlEnum("provider", NylasAuthProvider).notNull(),
  active: int("active").notNull().default(1),
});

export const nylasCalendarsRelations = relations(nylasCalendars, ({ one }) => ({
  nylasAccounts: one(nylasAccounts, {
    fields: [nylasCalendars.accountId],
    references: [nylasAccounts.accountId],
  }),
}));

export const sessions = mysqlTable(
  "session",
  {
    sessionToken: varchar("sessionToken", { length: 255 })
      .notNull()
      .primaryKey(),
    userId: varchar("userId", { length: 255 }).notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (session) => ({
    userIdIdx: index("userId_idx").on(session.userId),
  }),
);

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const verificationTokens = mysqlTable(
  "verificationToken",
  {
    identifier: varchar("identifier", { length: 255 }).notNull(),
    token: varchar("token", { length: 255 }).notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey(vt.identifier, vt.token),
  }),
);
