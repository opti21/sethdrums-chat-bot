import { Queue } from "@prisma/client";
import type { NextApiRequest, NextApiResponse } from "next";
import {prisma} from "../../db/prisma"

type Data = {
  queue: Queue | null | undefined;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  // TODO: Need to check if mod or not
  const queue = await prisma.queue.findUnique({
    where: {
      id: 2,
    },
    include:{
      requests: {
        include: {
          video: {
            include: {
              tags: true,
              pg_status: true
            }
          }
        }
      }
    }
  });

  res.status(200).json({ queue: queue });
}
