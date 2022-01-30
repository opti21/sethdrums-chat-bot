import type { NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import PepegaNav from "../components/PepegaNav";
import { useSession } from "next-auth/react";
import ModView from "../components/ModView";
import { useState } from "react";
import { Song } from "../types/types";
import RegularView from "../components/RegularView";
import { Queue, Request, Video, VideoTag } from "@prisma/client";
import useSWR from "swr";
import { useQueue } from "../utils";

interface SwrVideo extends Video {
  tags: VideoTag[];
}

interface SwrRequest extends Request {
  video: SwrVideo;
}

interface SwrQueue extends Queue {
  requests: SwrRequest[];
}

const Home: NextPage = () => {
  const { data: session, status } = useSession();

  return (
    <div className="min-h-screen bg-[#150b2f] pt-2">
      <Head>
        <title>Pepega Panel</title>
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
      </Head>
      {/* --content */}
      <div className="container mx-auto px-4">
        <PepegaNav />
        {
          // check if logged in user is admin
          session?.isMod ? (
              <ModView />
          ) : (
            //<RegularView songs={data} />
            <>regular view</>
          )
        }

        {/* 
        <div className="hero">
          <div className="text-center hero-content">
            <div className="max-w-md">
              <h1 className="text-3xl font-bold underline">FUTURE HOME OF</h1>
              <div className="inline-block">
                <Image src={"/pepega.png"} height={100} width={150} />
                <span className="text-3xl mb-2">Panel</span>
              </div>
            </div>
          </div>
        </div>
        */}
      </div>
    </div>
  );
};

export default Home;
