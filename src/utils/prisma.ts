import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "../generated/prisma/client";

const QUERY_TIMEOUT_MS = 10_000;
const SLOW_QUERY_MS = 2_000;

// Same Turso setup as the frontend (lib/server/prisma.ts). Turso is reached
// over plain HTTPS instead of a long-lived WebSocket: a WebSocket that goes
// quiet never errors, so every query on it would wait forever.
function toHttpUrl(url: string | undefined) {
  if (!url) {
    throw new Error("TURSO_DATABASE_URL is not set");
  }
  return url.replace(/^(libsql|wss):\/\//, "https://");
}

// The libSQL client has no request timeout of its own. Each request also
// opens a fresh connection: on Render, pooled keep-alive sockets to Turso go
// dead a minute or two after boot and every query on them stalls.
function fetchWithTimeout(input: RequestInfo | URL, init?: RequestInit) {
  const signal = AbortSignal.timeout(QUERY_TIMEOUT_MS);
  if (input instanceof Request) {
    const headers = new Headers(input.headers);
    headers.set("connection", "close");
    return fetch(new Request(input, { signal, headers }));
  }
  const headers = new Headers(init?.headers);
  headers.set("connection", "close");
  return fetch(input, { ...init, headers, signal });
}

const adapter = new PrismaLibSql({
  url: toHttpUrl(process.env.TURSO_DATABASE_URL),
  authToken: process.env.TURSO_AUTH_TOKEN,
  fetch: fetchWithTimeout,
});

export const prisma = new PrismaClient({ adapter }).$extends({
  query: {
    async $allOperations({ model, operation, args, query }) {
      const started = Date.now();
      try {
        return await query(args);
      } catch (error) {
        console.error(
          `[prisma] ${model}.${operation} failed after ${Date.now() - started}ms`,
          error
        );
        throw error;
      } finally {
        const elapsed = Date.now() - started;
        if (elapsed > SLOW_QUERY_MS) {
          console.warn(`[prisma] slow query ${model}.${operation}: ${elapsed}ms`);
        }
      }
    },
  },
});
