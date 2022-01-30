import { PG_Status, Queue, Request, Video, VideoTag } from "@prisma/client";
import useSWR from "swr";

export interface ISwrVideo extends Video {
  tags: VideoTag[];
  pg_status: PG_Status;
}

export interface ISwrRequest extends Request {
  video: ISwrVideo;
}

interface ISwrQueue extends Queue {
  requests: ISwrRequest[];
}

interface ISwrQueueResponse {
  queue: ISwrQueue;
  success: Boolean;
}

export function useQueue() {
  const { data, error } = useSWR<ISwrQueueResponse>("/api/check-queue");

  return {
    queue: data?.queue,
    isLoading: !error && !data,
    isError: error,
  };
}

interface ISwrRequestResponse {
  request: ISwrRequest;
}

export function useRequest(requestId: string) {
  console.log(requestId);
  const { data, error } = useSWR<ISwrRequestResponse>(
    `/api/get-request/?request_id=${requestId}`
  );
  console.log(data);

  return {
    request: data?.request,
    isLoading: !error && !data,
    isError: error,
  };
}
