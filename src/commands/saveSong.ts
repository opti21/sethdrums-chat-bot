import { ChatUserstate, Client } from "tmi.js";
import { getQueue } from "../redis/handlers/Queue";
import { Video } from "../redis/handlers/Video";
import { prisma } from "../utils/prisma";

const handleSaveSong = async (
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

  if (!queue) {
    twitch.say(channel, "Error getting queue");
  }

  if (!queue.now_playing) {
    twitch.say(
      channel,
      `@${tags.username} There's nothing playing at the moment`
    );
    return;
  }

  const currentSong = await prisma.request
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
      twitch.say(channel, "Error saving current song");
    });

  if (!currentSong) {
    twitch.say(channel, "Error saving current song");
    return;
  }

  console.log(currentSong?.video_id);

  const userExists = await prisma.savedSongs.findFirst({
    where: {
      twitch_id: tags["user-id"]!,
    },
    include: {
      saved_videos: true,
    },
  });

  if (!userExists) {
    await prisma.savedSongs
      .create({
        data: {
          twitch_id: tags["user-id"]!,
          saved_videos: {
            connect: [{ id: currentSong.video_id }],
          },
        },
      })
      .catch((err) => {
        console.error(err);
        twitch.say(channel, "Error saving current song");
      });

    twitch.say(channel, `@${tags.username} saved current song to your library`);
    return;
  }

  if (
    userExists.saved_videos
      .map((video) => {
        return video.id;
      })
      .includes(currentSong.video_id)
  ) {
    twitch.say(channel, `@${tags.username} You already have this song saved`);
    return;
  }

  await prisma.savedSongs.update({
    where: {
      twitch_id: tags["user-id"]!,
    },
    data: {
      saved_videos: {
        connect: { id: currentSong.video_id },
      },
    },
  });

  twitch.say(channel, `@${tags.username} saved current song to your library`);
};

export default handleSaveSong;
