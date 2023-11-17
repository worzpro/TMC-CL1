import { useState } from "react";

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

        <Script
          dangerouslySetInnerHTML={{
            __html: `
          (function (d) {
            var config = {
              kitId: "ust3emg",
              scriptTimeout: 3000,
              async: true,
            },
            h = d.documentElement,
            t = setTimeout(function () {
              h.className = h.className.replace(/\bwf-loading\b/g, "") + " wf-inactive";
            }, config.scriptTimeout),
            tk = d.createElement("script"),
            f = false,
            s = d.getElementsByTagName("script")[0],
            a;
            h.className += " wf-loading";
            tk.src = "https://use.typekit.net/" + config.kitId + ".js";
            tk.async = true;
            tk.onload = tk.onreadystatechange = function () {
              a = this.readyState;
              if (f || (a && a != "complete" && a != "loaded")) return;
              f = true;
              clearTimeout(t);
              try {
                Typekit.load(config);
              } catch (e) {}
            };
            s.parentNode.insertBefore(tk, s);
          })(document);
          `,
          }}
        />
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
