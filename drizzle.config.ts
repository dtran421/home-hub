import { type Config } from "drizzle-kit";

import { env, IS_PROD } from "@/env.mjs";

export default {
  schema: "./src/server/db/schema.ts",
  driver: "mysql2",
  out: "./drizzle",
  dbCredentials: {
    connectionString: IS_PROD ? env.DATABASE_URL : env.DEV_DATABASE_URL,
  },
} satisfies Config;
