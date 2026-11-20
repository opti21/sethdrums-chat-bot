import { trigger } from "realtime";
import {
  addId,
  claim,
  mergeOrder,
  moveId,
  readQueue,
  release,
  removeIds,
  reorder,
  setQueueFields,
  type QueueState,
} from "../queueState";

type Queue = QueueState;

async function getQueue(): Promise<Queue> {
  return readQueue();
}

async function openQueue() {
  await setQueueFields({ is_open: true });

  void trigger("open-queue");
}

async function closeQueue() {
  await setQueueFields({ is_open: false, is_paused: false });

  void trigger("close-queue");
}

async function lockQueue() {
  await setQueueFields({ is_updating: true, being_updated_by: "PEPEGA BOT" });

  void trigger("lock-queue", { beingUpdatedBy: "PEPEGA BOT" });
}

async function unLockQueue() {
  await setQueueFields({ is_updating: false, being_updated_by: "" });

  void trigger("unlock-queue", { beingUpdatedBy: "" });
}

async function pauseQueue() {
  await setQueueFields({ is_paused: true });

  void trigger("pause-queue");
}

async function resumeQueue() {
  await setQueueFields({ is_paused: false });

  void trigger("resume-queue");
}

/*
 * Order and currently_processing changes below can't overwrite a mod's
 * change: on Redis they are WATCH/MULTI transactions that retry on fresh
 * state, and the Durable Object applies one change at a time.
 *
 * The panel refreshes on live events, so every write below that changed
 * something tells it with "update-queue" (or "queue-add" for new songs).
 * The Durable Object also sends these itself; a second one is harmless.
 */

function notifyQueueChanged() {
  void trigger("update-queue");
}

async function addToQueue(
  requestID: string | undefined
): Promise<boolean | undefined> {
  try {
    if (!requestID) {
      console.error("No requestID passed");
      return;
    }

    await addId(String(requestID));
    void trigger("queue-add", await readQueue());

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
    if (await removeIds([String(requestID)])) notifyQueueChanged();

    return true;
  } catch (e) {
    console.error(e);
    return Promise.reject("Error removing from order");
  }
}

async function updateOrder(updatedOrderData: any): Promise<boolean> {
  return updateOrderIdStrings(
    updatedOrderData.map((request: any) => String(request.id))
  ).catch(() => Promise.reject("Error updating queue"));
}

async function updateOrderIdStrings(updatedOrder: string[]): Promise<boolean> {
  try {
    await reorder(updatedOrder.map(String));
    notifyQueueChanged();

    return true;
  } catch (e) {
    console.error(e);
    return Promise.reject("Error updating queue");
  }
}

/** Move a request to `index` in the live order. False if it left the queue. */
async function moveInOrder(requestID: string, index: number): Promise<boolean> {
  const found = await moveId(String(requestID), index);
  if (found) notifyQueueChanged();
  return found;
}

async function updateNowPlaying(requestID: string): Promise<boolean> {
  try {
    await setQueueFields({ now_playing: String(requestID) });
    notifyQueueChanged();

    return true;
  } catch (e) {
    console.error(e);
    return Promise.reject("Error updating now playing");
  }
}

/** Mark a request as being changed. False if someone else already has it. */
async function setPrioAsProcessing(requestID: string): Promise<boolean> {
  const claimed = await claim(String(requestID));
  if (claimed) notifyQueueChanged();
  return claimed;
}

async function removePrioFromProcessing(requestID: string) {
  if (await release(String(requestID))) notifyQueueChanged();
}

async function setSubOnly(subOnly: boolean) {
  await setQueueFields({ is_subOnly: subOnly });
  notifyQueueChanged();
}

export {
  type Queue,
  getQueue,
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
