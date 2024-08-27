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
    twitch.say(
      channel,
      `@${tags.username} KEKWait The suggestion list is currently closed`
    );
    return;
  }

  if (queue.is_paused) {
    twitch.say(
      channel,
      `@${tags.username} KEKWait The suggestion list is currently paused, please wait for it to be resumed`
    );
    return;
  }

  // Check if valid youtube link then parse
  const parsed = urlParser.parse(args[0]);

  if (!parsed) {
    twitch.say(
      channel,
      `@${tags.username} KEKWait please try again with a youtube url`
    );
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
      `@${tags.username} KEKWait looks like you already have a song in the queue, you can replace it by doing '!replace newurl', or once your suggestion has been played or removed with !remove you can suggest another`
    );
    return;
  }

  if (videoAlreadyRequested) {
    twitch.say(
      channel,
      `@${tags.username} this song has already been suggested, please try another song peepoShy`
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
        twitch.say(
          channel,
          `Error adding to Suggestion List DinkDank @opti_21`
        );
        return;
      }

      twitch.say(
        channel,
        `@${tags.username} your suggestion has been added POGGIES`
      );
    }
    return;
  }

  // if video is banned tell user to request again
  if (videoInDB.banned) {
    twitch.say(
      channel,
      `@${tags.username} your suggestion does not follow our rules. Please check our !rules before submitting. Thank you sthHeart`
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
    twitch.say(channel, `Error creating request DinkDank @opti_21`);
    return;
  }

  const addedToQueue = await addToQueue(createdRequest?.id.toString());

  if (!addedToQueue) {
    twitch.say(channel, `Error adding to Suggestion List DinkDank @opti_21`);
  }

  twitch.say(
    channel,
    `@${tags.username} your suggestion has been added! POGGIES`
  );

  return;
};

export default handleSongRequest;
