import tmi from "tmi.js";
import urlParser from "js-video-url-parser/lib/base";
import "js-video-url-parser/lib/provider/youtube";
import Pusher from "pusher";
import {
  addToQueue,
  createQueue,
  createQueueIndex,
} from "./redis/handlers/Queue";
import {
  checkIfUserAlreadyRequested,
  checkIfVideoAlreadyRequested,
  createRequest,
  createRequestIndex,
  removeRequest,
  updateRequest,
} from "./redis/handlers/Request";
import {
  createVideo,
  createVideoIndex,
  findVideoByYtID,
} from "./redis/handlers/Video";
import { createPGIndex } from "./redis/handlers/PgStatus";

// async function makeQueue() {
//   await createQueue({
//     order: [],
//     is_updating: false,
//     being_updated_by: "",
//   });
// }

// makeQueue();

// async function initIndex() {
//   await createVideoIndex();
//   await createRequestIndex();
//   await createQueueIndex();
//   await createPGIndex();
// }

// initIndex();

// async function findQueue() {
//   const queue = await prisma.queue.findFirst();
//   console.log(queue);
// }

// findQueue();

// async function createQueue() {
//   const queue = await QueueModel.create({
//     is_updating: false,
//     being_updated_by: "",
//   });
//   console.log(queue);
// }

// createQueue();

if (
  !process.env.PUSHER_APP_ID ||
  !process.env.PUSHER_KEY ||
  !process.env.PUSHER_SECRET ||
  !process.env.PUSHER_CLUSTER
) {
  throw new Error("Missing Pusher environment variables");
}

export const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER,
  useTLS: true,
});

const twitch = new tmi.Client({
  options: { debug: true, messagesLogLevel: "info" },
  connection: {
    reconnect: true,
    secure: true,
  },
  identity: {
    username: "pepega_bot21",
    password: process.env.TWITCH_PASS,
  },
  channels: [process.env.TWITCH_CHANNEL ? process.env.TWITCH_CHANNEL : ""],
});

twitch.connect().catch(console.error);

// const sendReply = true;

twitch.on("message", async (channel, tags, message, self) => {
  if (self) return;
  if (message.startsWith("!")) {
    const args = message.slice(1).split(" ");
    const command = args.shift()?.toLowerCase();

    if (command === "sr") {
      // Check if valid youtube link then parse
      const parsed = urlParser.parse(args[0]);

      if (!parsed) {
        twitch.say(
          channel,
          `Uh oh! ${tags.username} please request with a youtube url`
        );
        return;
      }

      const userAlreadyRequested = await checkIfUserAlreadyRequested(
        tags.username
      );

      console.log(userAlreadyRequested);

      if (userAlreadyRequested.request) {
        twitch.say(
          channel,
          `Uh oh! @${tags.username} looks like you already have a request for ${userAlreadyRequested.video?.title}`
        );
        return;
      }

      const videoAlreadyRequested = await checkIfVideoAlreadyRequested(
        parsed.id
      );
      console.log("VID ALREADY REQUESTED??", videoAlreadyRequested);

      if (videoAlreadyRequested) {
        twitch.say(
          channel,
          `Uh oh! @${tags.username} looks like someone already requested that video maybe try another one`
        );
        return;
      }

      // Check if video is in database
      const videoInDB = await findVideoByYtID(parsed.id);

      console.log("VIDEO IN DB?");
      console.log(parsed.id);

      if (!videoInDB) {
        // Video doesn't exist on database
        // Make new video then request
        const createdVideo = await createVideo(parsed.id);

        if (createdVideo) {
          const createdRequest = await createRequest({
            requested_by: tags.username ? tags.username : "",
            video_id: createdVideo.entityId,
            played: false,
            played_at: "",
          });

          const updatedQueue = await addToQueue(createdRequest);

          if (!updatedQueue) {
            twitch.say(channel, `Error adding to queue`);
            return;
          }

          twitch.say(
            channel,
            `@${tags.username} requested ${createdVideo.title}`
          );
        }
        return;
      }

      // if video is banned tell user to request again
      if (videoInDB.banned) {
        twitch.say(
          channel,
          `Unfortunately @${tags.username} that video isn't allowed, maybe try another :)`
        );
        return;
      }

      // If video is already in DB just create a request
      const createdRequest = await createRequest({
        requested_by: tags.username ? tags.username : "",
        video_id: videoInDB.entityId,
        played: false,
        played_at: "",
      });

      if (!createRequest) {
        twitch.say(channel, `Error creating request`);
        return;
      }

      const addedToQueue = await addToQueue(createdRequest);

      if (!addedToQueue) {
        twitch.say(channel, `Error adding to queue`);
      }

      twitch.say(channel, `@${tags.username} requested ${videoInDB["title"]}`);

      return;
    }

    if (command === "replace") {
      const parsed = urlParser.parse(args[0]);

      if (!parsed) {
        twitch.say(
          channel,
          `Uh oh! ${tags.username} in order to replace your current request please provide a new youtube URL`
        );
        return;
      }

      const userHasRequest = await checkIfUserAlreadyRequested(tags.username);

      if (!userHasRequest.request) {
        // If a user doesn't have a request in the queue
        twitch.say(
          channel,
          `Uh oh! @${tags.username} I don't see a request from you in the queue, try doing !sr instead`
        );
        return;
      }

      const videoAlreadyRequested = await checkIfVideoAlreadyRequested(
        parsed.id
      );

      if (videoAlreadyRequested) {
        twitch.say(
          channel,
          `Uh oh! @${tags.username} looks like someone already requested that video maybe try another one`
        );
        return;
      }

      const videoInDB = await findVideoByYtID(parsed.id);

      if (!videoInDB) {
        const createdVideo = await createVideo(parsed.id);

        if (!createdVideo) {
          console.error("Error creating video");
          return;
        }

        const requestUpdated = await updateRequest(
          userHasRequest.request.entityId,
          createdVideo.entityId
        );

        if (!requestUpdated) {
          twitch.say(channel, `Error updating request`);
          return;
        }

        twitch.say(channel, `@${tags.username} your request has been updated`);

        return;
      }

      const requestUpdated = await updateRequest(
        userHasRequest.request.entityId,
        videoInDB.entityId
      );

      if (!requestUpdated) {
        twitch.say(channel, `Error updating request`);
        return;
      }

      twitch.say(channel, `@${tags.username} your request has been updated`);

      return;
    }

    if (command === "wrongsong" || command === "remove") {
      const userHasRequest = await checkIfUserAlreadyRequested(tags.username);

      if (!userHasRequest.request) {
        // If a user doesn't have a request in the queue
        twitch.say(
          channel,
          `Uh oh! @${tags.username} I don't see a request from you in the queue, try doing !sr instead`
        );
        return;
      }

      console.log(userHasRequest);

      const requestRemoved = await removeRequest(
        userHasRequest.request.entityId
      );

      if (!requestRemoved) {
        // Error removing request
        twitch.say(channel, `Error removing request`);
        return;
      }

      twitch.say(channel, `@${tags.username} your request has been removed`);
      return;
    }

    if (command === "save") {
      twitch.say(channel, "15 minutes can save you 15% on car insurance");
    }
  }
});
