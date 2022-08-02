import Document, { Html, Head, Main, NextScript } from "next/document"

class MyDocument extends Document {
  static async getInitialProps(ctx: any) {
    const initialProps = await Document.getInitialProps(ctx)
    return { ...initialProps }
  }

  render() {
    return (
      <Html>
        <Head />
        <body>
          <Main />
          <NextScript />
          {process.env.NODE_ENV === "production" && (
            <script
              async
              defer
              data-website-id="ce03835b-fcb3-4afd-9db2-73867fc28261"
              src="https://umami.egoist.dev/umami.js"
            ></script>
          )}
        </body>
      </Html>
    )
  }
}

export default MyDocument
