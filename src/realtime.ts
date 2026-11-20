import Pusher from "pusher";
import { callQueueWorker } from "./redis/queueState";

/**
 * Live updates for the mod panel. REALTIME_BACKEND picks the service and
 * must match the frontend's: "pusher" (default) or "do" (the queue
 * Durable Object's sockets, through the queue Worker).
 */
export function realtimeBackend(): "pusher" | "do" {
  return process.env.REALTIME_BACKEND === "do" ? "do" : "pusher";
}

let pusher: Pusher | undefined;

function pusherClient() {
  if (!pusher) {
    const { PUSHER_APP_ID, PUSHER_KEY, PUSHER_SECRET, PUSHER_CLUSTER } = process.env;
    if (!PUSHER_APP_ID || !PUSHER_KEY || !PUSHER_SECRET || !PUSHER_CLUSTER) {
      throw new Error("Missing Pusher environment variables");
    }
    pusher = new Pusher({
      appId: PUSHER_APP_ID,
      key: PUSHER_KEY,
      secret: PUSHER_SECRET,
      cluster: PUSHER_CLUSTER,
      timeout: 5_000,
    });
  }
  return pusher;
}

/** Fail at boot, not on the first event, if the chosen service isn't configured. */
export function checkRealtimeConfig() {
  if (realtimeBackend() === "pusher") {
    pusherClient();
  } else if (!process.env.QUEUE_WORKER_URL || !process.env.QUEUE_WORKER_SECRET) {
    throw new Error("REALTIME_BACKEND=do needs QUEUE_WORKER_URL and QUEUE_WORKER_SECRET");
  }
}

/** Send an event to every open panel. Logs instead of throwing. */
export async function trigger(event: string, data: unknown = {}) {
  try {
    if (realtimeBackend() === "do") {
      await callQueueWorker("/broadcast", { event, data });
    } else {
      await pusherClient().trigger(process.env.NEXT_PUBLIC_PUSHER_CHANNEL!, event, data);
    }
  } catch (error) {
    console.error(`[realtime] failed to send ${event}`, error);
  }
}
