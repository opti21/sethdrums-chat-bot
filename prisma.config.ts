import { defineConfig } from "prisma/config";

// The bot talks to Turso through the libSQL driver adapter at runtime
// (src/utils/prisma.ts). This file drives `prisma generate`.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
});
