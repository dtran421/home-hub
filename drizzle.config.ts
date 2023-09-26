import { type Config } from "drizzle-kit";

import { env } from "@/env.mjs";
import { IS_PROD } from "@/server/utils";

export default {
  schema: "./src/server/db/schema.ts",
  driver: "mysql2",
  out: "./drizzle",
  dbCredentials: {
    connectionString: IS_PROD ? env.DATABASE_URL : env.DEV_DATABASE_URL,
  },
} satisfies Config;
