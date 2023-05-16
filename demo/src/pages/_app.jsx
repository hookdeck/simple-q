import { MDXProvider } from "@mdx-js/react";
import { ThemeProvider } from "next-themes";
import Head from "next/head";

import { Layout } from "@/components/Layout";
import * as mdxComponents from "@/components/mdx";

import "@/styles/tailwind.css";
import "focus-visible";

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <title>SimpleQ - Open-source queueing system</title>
        <meta
          name="description"
          content="SimpleQ is a simple, fast, and elegant open-source queueing system for Node.js and broswers."
        />
      </Head>
      <ThemeProvider attribute="class" disableTransitionOnChange>
        <MDXProvider components={mdxComponents}>
          <Layout>
            <Component {...pageProps} />
          </Layout>
        </MDXProvider>
      </ThemeProvider>
    </>
  );
}
