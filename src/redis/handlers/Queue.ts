import { pusher } from "../../index";
import { Entity, EntityCreationData, Schema } from "redis-om";
import { client, connect } from "../redis";

const QUEUE_ID = process.env.QUEUE_ID ? process.env.QUEUE_ID : "";

interface Queue {
  order?: string[];
  is_updating?: boolean;
  being_updated_by?: string;
  now_playing?: string;
  is_open: boolean;
  currently_processing: string[];
}

class Queue extends Entity {}

const queueSchema = new Schema(
  Queue,
  {
    order: { type: "string[]" },
    is_updating: { type: "boolean" },
    being_updated_by: { type: "string" },
    now_playing: { type: "string" },
    is_open: { type: "boolean" },
    currently_processing: { type: "string[]" },
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
  await connect();

  pusher.trigger(process.env.NEXT_PUBLIC_PUSHER_CHANNEL!, "open-queue", {});

  const repository = client.fetchRepository(queueSchema);

  const queue = await repository.fetch(QUEUE_ID);

  queue.is_open = true;

  repository.save(queue);

  return queue;
}

async function closeQueue() {
  await connect();

  pusher.trigger(process.env.NEXT_PUBLIC_PUSHER_CHANNEL!, "close-queue", {});

  const repository = client.fetchRepository(queueSchema);

  const queue = await repository.fetch(QUEUE_ID);

  queue.is_open = false;

  repository.save(queue);
}

async function lockQueue() {
  await connect();

  pusher.trigger(process.env.NEXT_PUBLIC_PUSHER_CHANNEL!, "lock-queue", {
    beingUpdatedBy: "PEPEGA BOT",
  });

  const repository = client.fetchRepository(queueSchema);

  const queue = await repository.fetch(QUEUE_ID);

  queue.is_updating = true;
  queue.being_updated_by = "PEPEGA BOT";

  repository.save(queue);

  return queue;
}

async function unLockQueue() {
  await connect();

  pusher.trigger(process.env.NEXT_PUBLIC_PUSHER_CHANNEL!, "unlock-queue", {
    beingUpdatedBy: "",
  });

  const repository = client.fetchRepository(queueSchema);

  const queue = await repository.fetch(QUEUE_ID);

  queue.being_updated_by = "";
  queue.is_updating = false;

  repository.save(queue);

  return queue;
}

async function addToQueue(
  requestID: string | undefined
): Promise<boolean | undefined> {
  try {
    if (!requestID) {
      console.error("No requestID passed");
      return;
    }

    lockQueue();

    await connect();

    const repository = client.fetchRepository(queueSchema);

    const queue = await repository.fetch(QUEUE_ID);

    queue?.order?.push(requestID);

    await repository.save(queue);

    unLockQueue();

    pusher.trigger(process.env.NEXT_PUBLIC_PUSHER_CHANNEL!, "queue-add", queue);

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
    lockQueue();

    await connect();

    const repository = client.fetchRepository(queueSchema);

    const queue = await repository.fetch(QUEUE_ID);

    if (queue.order) {
      for (let i = 0; i < queue.order.length; i++) {
        if (queue.order[i] === requestID) {
          queue.order.splice(i, 1);
        }
      }
    }

    await repository.save(queue);

    unLockQueue();

    return true;
  } catch (e) {
    return Promise.reject("Error removing from order");
  }
}

export {
  Queue,
  getQueue,
  createQueue,
  openQueue,
  closeQueue,
  lockQueue,
  unLockQueue,
  addToQueue,
  removeFromOrder,
};
