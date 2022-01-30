import "../styles/globals.css";
import type { AppProps } from "next/app";
import { SessionProvider } from "next-auth/react";
import { SWRConfig } from "swr";
import {ToastContainer} from "react-toastify"
import 'react-toastify/dist/ReactToastify.css';

function MyApp({ Component, pageProps: { session, ...pageProps } }: AppProps) {

  return (
    <SessionProvider session={session}>
      <SWRConfig
        value={{
          fetcher: (resource, init) =>
            fetch(resource, init).then((res) => res.json()),
            refreshInterval: 1000
        }}
      >
        <ToastContainer />
        <Component {...pageProps} />
      </SWRConfig>
    </SessionProvider>
  );
}

export default MyApp;
