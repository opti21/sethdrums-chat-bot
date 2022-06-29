import { pusher } from "../index";
import { prisma } from "./prisma";

export async function updateRequest(
  requestID: number,
  videoID: number
): Promise<boolean> {
  try {
    console.log("Update request");
    await prisma.request.update({
      where: {
        id: requestID,
      },
      data: {
        video_id: videoID,
      },
    });

    pusher.trigger(process.env.NEXT_PUBLIC_PUSHER_CHANNEL!, "update-queue", {});

    return true;
  } catch (e) {
    console.error("Error updating request: ", e);
    return false;
  }
}
