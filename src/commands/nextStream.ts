import { TwitchCreds } from "@prisma/client";
import axios from "axios"
import { ChatUserstate, Client } from "tmi.js";
import { prisma } from "../utils/prisma";

const handleWhenNextStream = async (
  args: string[],
  twitch: Client,
  channel: string,
  tags: ChatUserstate
) => {
    const twitchCreds = await prisma.twitchCreds.findFirst()

    console.log(twitchCreds)
    if (!twitchCreds) return null

    console.log(twitchCreds?.expires_in)
    console.log(Math.floor((new Date).getTime() / 1000))

    if (!twitchCreds || twitchCreds.expires_in < Date.now()/1000) {
        console.log("no creds")
        // const newTwitchCreds = await getToken()
        // const schedule = await getSchedule(newTwitchCreds)
        // console.log(schedule)
    }

    return
}

export default handleWhenNextStream;

const getSchedule = async (twitchCreds: TwitchCreds | null) => {
    axios.get(`https://api.twitch.tv/helix/schedule?broadcaster_id=147155277`, {
        headers: {
            Authorization: `Bearer ${twitchCreds?.access_token}`,
            "Client-ID": process.env.TWITCH_CLIENT_ID!
        } 
    })
    .then(res => {
        console.log(res.data)
        return res.data
    })
    .catch(err => {
        console.error(err)
    })

}

const getToken = async (): Promise<TwitchCreds | null> => {
    const params = new URLSearchParams()
    params.append("client_id", process.env.TWITCH_CLIENT_ID!)
    params.append("client_secret", process.env.TWITCH_CLIENT_SECRET!)
    params.append("grant_type", "client_credentials")

    axios.post("https://id.twitch.tv/oauth2/token", params)
    .then(async res => {
        console.log(res.data)
        const data = res.data

        const newCreds = await prisma.twitchCreds.upsert({
            where: {
                id: 1,
            },
            update: {
                expires_in: data.expires_in,
                access_token: data.access_token
            },
            create: {
                id: 1,
                expires_in: data.expires_in,
                access_token: data.access_token
            }
        })

        return newCreds
    }).catch(err => {
        console.error("Error getting twitch creds")
        console.error(err)
    })

    return null
}