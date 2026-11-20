import { Entity, type EntityCreationData, Schema } from "redis-om";
import { client, connect } from "../redis";
import { pusher } from "index";
import {
  move,
  readQueue,
  setQueueFields,
  updateQueue,
} from "../queueState";

const QUEUE_ID = process.env.QUEUE_ID ? process.env.QUEUE_ID : "";

interface Queue {
  order?: string[];
  is_updating?: boolean;
  is_paused?: boolean;
  being_updated_by?: string;
  now_playing?: string;
  is_open: boolean;
  currently_processing: string[];
  is_subOnly: boolean;
}

class Queue extends Entity {}

const queueSchema = new Schema(
  Queue,
  {
    order: { type: "string[]" },
    is_updating: { type: "boolean" },
    is_paused: { type: "boolean" },
    being_updated_by: { type: "string" },
    now_playing: { type: "string" },
    is_open: { type: "boolean" },
    currently_processing: { type: "string[]" },
    is_subOnly: { type: "boolean" },
  },
  {
    dataStructure: "JSON",
  }
);

export async function createQueueIndex() {
  await connect();

  const repository = client.fetchRepository(queueSchema);

  await repository.createIndex();
}

async function getQueue() {
  await connect();

  const repository = client.fetchRepository(queueSchema);

  const queue = await repository.fetch(QUEUE_ID);

  return queue;
}

async function createQueue(data: EntityCreationData) {
  await connect();

  const repository = client.fetchRepository(queueSchema);

  const queue = repository.createEntity(data);

  const id = await repository.save(queue);

  return id;
}

async function openQueue() {
  await setQueueFields({ is_open: true });

  pusher.trigger(process.env.NEXT_PUBLIC_PUSHER_CHANNEL!, "open-queue", {});
}

async function closeQueue() {
  await setQueueFields({ is_open: false, is_paused: false });

  pusher.trigger(process.env.NEXT_PUBLIC_PUSHER_CHANNEL!, "close-queue", {});
}

async function lockQueue() {
  await setQueueFields({ is_updating: true, being_updated_by: "PEPEGA BOT" });

  pusher.trigger(process.env.NEXT_PUBLIC_PUSHER_CHANNEL!, "lock-queue", {
    beingUpdatedBy: "PEPEGA BOT",
  });
}

async function unLockQueue() {
  await setQueueFields({ is_updating: false, being_updated_by: "" });

  pusher.trigger(process.env.NEXT_PUBLIC_PUSHER_CHANNEL!, "unlock-queue", {
    beingUpdatedBy: "",
  });
}

async function pauseQueue() {
  await setQueueFields({ is_paused: true });

  pusher.trigger(process.env.NEXT_PUBLIC_PUSHER_CHANNEL!, "pause-queue", {});
}

async function resumeQueue() {
  await setQueueFields({ is_paused: false });

  pusher.trigger(process.env.NEXT_PUBLIC_PUSHER_CHANNEL!, "resume-queue", {});
}

/*
 * Order and currently_processing changes below go through updateQueue, a
 * WATCH/MULTI transaction that retries on the fresh state if a mod (or
 * another bot command) changed the queue mid-write. They no longer lock the
 * panel: nothing can be overwritten, so there is nothing to lock out.
 */

async function addToQueue(
  requestID: string | undefined
): Promise<boolean | undefined> {
  try {
    if (!requestID) {
      console.error("No requestID passed");
      return;
    }

    const id = String(requestID);
    const queue = await updateQueue((current) =>
      current.order.includes(id) ? null : { order: [...current.order, id] }
    );

    pusher.trigger(
      process.env.NEXT_PUBLIC_PUSHER_CHANNEL!,
      "queue-add",
      queue ?? (await readQueue())
    );

    return true;
  } catch (e) {
    console.error("Error adding to queue: ", e);
    return Promise.reject(e);
  }
}

async function removeFromOrder(
  requestID: string | undefined
): Promise<boolean> {
  try {
    const id = String(requestID);
    await updateQueue((current) =>
      current.order.includes(id)
        ? { order: current.order.filter((item) => item !== id) }
        : null
    );

    return true;
  } catch (e) {
    console.error(e);
    return Promise.reject("Error removing from order");
  }
}

/**
 * Merge a submitted order with the live one: ids that left the queue are
 * dropped, and ids added since the caller read the queue keep their place
 * instead of vanishing. Same rule as the panel's drag save.
 */
function mergeOrder(current: string[], submitted: string[]) {
  const live = new Set(current);
  const order = [...new Set(submitted.map(String))].filter((id) => live.has(id));
  const seen = new Set(order);
  current.forEach((id, index) => {
    if (!seen.has(id)) order.splice(Math.min(index, order.length), 0, id);
  });
  return order;
}

async function updateOrder(updatedOrderData: any): Promise<boolean> {
  return updateOrderIdStrings(
    updatedOrderData.map((request: any) => String(request.id))
  ).catch(() => Promise.reject("Error updating queue"));
}

async function updateOrderIdStrings(updatedOrder: string[]): Promise<boolean> {
  try {
    await updateQueue((current) => ({
      order: mergeOrder(current.order, updatedOrder),
    }));

    return true;
  } catch (e) {
    console.error(e);
    return Promise.reject("Error updating queue");
  }
}

/** Move a request to `index` in the live order. False if it left the queue. */
async function moveInOrder(requestID: string, index: number): Promise<boolean> {
  const id = String(requestID);
  let found = false;
  await updateQueue((current) => {
    const from = current.order.indexOf(id);
    found = from !== -1;
    return found ? { order: move(current.order, from, index) } : null;
  });
  return found;
}

async function updateNowPlaying(requestID: string): Promise<boolean> {
  try {
    await setQueueFields({ now_playing: String(requestID) });

    return true;
  } catch (e) {
    console.error(e);
    return Promise.reject("Error updating now playing");
  }
}

/** Mark a request as being changed. False if someone else already has it. */
async function setPrioAsProcessing(requestID: string): Promise<boolean> {
  const id = String(requestID);
  const written = await updateQueue((current) =>
    current.currently_processing.includes(id)
      ? null
      : { currently_processing: [...current.currently_processing, id] }
  );
  return written !== null;
}

async function removePrioFromProcessing(requestID: string) {
  const id = String(requestID);
  await updateQueue((current) =>
    current.currently_processing.includes(id)
      ? {
          currently_processing: current.currently_processing.filter(
            (item) => item !== id
          ),
        }
      : null
  );
}

async function setSubOnly(subOnly: boolean) {
  await setQueueFields({ is_subOnly: subOnly });
}

export {
  Queue,
  getQueue,
  createQueue,
  openQueue,
  closeQueue,
  lockQueue,
  unLockQueue,
  pauseQueue,
  resumeQueue,
  addToQueue,
  removeFromOrder,
  updateOrder,
  updateOrderIdStrings,
  moveInOrder,
  mergeOrder,
  updateNowPlaying,
  setPrioAsProcessing,
  removePrioFromProcessing,
  setSubOnly,
};
