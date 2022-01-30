require("dotenv").config();
import NextAuth from "next-auth";
import TwitchProvider from "next-auth/providers/twitch";
import DiscordProvider from "next-auth/providers/discord";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "../../../db/prisma";

export default NextAuth({
  // Configure one or more authentication providers
  adapter: PrismaAdapter(prisma),
  providers: [
    TwitchProvider({
      clientId: process.env.TWITCH_CLIENT_ID!,
      clientSecret: process.env.TWITCH_CLIENT_SECRET!,
    }),
  ],
  secret: process.env.NEXT_AUTH_SECRET,
  callbacks: {
    async session({ session }) {
      if (session) {
        const isMod = await prisma.mod.findMany({
          where: {
            name: session!.user!.name!,
          },
        });
        session.isMod = isMod.length > 0;
      }
      return session;
    },
  },
});
