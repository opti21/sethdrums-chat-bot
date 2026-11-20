import {
  moveInOrder,
  removePrioFromProcessing,
  setPrioAsProcessing,
} from "../redis/handlers/Queue";
import { type ChatUserstate, Client } from "tmi.js";
import "js-video-url-parser/lib/provider/youtube";
import { prisma } from "../utils/prisma";
import { trigger } from "realtime";

let raffleOpen = false;
let raffleSecondsLeft: number;
let raffleInterval: ReturnType<typeof setInterval>;
let rafflePickTimeout: ReturnType<typeof setTimeout>;

const handleRaffle = async (
  args: string[],
  twitch: Client,
  channel: string,
  tags: ChatUserstate,
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
      `@${tags.username} please supply duration !songraffle <number>`,
    );
    return;
  }

  if (duration > 120) {
    twitch.say(
      channel,
      `@${tags.username} please supply duration lower then or equal to 120 seconds`,
    );
    return;
  }

  raffleOpen = true;
  raffleSecondsLeft = duration;

  trigger("raffle-start", {
    duration,
  });

  twitch.say(
    channel,
    `A raffle has begun for the next song! PogChamp It will end in ${raffleSecondsLeft} seconds. You're automatically entered by having a song in the suggestion list Kreygasm`,
  );

  raffleInterval = setInterval(() => {
    raffleSecondsLeft -= 10;

    if (raffleOpen) {
      twitch.say(
        channel,
        `The raffle for the next song will end in ${raffleSecondsLeft} seconds. You're automatically entered by having a song in the suggestion list PogChamp`,
      );
    }
  }, 10000);

  rafflePickTimeout = setTimeout(async () => {
    raffleOpen = false;
    clearInterval(raffleInterval);

    twitch.say(channel, "The raffle has closed! Picking winner... ");

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

    trigger("raffle-end", {
      winner: winningRequest.requested_by,
    });

    twitch.say(
      channel,
      `The raffle winner is ${winningRequest.requested_by}! Their song will be up next! Kreygasm`,
    );

    const winnerID = winningRequest.id.toString();

    const claimed = await setPrioAsProcessing(winnerID).catch((err) => {
      console.error(err);
      return false;
    });

    try {
      if (!claimed) {
        // A mod is changing this request's prio in the panel right now, so
        // leave the prio flags to them and only move it to the top.
        console.error("Raffle winner is already being processed", winnerID);
      } else {
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
      }

      // Moves the winner to the top of the live order, so songs added or
      // moved while the raffle ran aren't lost.
      const moved = await moveInOrder(winnerID, 0);

      if (!moved) {
        console.error("Raffle winner is no longer in the queue", winnerID);
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (claimed) {
        await removePrioFromProcessing(winnerID).catch(console.error);
      }
    }
  }, duration * 1000);
  return;
};

export default handleRaffle;
