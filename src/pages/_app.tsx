import { useState, useEffect } from "react";

import "@/styles/global.css";
import Head from "next/head";
import Script from "next/script";
import type { AppProps } from "next/app";
import Layout from "@/components/layout/Layout";

import { ChakraProvider } from "@chakra-ui/react";
import theme from "@/styles/chakra/theme";

export default function App({ Component, pageProps }: AppProps) {
  const [showHint, setShowHint] = useState(true);
  const [isToneStarted, setIsToneStarted] = useState(false);

  useEffect(() => {
    const handleContextMenu = (event: Event) => {
      event.preventDefault();
    };

    document.addEventListener("contextmenu", handleContextMenu);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
    };
  }, []);

  return (
    <>
      <Head>
        <title key="title">PUZZLEMAN - 北流雲取樣機 TMC CL-1</title>
        {/* <link rel="icon" href="/favicon.ico" /> */}

        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta key="og_type" property="og:type" content="website" />
        <meta
          key="og_url"
          property="og:url"
          content="https://tmccl1.tmccloud.taipei/cassettes/puzzleman"
        />

        <meta
          key="og_title"
          property="og:title"
          content="PUZZLEMAN - 北流雲取樣機 TMC CL-1"
        />
        <meta
          key="og_description"
          property="og:description"
          content="PUZZLEMAN - 北流雲取樣機 TMC CL-1"
        />
        <link rel="stylesheet" href="https://use.typekit.net/uyb4rnh.css" />
      </Head>
      <ChakraProvider theme={theme}>
        <Layout
          showHint={showHint}
          setShowHint={setShowHint}
          setIsToneStarted={setIsToneStarted}
        >
          <Component isToneStarted={isToneStarted} {...pageProps} />
        </Layout>
      </ChakraProvider>
    </>
  );
}
