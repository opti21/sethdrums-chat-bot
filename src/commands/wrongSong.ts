import { getQueue, removeFromOrder } from "../redis/handlers/Queue";
import { ChatUserstate, Client } from "tmi.js";
import { prisma } from "../utils/prisma";

const handleRemove = async (
  args: string[],
  twitch: Client,
  channel: string,
  tags: ChatUserstate
) => {
  const queue = await getQueue();
  if (!queue.is_open) {
    twitch.say(channel, `@${tags.username} The queue is currently closed`);
    return;
  }
  const userHasRequest = await prisma.request.findFirst({
    where: {
      requested_by_id: tags["user-id"],
    },
  });

  if (!userHasRequest) {
    // If a user doesn't have a request in the queue
    twitch.say(
      channel,
      `@${tags.username} I don't see a request from you in the queue, try doing !sr instead`
    );
    return;
  }

  await prisma.request.delete({
    where: {
      id: userHasRequest.id,
    },
  });

  const removedFromQueue = await removeFromOrder(userHasRequest.id.toString());

  if (!removedFromQueue) {
    // Error removing request
    twitch.say(channel, `Error removing request from queue`);
    return;
  }

  twitch.say(channel, `@${tags.username} request removed`);
  return;
};

export default handleRemove;
