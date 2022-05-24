import { Request } from "@prisma/client";
import { prisma } from "../utils/prisma";

export async function createRequest(
  videoID: number,
  username: string,
  userID: string
): Promise<Request | undefined> {
  try {
    return await prisma.request.create({
      data: {
        video_id: videoID,
        requested_by: username,
        requested_by_id: userID,
      },
    });
  } catch (e) {
    console.error(e);
    return Promise.reject(e);
  }
}
