import { drizzle } from "drizzle-orm/planetscale-serverless";

import { Client } from "@planetscale/database";

import { env, IS_PROD } from "@/env.mjs";

import * as schema from "./schema";

export const db = drizzle(
  new Client({
    url: IS_PROD ? env.DATABASE_URL : env.DEV_DATABASE_URL,
  }).connection(),
  { schema },
);
