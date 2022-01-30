import { Request, Video } from "@prisma/client";
import type { NextApiRequest, NextApiResponse } from "next";
import {prisma} from "../../db/prisma"

type Data = {
  request: Request | null | undefined;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  // TODO: Need to check if mod or not
  const requestId = Number(req.query.request_id)
  console.log("Getting request")

  const request = await prisma.request.findUnique({
    where: {
      id: requestId,
    },
    include: {
      video: {
        include: {
          tags: true,
          pg_status: true
        }
      }
    }
  });

  res.status(200).json({ request: request });
}
