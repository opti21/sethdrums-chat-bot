import { Entity, EntityCreationData, Repository, Schema } from "redis-om";
import { client, connect } from "../redis";

const QUEUE_ID = "01FWJ8EQKC4Q6417VN5RJJPE66";

interface Queue {
  order?: string[];
  is_updating?: boolean;
  being_updated_by?: string;
}

class Queue extends Entity {}

const queueSchema = new Schema(
  Queue,
  {
    order: { type: "array" },
    is_updating: { type: "boolean" },
    being_updated_by: { type: "string" },
  },
  {
    dataStructure: "JSON",
  }
);

export async function createQueueIndex() {
  await connect();

  const repository = new Repository(queueSchema, client);

  await repository.createIndex();
}

async function getQueue() {
  await connect();

  const repository = new Repository(queueSchema, client);

  const queue = await repository.fetch(QUEUE_ID);

  return queue;
}

async function createQueue(data: EntityCreationData) {
  await connect();

  const repository = new Repository(queueSchema, client);

  const queue = repository.createEntity(data);

  const id = await repository.save(queue);

  return id;
}

async function lockQueue() {
  await connect();

  const repository = new Repository(queueSchema, client);

  const queue = await repository.fetch(QUEUE_ID);

  queue.is_updating = true;
  queue.being_updated_by = "PEPEGA BOT";

  repository.save(queue);

  return queue;
}

async function unLockQueue() {
  await connect();

  const repository = new Repository(queueSchema, client);

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

    console.log("UPDATING QUEUE");

    lockQueue();

    await connect();

    const repository = new Repository(queueSchema, client);

    const queue = await repository.fetch(QUEUE_ID);

    queue?.order?.push(requestID);

    await repository.save(queue);

    unLockQueue();

    return true;
  } catch (e) {
    console.error("Error adding to queue: ", e);
    return Promise.reject(e);
  }
}

export { Queue, getQueue, createQueue, lockQueue, unLockQueue, addToQueue };
