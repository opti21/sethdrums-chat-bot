import tmi from "tmi.js";
import "js-video-url-parser/lib/provider/youtube";
import {
  closeQueue,
  getQueue,
  openQueue,
  pauseQueue,
  resumeQueue,
  setSubOnly,
} from "./redis/handlers/Queue";
import express from "express";
import Pusher from "pusher";
import handleSongRequest from "./commands/songRequest";
import handleReplace from "./commands/replaceRequest";
import handleRemove from "./commands/wrongSong";
import handleCurrentSong from "./commands/currentSong";
import handleSaveSong from "./commands/saveSong";
import handleRaffle from "./commands/raffle";

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
  host: process.env.PUSHER_HOST!,
  port: process.env.PUSHER_PORT!,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
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

twitch.on("message", async (channel, tags, message, self) => {
  if (self) return;
  if (message.startsWith("!")) {
    const args = message.slice(1).split(" ");
    const command = args.shift()?.toLowerCase();
    if (!command) return;

    if (
      command === "open" &&
      (tags.mod ||
        tags.username === "opti_21" ||
        // brodacaster
        channel.replace("#", "") === tags.username)
    ) {
      await openQueue().catch((err) => {
        console.error(err);
        twitch.say(channel, "Error opening Sugestion List DinkDank @opti_21");
      });
      pusher.trigger(
        process.env.NEXT_PUBLIC_PUSHER_CHANNEL!,
        "update-queue",
        {}
      );
      twitch.say(channel, `@${tags.username} Suggestion List is now open ✅`);
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
        twitch.say(channel, "Error opening Suggestion list DinkDank @opti_21");
      });
      pusher.trigger(
        process.env.NEXT_PUBLIC_PUSHER_CHANNEL!,
        "update-queue",
        {}
      );
      twitch.say(channel, `@${tags.username} Suggestion list is now closed 🛑`);
      return;
    }
    if (
      command === "pause" &&
      (tags.mod ||
        tags.username === "opti_21" ||
        // brodacaster
        channel.replace("#", "") === tags.username)
    ) {
      const queue = await getQueue();

      if (!queue.is_open) {
        twitch.say(channel, `@${tags.username} Suggestion list is closed 🛑`);
        return;
      }

      await pauseQueue().catch((err) => {
        console.error(err);
        twitch.say(channel, "Error pausing Suggestion List DinkDank @opti_21");
      });
      pusher.trigger(
        process.env.NEXT_PUBLIC_PUSHER_CHANNEL!,
        "update-queue",
        {}
      );
      twitch.say(channel, `@${tags.username} Suggestion list is now paused ⏸️`);
      return;
    }

    if (
      command === "resume" &&
      (tags.mod ||
        tags.username === "opti_21" ||
        // brodacaster
        channel.replace("#", "") === tags.username)
    ) {
      const queue = await getQueue();

      if (!queue.is_open) {
        twitch.say(channel, `@${tags.username} Suggestion list is closed 🛑`);
        return;
      }

      await resumeQueue().catch((err) => {
        console.error(err);
        twitch.say(channel, "Error resuming Suggestion List DinkDank @opti_21");
      });
      pusher.trigger(
        process.env.NEXT_PUBLIC_PUSHER_CHANNEL!,
        "update-queue",
        {}
      );
      twitch.say(
        channel,
        `@${tags.username} Suggestion list has been resumed! Get your suggestions in! `
      );
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
      handleSaveSong(args, twitch, channel, tags);
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
      handleRaffle(args, twitch, channel, tags);
    }

    if (command.startsWith("subonly")) {
      if (tags.mod || channel.replace("#", "") === tags.username) {
        const subOnly = command.split(" ")[1] === "on";
        setSubOnly(subOnly);
        twitch.say(
          channel,
          `@${tags.username} Suggestion list is now ${
            subOnly ? " sub only" : " open to everyone"
          }`
        );
      }
    }

    // if (command === "addmods") {
    //   if (tags.mod || tags.username === "opti_21") {
    //     prisma.mod.createMany({
    //       data: [
    //         {
    //           name: "",
    //           twitch_id: "",
    //         },
    //       ],
    //     });
    //   }
    // }

    // if (
    //   (command === "when" || command === "schedule" || command === "next")
    // ) {
    //   handleWhenNextStream(args, twitch, channel, tags);
    // }
  }
});
