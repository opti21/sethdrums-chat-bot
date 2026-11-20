import { createClient, WatchError } from "redis";
import { mergeOrder, move, withoutIds } from "./queueOrder";

export { mergeOrder, move };

/**
 * The suggestion list state, in one of two places picked by QUEUE_BACKEND
 * (must match the frontend's):
 *
 * - "redis" (default): the RedisJSON document at `Queue:<QUEUE_ID>`, written
 *   with WATCH/MULTI transactions like the frontend (lib/server/queue.ts), so
 *   neither side can overwrite the other's change.
 * - "do": the frontend repo's queue Durable Object (queue-worker/), reached
 *   at QUEUE_WORKER_URL. It applies one change at a time and tells open
 *   panels itself.
 *
 * Field names here must match the frontend's.
 */
export type QueueState = {
  order: string[];
  is_updating: boolean;
  is_paused: boolean;
  being_updated_by: string;
  now_playing: string;
  is_open: boolean;
  currently_processing: string[];
  is_subOnly: boolean;
};

type QueuePatch = Partial<Pick<QueueState, "order" | "currently_processing" | "now_playing">>;
type QueueFlags = Partial<
  Pick<QueueState, "is_updating" | "is_paused" | "being_updated_by" | "now_playing" | "is_open" | "is_subOnly">
>;

const TIMEOUT_MS = 5_000;

type RedisClient = ReturnType<typeof createClient>;

let shared: RedisClient | undefined;
let connecting: Promise<RedisClient> | undefined;

export function queueBackend(): "redis" | "do" {
  return process.env.QUEUE_BACKEND === "do" ? "do" : "redis";
}

function queueId() {
  const id = process.env.QUEUE_ID;
  if (!id) {
    throw new Error("QUEUE_ID is not set");
  }
  return id;
}

function queueKey() {
  return `Queue:${queueId()}`;
}

type DoReply = { state: QueueState; version: number; changed: boolean; result?: unknown };

/** Call the queue Worker (Durable Object backend and realtime relay). */
export async function callQueueWorker<T>(path: "/rpc" | "/broadcast", body: Record<string, unknown>): Promise<T> {
  const base = process.env.QUEUE_WORKER_URL;
  const secret = process.env.QUEUE_WORKER_SECRET;
  if (!base || !secret) {
    throw new Error("QUEUE_WORKER_URL and QUEUE_WORKER_SECRET must be set");
  }
  const response = await fetch(new URL(path, base), {
    method: "POST",
    headers: { Authorization: `Bearer ${secret}`, "content-type": "application/json" },
    body: JSON.stringify({ room: queueId(), ...body }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const data = (await response.json().catch(() => ({}))) as T & { error?: string };
  if (!response.ok) {
    throw new Error(`Queue worker ${path} failed (${response.status}): ${data.error ?? "no body"}`);
  }
  return data;
}

async function doOp(op: Record<string, unknown>) {
  const reply = await callQueueWorker<DoReply>("/rpc", op);
  return { ...reply, state: normalize(reply.state) };
}

function withTimeout<T>(promise: Promise<T>, message: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), TIMEOUT_MS);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}

function newClient(): RedisClient {
  const url = process.env.REDIS_URL;
  if (!url) {
    throw new Error("REDIS_URL is not set");
  }
  const client = createClient({
    url,
    // Fail commands while the socket is down instead of queueing them
    // until a reconnect that may never come.
    disableOfflineQueue: true,
    socket: { connectTimeout: TIMEOUT_MS, reconnectStrategy: false },
  });
  client.on("error", (error) => console.error("[redis] client error", error));
  return client;
}

async function getClient(): Promise<RedisClient> {
  if (shared?.isReady) {
    return shared;
  }
  if (!connecting) {
    const client = newClient();
    client.on("end", () => {
      if (shared === client) shared = undefined;
    });
    connecting = withTimeout(client.connect(), "Redis connection timed out")
      .then(() => {
        shared = client;
        return client;
      })
      .catch((error) => {
        client.destroy();
        throw error;
      })
      .finally(() => {
        connecting = undefined;
      });
  }
  return connecting;
}

/** Run one Redis call on the shared connection with a hard timeout. */
async function withRedis<T>(fn: (client: RedisClient) => Promise<T>): Promise<T> {
  const client = await getClient();
  try {
    return await withTimeout(fn(client), "Redis command timed out");
  } catch (error) {
    if (error instanceof Error && error.message === "Redis command timed out") {
      console.error("[redis] command timed out, dropping connection");
      if (shared === client) shared = undefined;
      client.destroy();
    }
    throw error;
  }
}

/**
 * Run a WATCH/MULTI transaction on its own short-lived connection, so the
 * WATCH can't be cleared by other commands sharing the main connection.
 */
async function withIsolatedRedis<T>(fn: (client: RedisClient) => Promise<T>): Promise<T> {
  const client = newClient();
  try {
    await withTimeout(client.connect(), "Redis connection timed out");
    return await withTimeout(fn(client), "Redis command timed out");
  } finally {
    client.destroy();
  }
}

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((item) => item != null && item !== "").map(String);
}

