import {
  getQueue,
  removePrioFromProcessing,
  setPrioAsProcessing,
  updateOrderIdStrings,
} from "../redis/handlers/Queue";
import { ChatUserstate, Client } from "tmi.js";
import "js-video-url-parser/lib/provider/youtube";
import { prisma } from "../utils/prisma";
import { reorder } from "../utils/utils";
import { pusher } from "../index";

let raffleOpen = false;
let raffleSecondsLeft: number;
let raffleInterval: ReturnType<typeof setInterval>;
let rafflePickTimeout: ReturnType<typeof setTimeout>;

const handleRaffle = async (
  args: string[],
  twitch: Client,
  channel: string,
  tags: ChatUserstate
) => {

  if (args[0] === "cancel") {
    raffleOpen = false;
    clearInterval(raffleInterval);
    clearTimeout(rafflePickTimeout);

    twitch.say(channel, "Raffle has been cancelled.");
    return;
  }

  const duration = parseInt(args[0], 10);

  if (raffleOpen) {
    twitch.say(channel, `@${tags.username} There's already a raffle running.`);
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

  pusher.trigger(process.env.NEXT_PUBLIC_PUSHER_CHANNEL!, "raffle-start", {
    duration,
  });

  twitch.say(
    channel,
    `PogChamp A raffle has begun for the next song! sthPog it will end in ${raffleSecondsLeft} seconds. You're automatically entered by having a song in the suggestion list sthHype`
  );

  raffleInterval = setInterval(() => {
    raffleSecondsLeft -= 10;

    if (raffleOpen) {
      twitch.say(
        channel,
        `The raffle for the next song will end in ${raffleSecondsLeft} seconds. You're automatically entered by having a song in the queue sthPog`
      );
    }
  }, 10000);

  rafflePickTimeout = setTimeout(async () => {
    raffleOpen = false;
    clearInterval(raffleInterval);

    twitch.say(channel, "The raffle has closed! Picking winner...");

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

    pusher.trigger(process.env.NEXT_PUBLIC_PUSHER_CHANNEL!, "raffle-end", {
      winner: winningRequest.requested_by,
    });

    twitch.say(
      channel,
      `The raffle winner is ${winningRequest.requested_by}! Their song will be up next! sthPeepo sthHype`
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
};

export default handleRaffle;
