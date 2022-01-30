import { Song } from "../types/types";
import RegularSong from "./RegularSong";

interface Props {
  song: Song[]
}

const RegularView = () => {
  return "Regular View"
  // return (
  //   <div>
  //     <div className="overflow-x-auto">
  //       <div
  //               className="bg-base-200 rounded-lg p-1"
  //       >
  //         {songs.map((song) => {
  //           return <RegularSong key={song.id} song={song} />;
  //         })}
  //       </div>
  //     </div>
  //   </div>
  // );
};

export default RegularView;