function normalize(raw: unknown): QueueState {
  if (!raw || typeof raw !== "object") {
    throw new Error("Queue document not found in Redis");
  }
  const doc = raw as Record<string, unknown>;
  return {
    order: stringArray(doc.order),
    currently_processing: stringArray(doc.currently_processing),
    now_playing: typeof doc.now_playing === "string" ? doc.now_playing : "",
    being_updated_by: typeof doc.being_updated_by === "string" ? doc.being_updated_by : "",
    is_updating: Boolean(doc.is_updating),
    is_paused: Boolean(doc.is_paused),
    is_open: Boolean(doc.is_open),
    is_subOnly: Boolean(doc.is_subOnly),
  };
}

export async function readQueue(): Promise<QueueState> {
  if (queueBackend() === "do") return (await doOp({ op: "get" })).state;
  return normalize(await withRedis((redis) => redis.json.get(queueKey())));
}

/**
 * Set plain fields (flags, now playing). Each JSON.SET touches only its own
 * path, so it can't clobber the order or anyone else's change.
 */
export async function setQueueFields(fields: QueueFlags) {
  if (queueBackend() === "do") {
    await doOp({ op: "setFields", fields });
    return;
  }
  const key = queueKey();
  await withRedis(async (redis) => {
    const multi = redis.multi();
    for (const [field, value] of Object.entries(fields)) {
      multi.json.set(key, `$.${field}`, value as never);
    }
    await multi.exec();
  });
}

/**
 * Read-modify-write on the queue that can't lose a concurrent change. The
 * key is WATCHed, so if the panel or another bot command writes it between
 * our read and our write, the write is thrown away and `change` runs again
 * on the fresh state. Return null from `change` to write nothing. Resolves
 * to the state that was written, or null when nothing was.
 */
async function updateQueue(change: (queue: QueueState) => QueuePatch | null): Promise<QueueState | null> {
  const key = queueKey();
  for (let attempt = 0; attempt < 8; attempt++) {
    const outcome = await withIsolatedRedis(async (redis) => {
      await redis.watch(key);
      const queue = normalize(await redis.json.get(key));
      const patch = change(queue);
      if (!patch) {
        await redis.unwatch();
        return { written: null };
      }
      const multi = redis.multi();
      for (const [field, value] of Object.entries(patch)) {
        multi.json.set(key, `$.${field}`, value as never);
      }
      try {
        await multi.exec();
      } catch (error) {
        if (error instanceof WatchError) return "retry" as const;
        throw error;
      }
      return { written: { ...queue, ...patch } };
    });
    if (outcome !== "retry") return outcome.written;
    // Small random wait so racing writers don't collide again in lockstep.
    await new Promise((resolve) => setTimeout(resolve, 10 + Math.random() * 40 * (attempt + 1)));
  }
  throw new Error("The suggestion list is changing too fast, try again");
}

/*
 * The operations below are what the bot's commands use. Each one works on
 * either backend. They resolve to true when the list changed.
 */

export async function addId(id: string) {
  if (queueBackend() === "do") return (await doOp({ op: "add", id })).changed;
  const written = await updateQueue((q) => (q.order.includes(id) ? null : { order: [...q.order, id] }));
  return written !== null;
}

export async function removeIds(ids: string[]) {
  if (queueBackend() === "do") return (await doOp({ op: "remove", ids })).changed;
  const written = await updateQueue((q) => {
    const next = withoutIds(q.order, ids);
    return next.length === q.order.length ? null : { order: next };
  });
  return written !== null;
}

/** Save a submitted order, merged with the live one (see mergeOrder). */
export async function reorder(order: string[]) {
  if (queueBackend() === "do") return (await doOp({ op: "reorder", order })).changed;
  await updateQueue((q) => ({ order: mergeOrder(q.order, order) }));
  return true;
}

/** Move `id` to `index`. False if it isn't in the list. */
export async function moveId(id: string, index: number) {
  if (queueBackend() === "do") return (await doOp({ op: "move", id, index })).result === true;
  let found = false;
  await updateQueue((q) => {
    const from = q.order.indexOf(id);
    found = from !== -1;
    return found ? { order: move(q.order, from, index) } : null;
  });
  return found;
}

/** Mark a request as being changed. False if someone else already has it. */
export async function claim(id: string) {
  if (queueBackend() === "do") return (await doOp({ op: "claim", id })).result === true;
  const written = await updateQueue((q) =>
    q.currently_processing.includes(id) ? null : { currently_processing: [...q.currently_processing, id] }
  );
  return written !== null;
}

export async function release(id: string) {
  if (queueBackend() === "do") return (await doOp({ op: "release", id })).changed;
  const written = await updateQueue((q) =>
    q.currently_processing.includes(id)
      ? { currently_processing: q.currently_processing.filter((item) => item !== id) }
      : null
  );
  return written !== null;
}

/** Close the shared connection (tests and shutdown). */
export async function closeQueueRedis() {
  const client = shared;
  shared = undefined;
  if (client?.isOpen) await client.close();
}
