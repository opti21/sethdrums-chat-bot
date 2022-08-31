import { TwitchCreds } from "@prisma/client";
import axios from "axios";
import { ChatUserstate, Client } from "tmi.js";
import { prisma } from "../utils/prisma";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc"
import timezone from "dayjs/plugin/timezone"
import isBetween from "dayjs/plugin/isBetween"
import relativeTime from "dayjs/plugin/relativeTime"
import advancedFormat from "dayjs/plugin/advancedFormat"

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(isBetween)
dayjs.extend(relativeTime)
dayjs.extend(advancedFormat)

const handleWhenNextStream = async (
  args: string[],
  twitch: Client,
  channel: string,
  tags: ChatUserstate
) => {
  try {
    let twitchCreds

    twitchCreds = await prisma.twitchCreds.findFirst();

    if (!twitchCreds) {
      console.log("no creds");
      twitchCreds = await getNewToken();
    }
    
    if (twitchCreds?.expires) {
        if (twitchCreds?.expires < Math.floor(Date.now() / 1000)) {
            console.log("twitch creds expired")
            twitchCreds = await getNewToken()
        }
    }

    const schedule:any = await getSchedule(twitchCreds);

    console.log(schedule.data.segments[0].start_time);
    const startTime = dayjs(schedule.data.segments[0].start_time).tz("America/Chicago")
    const secondStartTime = dayjs(schedule.data.segments[1].start_time).tz("America/Chicago")
    // const endTime = dayjs(schedule.data.segments[0].start_time).tz("America/Chicago")

    // const scheduledLive = dayjs().isBetween(startTime, endTime)

    const startDateFormated = startTime.format("ddd[,] MMM Do [at] hA z")
    const secondStartDateFormated = secondStartTime.format("ddd[,] MMM Do [at] hA z")

    // console.log(dayjs(startTime).fromNow())

    if (dayjs().isAfter(startTime)) {
        // If the first item in schdule is the currently live stream pull next stream date
        return twitch.say(channel, `Seth's next stream is scheduled for ${secondStartDateFormated}`)
    }

    return twitch.say(channel, `Seth's next stream is scheduled for ${startDateFormated}`)

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

      axios
        .get(`https://api.twitch.tv/helix/schedule?broadcaster_id=147155277`, {
          headers: {
            Authorization: `Bearer ${twitchCreds?.access_token}`,
            "Client-ID": process.env.TWITCH_CLIENT_ID!,
          },
        })
        .then((res) => {
          resolve(res.data);
        })
        .catch((err) => {
          console.log("AXIOS ERROR");
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
    axios
      .post("https://id.twitch.tv/oauth2/token", params)
      .then(async (res) => {
        console.log(res.data);
        const data = res.data;

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
