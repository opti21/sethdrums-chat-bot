import { PG_Status, Request, Video } from "@prisma/client";
import type { NextApiRequest, NextApiResponse } from "next";
import {prisma} from "../../db/prisma"

type Data = {
  pgStatus: PG_Status | null ;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  // TODO: Need to check if mod or not
  const pgId = Number(req.query.pg_id)
  console.log("Getting request")

  const pgStatus = await prisma.pG_Status.findUnique({
    where: {
      id: pgId,
    },
  });

  res.status(200).json({ pgStatus });
}
