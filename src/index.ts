import { Prisma, PrismaClient, Request, Status, Video } from "@prisma/client";
import tmi from "tmi.js";
import axios from "axios";
import urlParser from "js-video-url-parser/lib/base";
import "js-video-url-parser/lib/provider/youtube";
import { YTApiResponse } from "./types";
import {
  addToQueue,
  closeQueue,
  getQueue,
  openQueue,
  removeFromOrder,
} from "./redis/handlers/Queue";
import { parseYTDuration } from "./utils";
import express from "express";
import Pusher from "pusher";
import { GrowthBook } from "@growthbook/growthbook";
import "@sentry/tracing";

const FEATURES_ENDPOINT = process.env.NEXT_PUBLIC_GROWTHBOOK_ENDPOINT;
const growthbook = new GrowthBook({
  trackingCallback: (experiment, result) => {
    console.log({
      experimentId: experiment.key,
      variationId: result.variationId,
    });
  },
});

const getFeatures = async () => {
  await axios
    .get(FEATURES_ENDPOINT!)
    .then((res) => {
      const json = res.data;
      growthbook.setFeatures(json.features);
    })
    .catch(() => {
      console.log("Failed to fetch feature definitions from GrowthBook");
    });
};

setInterval(getFeatures, 5000);

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

const botUsername =
  process.env.NODE_ENV === "production" ? "pepega_bot21" : "opti_21";

const twitch = new tmi.Client({
  options: { debug: true, messagesLogLevel: "info" },
  connection: {
    reconnect: true,
    secure: true,
  },
  identity: {
    username: botUsername,
    password: process.env.TWITCH_PASS,
  },
  channels: [process.env.TWITCH_CHANNEL ? process.env.TWITCH_CHANNEL : ""],
});

const prisma = new PrismaClient();

twitch.connect().catch(console.error);

twitch.on("message", async (channel, tags, message, self) => {
  if (self) return;
  if (message.startsWith("!")) {
    const args = message.slice(1).split(" ");
    const command = args.shift()?.toLowerCase();

    if (
      command === "open" &&
      (tags.mod ||
        tags.username === "opti_21" ||
        // brodacaster
        channel.replace("#", "") == tags.username)
    ) {
      await openQueue().catch((err) => {
        console.error(err);
        twitch.say(channel, "Error opening queue");
      });
      twitch.say(channel, `@${tags.username} Queue is now open`);
      return;
    }

    if (
      command === "close" &&
      (tags.mod ||
        tags.username === "opti_21" ||
        // brodacaster
        channel.replace("#", "") == tags.username)
    ) {
      await closeQueue().catch((err) => {
        console.error(err);
        twitch.say(channel, "Error opening queue");
      });
      twitch.say(channel, `@${tags.username} Queue is now closed`);
      return;
    }

    if (command === "sr") {
      const queue = await getQueue();
      if (!queue.is_open) {
        twitch.say(channel, `@${tags.username} The queue is currently closed`);
        return;
      }
      // Check if valid youtube link then parse
      const parsed = urlParser.parse(args[0]);

      if (!parsed) {
        if (growthbook.isOn("bot-talk")) {
          twitch.say(
            channel,
            `@${tags.username} please request with a youtube url`
          );
        }
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
        if (growthbook.isOn("bot-talk")) {
          twitch.say(
            channel,
            `@${tags.username} looks like you already have a song in the queue, once your request has been played or removed, you can request another`
          );
        }
        return;
      }

      if (videoAlreadyRequested) {
        if (growthbook.isOn("bot-talk")) {
          twitch.say(
            channel,
            `@${tags.username} this song has already been requested, please try another song`
          );
        }
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

          if (growthbook.isOn("bot-talk")) {
            twitch.say(
              channel,
              `@${tags.username} your request has been added`
            );
          }
        }
        return;
      }

      // if video is banned tell user to request again
      if (videoInDB.banned) {
        if (growthbook.isOn("bot-talk")) {
          twitch.say(
            channel,
            `@${tags.username} your song was not added, all songs must be PG/family friendly`
          );
        }
        return;
      }

      // If video is already in DB just create a request
      const createdRequest = await createRequest(
        videoInDB.id,
        tags.username!,
        tags["user-id"]!
      );

      if (!createRequest) {
        if (growthbook.isOn("bot-talk")) {
          twitch.say(channel, `Error creating request`);
        }
        return;
      }

      const addedToQueue = await addToQueue(createdRequest?.id.toString());

      if (!addedToQueue) {
        if (growthbook.isOn("bot-talk")) {
          twitch.say(channel, `Error adding to queue`);
        }
      }

      if (growthbook.isOn("bot-talk")) {
        twitch.say(channel, `@${tags.username} your song has been added`);
      }

      return;
    }

    if (command === "replace") {
      const queue = await getQueue();
      if (!queue.is_open) {
        twitch.say(channel, `@${tags.username} Queue is closed`);
        return;
      }

      const parsed = urlParser.parse(args[0]);

      if (!parsed) {
        if (growthbook.isOn("bot-talk")) {
          twitch.say(
            channel,
            `@${tags.username} please request with a youtube url`
          );
        }
        return;
      }

      const userHasRequest = await prisma.request.findFirst({
        where: {
          requested_by_id: tags["user-id"],
        },
        include: {
          Video: true,
        },
      });

      if (!userHasRequest) {
        // If a user doesn't have a request in the queue
        if (growthbook.isOn("bot-talk")) {
          twitch.say(
            channel,
            `@${tags.username} I don't see a request from you in the queue, try doing !sr instead`
          );
        }
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
        if (growthbook.isOn("bot-talk")) {
          twitch.say(
            channel,
            `@${tags.username} this song has already been requested, please try another song`
          );
        }
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
          if (growthbook.isOn("bot-talk")) {
            twitch.say(channel, `Error updating request`);
          }
          return;
        }

        if (growthbook.isOn("bot-talk")) {
          twitch.say(
            channel,
            `@${tags.username} your request has been updated`
          );
        }

        return;
      }

      const requestUpdated = await updateRequest(
        userHasRequest.id,
        videoInDB.id
      );

      if (!requestUpdated) {
        if (growthbook.isOn("bot-talk")) {
          twitch.say(channel, `Error updating request`);
        }
        return;
      }

      if (growthbook.isOn("bot-talk")) {
        twitch.say(channel, `@${tags.username} your request has been updated`);
      }
      return;
    }

    if (command === "wrongsong" || command === "remove") {
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
        if (growthbook.isOn("bot-talk")) {
          twitch.say(
            channel,
            `@${tags.username} I don't see a request from you in the queue, try doing !sr instead`
          );
        }
        return;
      }

      const removedRequest = await prisma.request.delete({
        where: {
          id: userHasRequest.id,
        },
      });

      const removedFromQueue = await removeFromOrder(
        userHasRequest.id.toString()
      );

      if (!removedFromQueue) {
        // Error removing request
        if (growthbook.isOn("bot-talk")) {
          twitch.say(channel, `Error removing request from queue`);
        }
        return;
      }

      if (growthbook.isOn("bot-talk")) {
        twitch.say(channel, `@${tags.username} request removed`);
      }
      return;
    }

    if (command === "song" || command === "cs" || command === "currentsong") {
      const queue = await getQueue();
      if (!queue.is_open) {
        twitch.say(channel, `@${tags.username} The queue is currently closed`);
        return;
      }

      if (!queue) {
        if (growthbook.isOn("bot-talk")) {
          twitch.say(channel, "Error getting queue");
        }
      }

      if (!queue.now_playing) {
        if (growthbook.isOn("bot-talk")) {
          twitch.say(
            channel,
            `@${tags.username} There's nothing playing at the moment`
          );
        }
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

      if (growthbook.isOn("bot-talk")) {
        twitch.say(
          channel,
          `@${tags.username} Current Song: ${request?.Video.title}: https://www.youtube.com/watch?v=${request?.Video.youtube_id}`
        );
      }
      return;
    }

    if (command === "save") {
      const queue = await getQueue();
      if (!queue.is_open) {
        twitch.say(channel, `@${tags.username} The queue is currently closed`);
        return;
      }
      if (growthbook.isOn("bot-talk")) {
        twitch.say(channel, "Coming Soon... PauseChamp");
      }
      return;
    }
  }
});

