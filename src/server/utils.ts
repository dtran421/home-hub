import { env } from "@/env.mjs";

export const IS_PROD = env.NODE_ENV === "production";
