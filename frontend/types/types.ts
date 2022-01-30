import {Queue, Request, Video, VideoTag} from "@prisma/client"

export type Song = {
  id: number;
  name: string;
  link: string;
  pgStatus: boolean;
};

interface SwrVideo extends Video {
  tags: VideoTag[]
}

interface SwrRequest extends Request {
  video: SwrVideo
}

export interface SwrQueue extends Queue {
  requests: SwrRequest[]
}

