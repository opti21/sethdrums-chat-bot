import urlParser from "js-video-url-parser/lib/base";
import "js-video-url-parser/lib/provider/youtube";
import { addToQueue, getQueue } from "../redis/handlers/Queue";
import { ChatUserstate, Client } from "tmi.js";
import { createRequest } from "../utils/createRequest";
import { createVideo } from "../utils/createVideo";
import { prisma } from "../utils/prisma";

const handleSongRequest = async (
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
  // Check if valid youtube link then parse
  const parsed = urlParser.parse(args[0]);

  if (!parsed) {
    twitch.say(channel, `@${tags.username} please request with a youtube url`);
    return;
  }

  const userAlreadyRequested = await prisma.request.findFirst({
    where: {
      requested_by_id: tags["user-id"],
      played: false,
    },
    include: {
      Video: true,
    },
  });

  const videoAlreadyRequested = await prisma.request.findFirst({
    where: {
      Video: {
        youtube_id: parsed?.id,
      },
      played: false,
    },
  });

  if (userAlreadyRequested) {
    twitch.say(
      channel,
      `@${tags.username} looks like you already have a song in the queue, you can replace it by doing '!replace newurl', or once your request has been played or removed with !remove you can request another`
    );
    return;
  }

  if (videoAlreadyRequested) {
    twitch.say(
      channel,
      `@${tags.username} this song has already been requested, please try another song`
    );
    return;
  }

  // Check if video is in database
  const videoInDB = await prisma.video.findUnique({
    where: {
      youtube_id: parsed.id,
    },
  });

  if (!videoInDB) {
    // Video doesn't exist on database
    // Make new video then request
    const createdVideo = await createVideo(parsed.id, channel);

    if (createdVideo) {
      const createdRequest = await createRequest(
        createdVideo.id,
        tags.username!,
        tags["user-id"]!
      );

      const addedToQueue = await addToQueue(createdRequest?.id.toString());

      if (!addedToQueue) {
        twitch.say(channel, `Error adding to queue`);
        return;
      }

      twitch.say(channel, `@${tags.username} your request has been added`);
    }
    return;
  }

  // if video is banned tell user to request again
  if (videoInDB.banned) {
    twitch.say(
      channel,
      `@${tags.username} your song was not added, all songs must be PG/family friendly`
    );
    return;
  }

  // If video is already in DB just create a request
  const createdRequest = await createRequest(
    videoInDB.id,
    tags.username!,
    tags["user-id"]!
  );

  if (!createRequest) {
    twitch.say(channel, `Error creating request`);
    return;
  }

  const addedToQueue = await addToQueue(createdRequest?.id.toString());

  if (!addedToQueue) {
    twitch.say(channel, `Error adding to queue`);
  }

  twitch.say(channel, `@${tags.username} your song has been added`);

  return;
};

export default handleSongRequest;
