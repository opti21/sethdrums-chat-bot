import { Request, Video } from "@prisma/client";
import type { NextApiRequest, NextApiResponse } from "next";
import {prisma} from "../../db/prisma"

type Data = {
  success: string
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  // TODO: Need to check if mod or not
  const update = req.body

  const pgStatus = await prisma.pG_Status.update({
    where: {
      id: update.pgId,
    },
    data: {
      status: update.status,
      checker: update.checker,
      previous_status: update.previousStatus,
      previous_checker: update.previousChecker,
    }
  });

  console.log(pgStatus)

  res.status(200).json({ success: "ok" });
}
