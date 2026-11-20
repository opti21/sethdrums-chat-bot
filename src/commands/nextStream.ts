import type { TwitchCreds } from "../generated/prisma/client";
import { type ChatUserstate, Client } from "tmi.js";
import { prisma } from "../utils/prisma";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import isBetween from "dayjs/plugin/isBetween";
import relativeTime from "dayjs/plugin/relativeTime";
import advancedFormat from "dayjs/plugin/advancedFormat";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isBetween);
dayjs.extend(relativeTime);
dayjs.extend(advancedFormat);

const handleWhenNextStream = async (
  args: string[],
  twitch: Client,
  channel: string,
  tags: ChatUserstate
) => {
  try {
    let twitchCreds;

    twitchCreds = await prisma.twitchCreds.findFirst();

    if (!twitchCreds) {
      console.log("no creds");
      twitchCreds = await getNewToken();
    }

    if (twitchCreds?.expires) {
      if (twitchCreds?.expires < Math.floor(Date.now() / 1000)) {
        console.log("twitch creds expired");
        twitchCreds = await getNewToken();
      }
    }

    const schedule: any = await getSchedule(twitchCreds);

    const removedCanceled = schedule.data.segments.filter(
      (segemnt: any) => segemnt.canceled_until === null
    );
    console.log(removedCanceled);

    const startTime = dayjs(removedCanceled[0].start_time).tz(
      "America/Chicago"
    );
    // const endTime = dayjs(schedule.data.segments[0].start_time).tz("America/Chicago")

    // const scheduledLive = dayjs().isBetween(startTime, endTime)

    const startDateFormated = startTime.format("ddd[,] MMM Do [at] hA z");
    const fromNow = dayjs(startTime).diff(dayjs(), "h");

    console.log(fromNow);

    if (dayjs().isAfter(startTime)) {
      // If the first item in schdule is the currently live stream pull next stream date
      if (removedCanceled.length > 1) {
        const secondStartTime = dayjs(removedCanceled[1].start_time).tz(
          "America/Chicago"
        );
        const secondStartDateFormated = secondStartTime.format(
          "ddd[,] MMM Do [at] hA z"
        );
        return twitch.say(
          channel,
          `Seth's next stream is scheduled for ${secondStartDateFormated}`
        );
      }

      return twitch.say(channel, `There's currently no streams scheduled`);
    }

    return twitch.say(
      channel,
      `Seth's next stream is scheduled for ${startDateFormated}`
    );
  } catch (err) {
    console.error(err);
    return;
  }
};

export default handleWhenNextStream;

const getSchedule = async (twitchCreds: TwitchCreds | null) => {
  console.log("Getting schedule");
  return new Promise((resolve, reject) => {
    if (!twitchCreds) {
      console.log("NO TWITCH CREDS FOR REQUEST");
      return reject(Error("No twitch creds"));
    } else {
      fetchJson(`https://api.twitch.tv/helix/schedule?broadcaster_id=147155277`, {
        headers: {
          Authorization: `Bearer ${twitchCreds?.access_token}`,
          "Client-ID": process.env.TWITCH_CLIENT_ID!,
        },
      })
        .then((data) => {
          resolve(data);
        })
        .catch((err) => {
          console.log("TWITCH SCHEDULE REQUEST ERROR");
          reject(Error(err.message));
        });
    }
  });
};

const getNewToken = async (): Promise<TwitchCreds | null> => {
  const params = new URLSearchParams();
  params.append("client_id", process.env.TWITCH_CLIENT_ID!);
  params.append("client_secret", process.env.TWITCH_CLIENT_SECRET!);
  params.append("grant_type", "client_credentials");

  return new Promise((resolve, reject) => {
    fetchJson("https://id.twitch.tv/oauth2/token", {
      method: "POST",
      body: params,
    })
      .then(async (data) => {

        const newCreds = await prisma.twitchCreds.upsert({
          where: {
            id: 1,
          },
          update: {
            expires: Math.floor(Date.now() / 1000) + data.expires_in,
            access_token: data.access_token,
          },
          create: {
            id: 1,
            expires: Math.floor(Date.now() / 1000) + data.expires_in,
            access_token: data.access_token,
          },
        });
        resolve(newCreds);
      })
      .catch((err) => {
        console.error("Error getting twitch creds");
        console.error(err.message);

        reject(err);
      });
  });
};

/** fetch + JSON with a timeout; rejects on a non-2xx status like axios did. */
async function fetchJson(url: string, init: RequestInit = {}): Promise<any> {
  const response = await fetch(url, {
    ...init,
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) {
    throw new Error(`Request failed with status code ${response.status}`);
  }
  return response.json();
}
