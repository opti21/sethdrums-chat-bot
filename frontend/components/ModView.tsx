import axios from "axios";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "react-beautiful-dnd";
import { Song, SwrQueue } from "../types/types";
import { useQueue } from "../utils";
import ModRequest from "./ModRequest";
import { prisma } from "../db/prisma";
import { useSession } from "next-auth/react";
import { useSWRConfig } from "swr";
import useWebSocket, { ReadyState } from "react-use-websocket";

const ModView = () => {
  const { mutate } = useSWRConfig();
  const { isLoading, isError } = useQueue();
  const { data: session, status } = useSession();
  const [isInit, setIsInit] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false);
  const [beingUpdatedBy, setBeingUpdatedBy] = useState("test");
  const [queue, setQueue] = useState("")

  const { sendMessage, lastMessage, readyState } = useWebSocket(
    "ws://localhost:8080/modws"
  );

  useEffect(() => {
    if (lastMessage !== null) {
      console.log("WS: " + JSON.parse(lastMessage.data).type);
      const message = JSON.parse(lastMessage.data);
      // console.log(message);
      switch (message.type) {
        case "INIT":
        if(!isInit) {
          console.log("I NO INIT")
          setQueue(message.order)
          setIsInit(true)
        }
        break
        case "QUEUE_LOCK":
          console.log("LOCKING QUEUE");
          setIsUpdating(true);
          setBeingUpdatedBy(message.being_updated_by);
          break
        case "QUEUE_UNLOCK":
          console.log("UNLOCKING QUEUE");
          setQueue(message.order)
          setIsUpdating(false);
          setBeingUpdatedBy("");
          break
        default:
          console.log(message)
      }
    }
  }, [lastMessage, isInit, setQueue]);

  if (!isInit) return <div>Loading Mod View...</div>;
  if (isError) return <div>ERROR LOADING MOD VIEW</div>;
  const queueOrder = queue.split(",");
  // console.log(queue);

  const reorder = (list: string[], startIndex: number, endIndex: number) => {
    const result = list;
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);

    return result;
  };

  const onDragStart = async () => {
    console.log("Drag start");
    const update = {
      type: "DRAG_START",
      being_updated_by: session?.user?.name,
      is_updating: true,
    };
    sendMessage(JSON.stringify(update));
  };

  const onDragEnd = async (result: DropResult) => {
    console.log("Drag end");
    if (!result.destination) {
      const update = {
        type: "DRAG_END",
        being_updated_by: "",
        is_updating: false,
        order: queue
      };
      sendMessage(JSON.stringify(update));
      return;
    }
    // console.log(result);

    const newOrder = reorder(
      queueOrder!,
      result.source.index,
      result.destination.index
    );
    const update = {
      type: "DRAG_END",
      being_updated_by: "",
      is_updating: false,
      order: newOrder.join(","),
    };
    sendMessage(JSON.stringify(update));

    console.log(newOrder.join(","));
  };

  return (
    <div>
      <div className="overflow-x-auto">
        <div className="mb-2">
          {!isUpdating ? (
            <div className="bg-green-900 border-green-400 rounded-lg p-3 text-white border"
            >Up to date</div>
          ) : (
            <div className="bg-indigo-900 border-blue-400 rounded-lg p-3 text-white border ">
              {beingUpdatedBy} is updating the queue
            </div>
          )}
        </div>
        {isInit?
        <DragDropContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
          <Droppable droppableId="droppable">
            {(provided, snapshot) => (
              <div
                className="bg-[#1f134e] rounded-lg p-1"
                {...provided.droppableProps}
                ref={provided.innerRef}
              >
                {queueOrder?.map((requestID, index) => {
                  return (
                    <Draggable
                      key={requestID}
                      draggableId={"draggable" + requestID}
                      index={index}
                      isDragDisabled={isUpdating}
                    >
                      {(provided, snapshot) => (
                        <div>
                          <ModRequest
                            provided={provided}
                            snapshot={snapshot}
                            requestID={requestID}
                          />
                        </div>
                      )}
                    </Draggable>
                  );
                })}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext> :
        <div> NOT INIT </div>}
      </div>
    </div>
  );
};

export default ModView;
