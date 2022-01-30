// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import {prisma} from "../../db/prisma"

type Data = {
  success: boolean;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  // const createQueue = await prisma.queue.create({
  //   data: {
  //   }
  // });
  res.status(200).json({ success: true });
}
