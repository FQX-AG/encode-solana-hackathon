import type { DocumentHeadTagsProps } from "@mui/material-nextjs/v14-pagesRouter";
import { documentGetInitialProps, DocumentHeadTags } from "@mui/material-nextjs/v14-pagesRouter";
import { DocumentContext, DocumentProps, Head, Html, Main, NextScript } from "next/document";

export default function Document(props: DocumentProps & DocumentHeadTagsProps) {
  return (
    <Html lang="en">
      <Head>
        <DocumentHeadTags {...props} />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}

Document.getInitialProps = async (ctx: DocumentContext) => {
  return await documentGetInitialProps(ctx);
};
