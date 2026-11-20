import { createClient, WatchError } from "redis";

/**
 * Conflict-safe writes to the queue document at `Queue:<QUEUE_ID>`.
 *
 * The frontend (lib/server/queue.ts) writes the same RedisJSON document with
 * WATCH/MULTI transactions, so the bot has to as well: saving the whole
 * entity through redis-om would overwrite whatever a mod changed between the
 * bot's read and its write. Field names here must match the frontend's.
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

function queueKey() {
  const id = process.env.QUEUE_ID;
  if (!id) {
    throw new Error("QUEUE_ID is not set");
  }
  return `Queue:${id}`;
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
  return normalize(await withRedis((redis) => redis.json.get(queueKey())));
}

/**
 * Set plain fields (flags, now playing). Each JSON.SET touches only its own
 * path, so it can't clobber the order or anyone else's change.
 */
export async function setQueueFields(fields: QueueFlags) {
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
export async function updateQueue(change: (queue: QueueState) => QueuePatch | null): Promise<QueueState | null> {
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

/** Move one entry of a list to a new index. */
export function move<T>(list: T[], from: number, to: number): T[] {
  const result = [...list];
  const [item] = result.splice(from, 1);
  result.splice(Math.max(0, to), 0, item);
  return result;
}

/** Close the shared connection (tests and shutdown). */
export async function closeQueueRedis() {
  const client = shared;
  shared = undefined;
  if (client?.isOpen) await client.close();
}
