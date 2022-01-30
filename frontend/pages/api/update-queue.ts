// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/react";
import { prisma } from "../../db/prisma";

type Data = {
  success: boolean;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  console.log(req.body);
  const session = await getSession({ req });

  if (session) {
    const queueUpdate = req.body;

    const updateQueue = await prisma.queue.update({
      where: {
        id: 2,
      },
      data: queueUpdate,
    });
    console.log(updateQueue);
    res.status(200).json({ success: true });
  } else {
    res.status(401);
  }
}
