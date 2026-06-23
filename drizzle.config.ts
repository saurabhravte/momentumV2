import { type Config } from "drizzle-kit";

import { env } from "@/env";

export default {
  // Include both the Corsair cache schema and the Better Auth tables.
  schema: [
    "./src/server/db/schema.ts",
    "./src/server/db/auth-schema.ts",
  ],
  dialect: "postgresql",
  dbCredentials: {
    url: env.DATABASE_URL,
  },
} satisfies Config;
