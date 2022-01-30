import { PG_Status, Request } from "@prisma/client";
import { DraggableProvided, DraggableStateSnapshot } from "react-beautiful-dnd";
import { useRequest } from "../utils";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import ReactPlayer from "react-player";
import { toast } from "react-toastify";
import axios from "axios";
import { useSession } from "next-auth/react";
import { mutate } from "swr";
import { DesktopComputerIcon, UserIcon } from "@heroicons/react/solid";

const MySwal = withReactContent(Swal);

interface Props {
  requestID: string;
  provided: DraggableProvided;
  snapshot: DraggableStateSnapshot;
}

const ModRequest = ({ requestID, provided, snapshot }: Props) => {
  const { data: session } = useSession();
  const { request, isLoading, isError } = useRequest(requestID);

  if (isLoading) return <div> Request Loading...</div>;
  if (isError) return <div> Error getting request</div>;

  const handlePGCheck = async () => {
    const pgStatus = await getPG();
    console.log(pgStatus);

    if (pgStatus?.status === "BEING_CHECKED") {
      Swal.fire({
        title: "Are you sure?",
        text: `Looks like ${pgStatus?.checker} is already checking this video. \nAre you sure you want to check this video?`,
        showConfirmButton: true,
        confirmButtonText: "Yes, Check Video",
        showCancelButton: true,
      }).then((result) => {
        if (result.isConfirmed) {
          startVideoChecker(pgStatus);
          return;
        }
      });
    } else {
      startVideoChecker(pgStatus);
      return;
    }
  };

  const getPG = async (): Promise<PG_Status | undefined> => {
    try {
      const { data: response } = await axios.get(
        `/api/get-pg/?pg_id=${request?.video.pg_status.id}`
      );
      return response.pgStatus;
    } catch (error) {
      console.error(error);
    }
  };

  const startVideoChecker = async (previousStatus: PG_Status | undefined) => {
    axios
      .post("/api/update-pg", {
        pgId: request?.video.pg_status.id,
        status: "BEING_CHECKED",
        checker: session?.user?.name,
        previousStatus: previousStatus?.status,
        previousChecker: previousStatus?.checker,
      })
      .then((res) => {
        if (res.data.success === "ok") {
        } else {
          toast.error("Error updating pg status");
          return;
        }
      })
      .catch((error) => {
        toast.error("Error updating pg status");
        console.error(error);
      });

    MySwal.fire({
      html: (
        <div className="">
          <ReactPlayer
            controls={true}
            url={`https://youtube.com/watch?v=${request?.video.video_id}`}
          />
        </div>
      ),
      width: "700px",
      confirmButtonText: "Mark PG",
      confirmButtonColor: "#4CBB17",
      showDenyButton: true,
      denyButtonText: "Mark NON-PG",
      showCancelButton: true,
    }).then((result) => {
      if (result.isConfirmed) {
        axios
          .post("/api/update-pg", {
            pgId: request?.video.pg_status.id,
            status: "PG",
            checker: session?.user?.name,
            previousStatus: "",
            previousChecker: "",
          })
          .then((res) => {
            if (res.data.success === "ok") {
              toast.success("PG Status set to PG");
              mutate("/api/get-request");
            } else {
              toast.error("Error updating pg status");
            }
          })
          .catch((error) => {
            toast.error("Error updating pg status");
            console.error(error);
          });
      } else if (result.isDenied) {
        axios
          .post("/api/update-pg", {
            pgId: request?.video.pg_status.id,
            status: "NON_PG",
            checker: session?.user?.name,
            previousStatus: "",
            previousChecker: "",
          })
          .then((res) => {
            if (res.data.success === "ok") {
              toast.success("PG Status set to NON-PG");
              mutate("/api/get-request");
            } else {
              toast.error("Error updating pg status");
            }
          })
          .catch((error) => {
            toast.error("Error updating pg status");
            console.error(error);
          });
      } else if (result.isDismissed) {
        getPG().then((pgStatus) => {
          axios
            .post("/api/update-pg", {
              pgId: pgStatus?.id,
              status: pgStatus?.previous_status,
              checker: pgStatus?.previous_checker,
              previousStatus: "",
              previousChecker: "",
            })
            .then((res) => {
              if (res.data.success === "ok") {
                toast.info(
                  `PG Status reverted back to ${pgStatus?.previous_status}`
                );
                mutate("/api/get-request");
              } else {
                toast.error("Error updating pg status");
              }
            })
            .catch((error) => {
              toast.error("Error updating pg status");
              console.error(error);
            });
        });
      }
    });
  };

  return (
    <div
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      className={
        !snapshot.isDragging
          ? "bg-[#9233e9] shadow-lg rounded-lg m-2 p-2 md:flex md:flex-row "
          : "bg-purple-900 shadow-lg rounded-lg m-2 p-2 md:flex md:flex-row "
      }
    >
      <div className="basis-1/2">
        <div className="text-white">
          <div className="flex items-center">
            <DesktopComputerIcon className="h-10 w-10" />
            <a
              href={`https://youtube.com/watch?v=${request?.video.video_id}`}
              target="_blank"
              rel={"noreferrer"}
              className="text-xl font-bold hover:underline"
            >
              {request?.video.title}
            </a>
          </div>
          <div className="flex items-center">
            <UserIcon className="h-5 w-5" />
            {request?.requested_by}
          </div>
        </div>
      </div>
      <div className="basis-1/4">
      <div>SOmething</div>
      </div>
      <div className="m-6">
        {(() => {
          switch (request?.video.pg_status.status) {
            case "NOT_CHECKED":
              return (
                <button
                  onClick={handlePGCheck}
                  className="bg-blue-400 mx-4 text-xs font-medium text-center rounded-lg px-4 py-1"
                >
                  NOT CHECKED
                </button>
              );
            case "PG":
              return (
                <>
                  <button
                    onClick={handlePGCheck}
                    className="bg-green-400 mx-4 font-medium rounded-lg px-4 py-1 text-center"
                  >
                    PG
                  </button>

                  <div className="flex items-center text-white">
                    <UserIcon className="h-5 w-5" />
                    {request?.video.pg_status.checker}
                  </div>
                </>
              );
            case "NON_PG":
              return (
                <>
                  <button
                    onClick={handlePGCheck}
                    className="bg-red-400 mx-4 font-medium rounded-lg px-4 py-1 text-center"
                  >
                    NON PG
                  </button>
                  <div className="flex items-center text-white">
                    <UserIcon className="h-5 w-5" />
                    {request?.video.pg_status.checker}
                  </div>
                </>
              );
            case "BEING_CHECKED":
              return (
                <button
                  onClick={handlePGCheck}
                  className="bg-yellow-400 mx-4 text-xs font-medium text-center rounded-lg px-4 py-1"
                >
                  BEING CHECKED
                </button>
              );
            default:
              return null;
          }
        })()}
      </div>
    </div>
  );
};
export default ModRequest;
