import { getQueue } from "../redis/handlers/Queue";
import { type ChatUserstate, Client } from "tmi.js";
import urlParser from "js-video-url-parser/lib/base";
import "js-video-url-parser/lib/provider/youtube";
import { prisma } from "../utils/prisma";
import { updateRequest } from "../utils/updateRequest";
import { createVideo } from "../utils/createVideo";

const handleReplace = async (
  args: string[],
  twitch: Client,
  channel: string,
  tags: ChatUserstate
) => {
  const queue = await getQueue();
  if (!queue.is_open) {
    twitch.say(channel, `@${tags.username} Queue is closed`);
    return;
  }

  const parsed = urlParser.parse(args[0]);

  if (!parsed) {
    twitch.say(channel, `@${tags.username} please request with a youtube url`);
    return;
  }

  const userHasRequest = await prisma.request.findFirst({
    where: {
      requested_by_id: tags["user-id"],
      played: false,
    },
    include: {
      Video: true,
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

  const videoAlreadyRequested = await prisma.request.findFirst({
    where: {
      Video: {
        youtube_id: parsed?.id,
      },
      played: false,
    },
    include: {
      Video: true,
    },
  });

  if (videoAlreadyRequested) {
    twitch.say(
      channel,
      `@${tags.username} this song has already been requested, please try another song`
    );
    return;
  }

  const videoInDB = await prisma.video.findUnique({
    where: {
      youtube_id: parsed.id,
    },
  });

  if (!videoInDB) {
    const createdVideo = await createVideo(parsed.id, channel);

    if (!createdVideo) {
      console.error("Error creating video");
      return;
    }

    const requestUpdated = await updateRequest(
      userHasRequest.id,
      createdVideo.id
    );

    if (!requestUpdated) {
      twitch.say(channel, `Error updating request`);
      return;
    }

    twitch.say(channel, `@${tags.username} your request has been updated`);

    return;
  }

  const requestUpdated = await updateRequest(userHasRequest.id, videoInDB.id);

  if (!requestUpdated) {
    twitch.say(channel, `Error updating request`);
    return;
  }

  twitch.say(channel, `@${tags.username} your request has been updated`);
  return;
};

export default handleReplace;
