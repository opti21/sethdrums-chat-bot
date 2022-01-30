import Image from "next/image";
import Link from "next/link";
import { signIn, signOut, useSession } from "next-auth/react";

function PepegaNav() {
  const { data: session, status } = useSession();
  return (
    <nav className="flex items-center justify-between bg-[#1f134e] mb-2 shadow-lg bg-neutral rounded-lg px-4 py-3">
      <div className="flex-none">
        <div className="text-lg font-bold px-2 mx-2 text-white">Pepega Panel</div>
      </div>
      <div></div>
      <div className="navbar-end flex items-center">
        {session ? (
          <>
            <div
            className="text-white hidden sm:block"
            >{session?.user?.name}</div>
            {session?.user?.image ? (
              <div className="mx-4 rounded-full w-10 h-10 ring ring-pink-400 ring-offset-base-100 ring-offset-2">
                <Image
                className="rounded-full"
                alt={`${session?.user.name}'s profile picture'`} src={session?.user.image} height={150} width={150} />
              </div>
            ) : (
              <div className="bg-pink-500 mx-4 pt-1.5 rounded-full w-10 h-10 ring ring-pink-400 ring-offset-base-100 ring-offset-2">
                <span className="text-white font-bold ml-2">
                  {session?.user?.name?.slice(0, 2).toLocaleUpperCase()}
                </span>
              </div>
            )}
            <button
              onClick={() => signOut()}
              className="bg-pink-400 rounded-lg p-2 ml-2 mr-2 font-medium text-sm"
            >
            SIGN OUT
            </button>
          </>
        ) : (
          <button
            onClick={() => signIn("twitch")}
              className="bg-pink-400 rounded-lg p-2 ml-2 mr-2 my-0.5 font-medium text-sm"
          >
          SIGN IN
          </button>
        )}
      </div>
    </nav>
  );
}

export default PepegaNav;
