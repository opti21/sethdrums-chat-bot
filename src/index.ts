import { PrismaClient, Request, Video } from "@prisma/client";
import ReconnectingWebSocket from "reconnecting-websocket";
import WS from "ws";
import Redis from "ioredis";
import tmi from "tmi.js";
import axios from "axios";
import urlParser from "js-video-url-parser/lib/base";
import "js-video-url-parser/lib/provider/youtube";
import { YTApiResponse } from "./types";

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

const prisma = new PrismaClient();

const redis = new Redis({
  password: process.env.REDIS_PASS,
});

const rws = new ReconnectingWebSocket(
  process.env.WS_URL ? process.env.WS_URL : "",
  [process.env.SERVER_WS_KEY ? process.env.SERVER_WS_KEY : ""],
  { WebSocket: WS }
);

rws.addEventListener("open", () => {
  console.log("Websocket opened");
});

rws.addEventListener("close", () => {
  console.log("Websocket closed");
});

rws.addEventListener("error", console.error);

class Message {
  type?: string;
  order?: string;
  being_updated_by?: string;
  is_updating?: boolean;
  mod_name?: string;
}

twitch.connect().catch(console.error);

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

      const userAlreadyRequested = await prisma.request.findFirst({
        where: {
          requested_by: tags.username,
        },
        include: {
          Video: true,
        },
      });

      const videoAlreadyRequested = await prisma.request.findFirst({
        where: {
          Video: {
            video_id: parsed?.id,
          },
          played: false,
        },
        include: {
          Video: true,
        },
      });

      if (userAlreadyRequested) {
        twitch.say(
          channel,
          `Uh oh! @${tags.username} looks like you already have a request for ${userAlreadyRequested.Video.title}`
        );
        return;
      }

      if (videoAlreadyRequested) {
        twitch.say(
          channel,
          `Uh oh! @${tags.username} looks like someone already requested that video maye try another one`
        );
        return;
      }

      // Check if video is in database
      const videoInDB = await prisma.video.findUnique({
        where: {
          video_id: parsed.id,
        },
      });

      if (!videoInDB) {
        // Video doesn't exist on database
        // Make new video then request
        const createdVideo = await createVideo(parsed.id, channel);

        if (createdVideo) {
          const createdRequest = await createRequest(
            createdVideo.id,
            tags.username ? tags.username : ""
          );

            const addedToQueue = await addToQueue(createdRequest?.id);
            if (!addedToQueue) {
              twitch.say(channel, `Error adding to queue`);
              return
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
      const createdRequest = await createRequest(
        videoInDB.id,
        tags.username ? tags.username : ""
      );

      if (!createRequest) {
        twitch.say(channel, `Error creating request`);
        return;
      }

      const addedToQueue = await addToQueue(createdRequest?.id);

      if (!addedToQueue) {
        twitch.say(channel, `Error adding to queue`);
      }

      twitch.say(channel, `@${tags.username} requested ${videoInDB.title}`);

      return;
    }

    if (command === "replace") {
      const parsed = urlParser.parse(args[0]);

      if (!parsed) {
        twitch.say(
          channel,
          `Uh oh! ${tags.username} please request with a youtube url`
        );
        return;
      }

      const userHasRequest = await prisma.request.findFirst({
        where: {
          requested_by: tags.username,
        },
        include: {
          Video: true,
        },
      });

      if (!userHasRequest) {
        // If a user doesn't have a request in the queue
        twitch.say(
          channel,
          `Uh oh! @${tags.username} I don't see a request from you in the queue, try doing !sr instead`
        );
        return;
      }

      const videoAlreadyRequested = await prisma.request.findFirst({
        where: {
          Video: {
            video_id: parsed?.id,
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
          `Uh oh! @${tags.username} looks like someone already requested that video maye try another one`
        );
        return;
      }

      const videoInDB = await prisma.video.findUnique({
        where: {
          video_id: parsed.id,
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

      const requestUpdated = await updateRequest(
        userHasRequest.id,
        videoInDB.id
      );

      if (!requestUpdated) {
        twitch.say(channel, `Error updating request`);
        return;
      }

      twitch.say(channel, `@${tags.username} your request has been updated`);

      return;
    }

    if (command === "wrongsong" || command === "remove") {
      const userHasRequest = await prisma.request.findFirst({
        where: {
          requested_by: tags.username,
        },
        include: {
          Video: true,
        },
      });

      if (!userHasRequest) {
        // If a user doesn't have a request in the queue
        twitch.say(
          channel,
          `Uh oh! @${tags.username} I don't see a request from you in the queue, try doing !sr instead`
        );
        return;
      }

      const requestRemoved = await removeRequest(userHasRequest.id);

      if (!requestRemoved) {
        // Error removing request
        twitch.say(channel, `Error removing request`);
        return;
      }

      twitch.say(channel, `@${tags.username} request removed`);
      return;
    }

    if (command === "save") {
      twitch.say(channel, "15 minutes can save you 15% on car insurace")
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
      console.log(video);

      const createdVideo = await prisma.video.create({
        data: {
          video_id: videoID,
          title: video.snippet.title,
          duration: duration,
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
  username: string
): Promise<Request | undefined> {
  console.log("CREATE REQUEST");
  try {
    console.log("VIDEO DATA")
    console.log(videoID, username)
    return await prisma.request.create({
      data: {
        video_id: videoID,
        requested_by: username,
      },
    });
  } catch (e) {
    console.error(e);
    return Promise.reject(e)
  }
}

async function addToQueue(requestID: number | undefined): Promise<boolean> {
  try {
    console.log("UPDATE QUEUE?");
    sendWsLock();

    const currentQueue = await redis.hgetall("sethdrums:queue");

    if (currentQueue) {
      const newOrder: string =
        currentQueue.order.length === 0
          ? `${requestID}`
          : `${currentQueue.order},${requestID}`;

      const updatedQueue = await redis.hset(
        "sethdrums:queue",
        "order",
        newOrder
      );
      console.log(updatedQueue);

      sendWsUnlock(newOrder);
    }

    return true;
  } catch (e) {
    console.error("Error adding to queue: ", e);
    return Promise.reject(e)
  }
}

function sendWsLock() {
  const lockMessage = new Message();
  lockMessage.type = "SERVER_START";
  lockMessage.being_updated_by = "SERVER";
  rws.send(JSON.stringify(lockMessage));
}

function sendWsUnlock(order: string) {
  const lockMessage = new Message();
  lockMessage.type = "SERVER_END";
  lockMessage.being_updated_by = "";
  lockMessage.order = order;
  rws.send(JSON.stringify(lockMessage));
}

function parseYTDuration(duration: string): number {
  const match = duration.match(/P(\d+Y)?(\d+W)?(\d+D)?T(\d+H)?(\d+M)?(\d+S)?/);
  // An invalid case won't crash the app.
  if (!match) {
    console.error(`Invalid YouTube video duration: ${duration}`);
    return 0;
  }
  const [years, weeks, days, hours, minutes, seconds] = match
    .slice(1)
    .map((_) => (_ ? parseInt(_.replace(/\D/, "")) : 0));
  return (
    (((years * 365 + weeks * 7 + days) * 24 + hours) * 60 + minutes) * 60 +
    seconds
  );
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

    console.log(updatedRequest);
    return true;
  } catch (e) {
    console.error("Error updating request: ", e);
    return false;
  }
}

async function removeRequest(requestID: number): Promise<boolean> {
  try {
    const removedRequest = await prisma.request.delete({
      where: {
        id: requestID,
      },
    });
    console.log("Removed db request: ", removedRequest);

    sendWsLock();

    const currentQueue = await redis.hgetall("sethdrums:queue");

    if (currentQueue) {
      const splitQueue = currentQueue.order.split(",");

      for (let i = 0; i < splitQueue.length; i++) {
        if (splitQueue[i] === requestID.toString()) {
          splitQueue.splice(i, 1);
        }
      }

      const newOrder = splitQueue.join(",");

      const updatedQueue = await redis.hset(
        "sethdrums:queue",
        "order",
        newOrder
      );
      console.log(updatedQueue);

      sendWsUnlock(newOrder);
    } else {
      console.error("Error getting queue hash", currentQueue);
    }

    return true;
  } catch (e) {
    console.error("Error removing request: ", e);
    return false;
  }
}
