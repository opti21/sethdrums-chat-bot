import { getQueue } from "../redis/handlers/Queue";
import { type ChatUserstate, Client } from "tmi.js";
import { prisma } from "../utils/prisma";

const handleCurrentSong = async (
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

  if (!queue) {
    twitch.say(channel, "Error getting queue");
  }

  if (!queue.now_playing) {
    twitch.say(
      channel,
      `@${tags.username} There's nothing playing at the moment`
    );
    return;
  }

  const request = await prisma.request
    .findFirst({
      where: {
        id: parseInt(queue.now_playing),
      },
      include: {
        Video: true,
      },
    })
    .catch((err) => {
      console.error(err);
      twitch.say(channel, "Error getting current song");
    });

  if (!request || !request.Video) {
    twitch.say(channel, "Error getting current song");
    return;
  }

  twitch.say(
    channel,
    `@${tags.username} Current Song: ${request.Video.title}: https://www.youtube.com/watch?v=${request?.Video.youtube_id} Requested By: ${request?.requested_by}`
  );
  return;
};

export default handleCurrentSong;
