import { Prisma, PrismaClient, Request, Status, Video } from "@prisma/client";
import tmi from "tmi.js";
import axios from "axios";
import urlParser from "js-video-url-parser/lib/base";
import "js-video-url-parser/lib/provider/youtube";
import { YTApiResponse } from "./utils/types";
import {
  addToQueue,
  closeQueue,
  getQueue,
  openQueue,
  removeFromOrder,
  removePrioFromProcessing,
  setPrioAsProcessing,
  updateOrderIdStrings,
} from "./redis/handlers/Queue";
import { parseYTDuration } from "./utils/utils";
import express from "express";
import Pusher from "pusher";
import { GrowthBook } from "@growthbook/growthbook";
import handleSongRequest from "./commands/songRequest";
import { prisma } from "./utils/prisma";
import { createVideo } from "./utils/createVideo";
import handleReplace from "./commands/replaceRequest";
import handleRemove from "./commands/wrongSong";
import handleCurrentSong from "./commands/currentSong";

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

twitch.connect().catch(console.error);

let raffleOpen = false;
let raffleSecondsLeft: number;
let raffleIntervalCheck: ReturnType<typeof setTimeout>;

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
        channel.replace("#", "") === tags.username)
    ) {
      await openQueue().catch((err) => {
        console.error(err);
        twitch.say(channel, "Error opening queue");
      });
      pusher.trigger(
        process.env.NEXT_PUBLIC_PUSHER_CHANNEL!,
        "update-queue",
        {}
      );
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
      pusher.trigger(
        process.env.NEXT_PUBLIC_PUSHER_CHANNEL!,
        "update-queue",
        {}
      );
      twitch.say(channel, `@${tags.username} Queue is now closed`);
      return;
    }

    if (command === "sr") {
      handleSongRequest(args, twitch, channel, tags);
    }

    if (command === "replace") {
      handleReplace(args, twitch, channel, tags);
    }

    if (command === "wrongsong" || command === "remove") {
      handleRemove(args, twitch, channel, tags);
    }

    if (command === "song" || command === "cs" || command === "currentsong") {
      handleCurrentSong(args, twitch, channel, tags);
    }

    if (command === "save") {
    }

    if (
      command === "marco" &&
      (tags.mod ||
        tags.username === "opti_21" ||
        // brodacaster
        channel.replace("#", "") === tags.username)
    ) {
      twitch.say(
        channel,
        `MrDestructoid POLO! - v${process.env.npm_package_version}`
      );
      return;
    }

    if (
      command === "songraffle" &&
      (tags.mod ||
        tags.username === "opti_21" ||
        // brodacaster
        channel.replace("#", "") === tags.username)
    ) {
      const splitStr = message.split(" ");
      const duration = parseInt(splitStr[1], 10);

      if (raffleOpen) {
        twitch.say(
          channel,
          `@${tags.username} There's already a raffle running.`
        );
        return;
      }

      if (!duration) {
        twitch.say(
          channel,
          `@${tags.username} please supply duration !songraffle <number>`
        );
        return;
      }

      if (duration > 120) {
        twitch.say(
          channel,
          `@${tags.username} please supply duration lower then or equal to 120 seconds`
        );
        return;
      }

      raffleOpen = true;
      raffleSecondsLeft = duration;
      twitch.say(
        channel,
        `/announce PogChamp A raffle has begun for the next song! sthPog it will end in ${raffleSecondsLeft} seconds. You're automatically entered by having a song in the queue sthHype`
      );

      raffleIntervalCheck = setInterval(() => {
        raffleSecondsLeft -= 10;

        if (raffleOpen) {
          console.log("raffle is open");
          twitch.say(
            channel,
            `/announce The raffle for the next song will end in ${raffleSecondsLeft} seconds. You're automatically entered by having a song in the queue sthPog`
          );
        }
      }, 10000);

      setTimeout(async () => {
        raffleOpen = false;
        clearInterval(raffleIntervalCheck);

        twitch.say(
          channel,
          "/announce The raffle has closed! Picking winner..."
        );

        const nonPrioRequests = await prisma.request
          .findMany({
            where: {
              played: false,
              priority: false,
            },
          })
          .catch((err) => {
            console.log("Error getting requests");
            console.log(err);
            twitch.say(channel, "Error getting requests for draw");
          });

        if (!nonPrioRequests) {
          console.log("no requests");
          twitch.say(channel, "Not enough requests, maybe next time.");
          return;
        }

        const randomNum = Math.floor(Math.random() * nonPrioRequests.length);

        const winningRequest = nonPrioRequests[randomNum];

        twitch.say(
          channel,
          `/announce The raffle winner is ${winningRequest.requested_by}! Their song will be up next! sthPeepo sthHype`
        );

        const currentQueue = await getQueue();

        if (!currentQueue.order) {
          console.error("No queue order");
          return;
        }

        await setPrioAsProcessing(winningRequest.id.toString());

        await prisma.request
          .update({
            where: {
              id: winningRequest.id,
            },
            data: {
              priority: true,
              raffle_prio: true,
            },
          })
          .catch((err) => {
            console.error(err);
          });

        const oldIndex = currentQueue.order.findIndex(
          (currRequestID) => currRequestID === winningRequest.id.toString()
        );

        const updatedOrder = reorder(currentQueue.order, oldIndex, 0);

        await updateOrderIdStrings(updatedOrder);
        await removePrioFromProcessing(winningRequest.id.toString());
      }, duration * 1000);
      return;
    }
  }
});

const reorder = (
  list: string[],
  startIndex: number,
  endIndex: number
): string[] => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);

  return result;
};

// HTTP endpoint because render
const app = express();
const port = process.env.PORT || 3001;

app.get("/", (req, res) => res.status(200).send("pepega bot is running"));

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
