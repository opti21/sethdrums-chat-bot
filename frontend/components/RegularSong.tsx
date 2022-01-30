import Link from "next/link";
import { Song } from "../types/types";

const RegularSong = () => {
  return "regular song"
  // return (
  //   <div
  //     className="bg-purple-600 shadow-lg rounded-lg m-2 p-2 flex flex-row h-20"
  //   >
  //     <div className="basis-1/2 ">{song.name}</div>
  //     <div className="basis-1/4">
  //       <Link href={song.link}>
  //         <a className="link link-accent" target="_blank">
  //           {song.link}
  //         </a>
  //       </Link>
  //     </div>
  //   </div>
  // );
};
export default RegularSong;