async function createVideo(
  videoID: string,
  channel: string
): Promise<Video | undefined> {
  try {
    const axiosResponse = await axios.get(
      `https://youtube.googleapis.com/youtube/v3/videos?part=snippet%2CcontentDetails%2Cstatistics&id=${videoID}&key=${process.env.GOOGLE_API_KEY}`
    );

    if (axiosResponse.data.items[0]) {
      const apiData: YTApiResponse = axiosResponse.data;
      const video = apiData.items[0];
      const duration = parseYTDuration(video.contentDetails.duration);

      const createdVideo = await prisma.video.create({
        data: {
          youtube_id: videoID,
          title: video.snippet.title,
          duration: duration,
          thumbnail: `https://i.ytimg.com/vi/${videoID}/mqdefault.jpg`,
          region_blocked: false,
          embed_blocked: false,
          channel: video.snippet.channelTitle,
          PG_Status: {
            create: {
              status: "NOT_CHECKED",
            },
          },
        },
      });

      return createdVideo;
    }
  } catch (e) {
    console.error(e);
    twitch.say(channel, "Youtube API Error");
  }
}

async function createRequest(
  videoID: number,
  username: string,
  userID: string
): Promise<Request | undefined> {
  try {
    return await prisma.request.create({
      data: {
        video_id: videoID,
        requested_by: username,
        requested_by_id: userID,
      },
    });
  } catch (e) {
    console.error(e);
    return Promise.reject(e);
  }
}

async function updateRequest(
  requestID: number,
  videoID: number
): Promise<boolean> {
  try {
    const updatedRequest = await prisma.request.update({
      where: {
        id: requestID,
      },
      data: {
        video_id: videoID,
      },
    });

    return true;
  } catch (e) {
    console.error("Error updating request: ", e);
    return false;
  }
}

// HTTP endpoint because render
const app = express();
const port = process.env.PORT || 3001;

app.get("/", (req, res) => res.status(200).send("pepega bot is running"));

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
