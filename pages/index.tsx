import Head from "next/head"
import React from "react"
import { CodeBlock } from "../components/markdown"

const APP_URL =
  process.env.NODE_ENV === "production"
    ? "https://bina.egoist.sh"
    : "http://localhost:3000"

const Window = () => {
  return (
    <div className="bg-gray-800 bg-opacity-50 rounded-lg shadow-xl w-full">
      <header className="bg-black  bg-opacity-40 h-10 rounded-t-lg flex items-center px-4">
        <div className="flex space-x-1">
          <span className="h-2 w-2 rounded-lg bg-gray-700 inline-block"></span>
          <span className="h-2 w-2 rounded-lg bg-gray-700 inline-block"></span>
          <span className="h-2 w-2 rounded-lg bg-gray-700 inline-block"></span>
        </div>
      </header>
      <div className="p-5 font-mono">
        <p>
          {`$ `}
          <span className="text-cyan-500">curl</span>
          {` -sSL ${APP_URL}/denoland/deno | `}
          <span className="text-cyan-500">sh</span>
        </p>
        <div className="mt-5 text-gray-500">
          <p>
            <span className="text-purple-500">{`==> `}</span>
            <span>{`Downloading github.com/denoland/deno@latest`}</span>
          </p>
          <p>
            <span className="text-purple-500">{`==> `}</span>
            {`Resolved version latest to v1.16.3`}
          </p>
          <p>
            <span className="text-purple-500">{`==> `}</span>
            {`Downloading asset for darwin amd64`}
          </p>
          <p>
            <span className="text-purple-500">{`==> `}</span>
            {`Installing deno to /usr/local/bin`}
          </p>
          <p>
            <span className="text-purple-500">{`==> `}</span>
            {`Installation complete`}
          </p>
        </div>
        <div className="mt-5">
          <p>
            {`$ `}
            <span className="text-cyan-500">deno</span>
          </p>
          <p>{`Deno 1.16.3`}</p>
          <p>{`exit using ctrl+d or close()`}</p>
          <p>{`> ▌`}</p>
        </div>
      </div>
    </div>
  )
}

const Section: React.FC<{ title: string }> = ({ title, children }) => {
  return (
    <section className="my-48">
      <h3 className="text-cyan-500 text-xl font-medium mb-6">{title}</h3>
      <div className="text-lg">{children}</div>
    </section>
  )
}

export default function Home() {
  return (
    <>
      <Head>
        <title>Bina - A simple installer for CLI programs.</title>
        <meta
          name="description"
          content="Bina is a shell script that allows you to install CLI programs from GitHub releases, no addtional CLI needed"
        />
      </Head>
      <div className="bg-gray-900 min-h-screen text-gray-200">
        <div className="max-w-screen-lg mx-auto p-5">
          <header className="flex justify-between items-center mt-10">
            <h1 className="text-2xl font-medium">Bina</h1>
            <ul className="flex items-center space-x-3">
              <li>
                <a
                  target="_blank"
                  rel="nofollow noopener"
                  href="https://github.com/egoist/bina"
                >
                  GitHub
                </a>
              </li>
            </ul>
          </header>
          <h2 className="text-7xl my-48 font-bold">
            An installer for{" "}
            <span className="text-yellow-400">self-contained</span>,{" "}
            <span className="text-cyan-500">single-file</span> binaries.
          </h2>
          <section className="my-5 flex flex-col justify-between space-y-8 md:flex-row md:space-y-0 md:space-x-5">
            <div className="font-medium text-lg md:w-4/12">
              <div className="md:w-10/12">
                <div>Install binaries from GitHub Releases.</div>
                <div>No additional CLI required.</div>
              </div>
            </div>
            <div className="md:w-8/12">
              <Window />
            </div>
          </section>
          <Section title="Introduction">
            <p>
              Bina allows you to install CLI programs distributed via GitHub
              Releases, without the need for using a separate CLI, all you need
              is a single curl command.
            </p>
          </Section>
          <Section title="For Users">
            <div className="markdown-body">
              <p>Basic usage:</p>
              <CodeBlock code={`curl -sSL ${APP_URL}/$OWNER/$NAME | sh`} />
              <p>
                The above command will install appropriate release from{" "}
                <code>github.com/$OWNER/$NAME</code>, by default we install it
                to <code>/usr/local/bin</code> directory, but you can change
                this by passing a query parameter <code>dir</code> like this:
              </p>
              <CodeBlock
                code={`curl -sSL "${APP_URL}/$OWNER/$NAME?dir=./bin" | sh`}
              />
              <p>
                This will then install the binary to <code>./bin</code>{" "}
                directory instead.
              </p>
              <p>
                If you want to install a specific version, you can append{" "}
                <code>@$VERSION</code> to the pathname:
              </p>
              <CodeBlock
                code={`curl -sSL "${APP_URL}/$OWNER/$NAME@v1.2.3" | sh`}
              />
              <p>More query parameters are available:</p>
              <ul>
                <li>
                  <code>name</code>: Custom binary name, by default it's the
                  repo name.
                </li>
                <li>
                  <code>token</code>: GitHub personal token, if you want to
                  install from a private repo. Alternatively you can pass the
                  token via http header:{" "}
                  <code>curl -H "x-github-token:YOUR_TOKEN"</code>
                </li>
              </ul>
            </div>
          </Section>
          <Section title="For Maintainers">
            <div className="markdown-body">
              <p>
                Bina automatically{" "}
                <a
                  href="https://github.com/egoist/bina/blob/main/lib/generate_config.ts"
                  target="_blank"
                  rel="nofollow noopener"
                >
                  infers the asset name based on the user's OS and ARCH
                </a>
                , but sometimes it can go wrong, because not everyone follows
                the same naming convention when publishing their assets, that's
                where the <code>bina.json</code> comes in.
              </p>
              <p>
                To make Bina get the asset 100% correctly, you need to add a{" "}
                <code>bina.json</code>
                file to your release assets like this:
              </p>
              <CodeBlock
                code={`{
  "platforms": {
    "darwin-amd64": {
      "asset": "my-program-darin-x86_64.tar.gz",
      "file": "bin/my-program"
    },
    "windows-amd64": {
      "asset": "my-program-windows-x86_64.tar.gz",
      "file": "bin/my-program.exe"
    }
  }
}`}
              />
              <p>
                The platform name is a combination of OS and ARCH, where OS can
                be:
              </p>
              <ul className="list-disc pl-12 my-5">
                <li>darwin</li>
                <li>dragonfly</li>
                <li>freebsd</li>
                <li>linux</li>
                <li>android</li>
                <li>nacl</li>
                <li>netbsd</li>
                <li>openbsd</li>
                <li>plan9</li>
                <li>solaris</li>
                <li>windows</li>
              </ul>
              <p>And ARCH can be:</p>
              <ul className="list-disc pl-12 my-5">
                <li>amd64</li>
                <li>386</li>
                <li>arm64</li>
                <li>armv5</li>
                <li>armv6</li>
                <li>armv7</li>
                <li>ppc64</li>
                <li>ppc64le</li>
                <li>mips</li>
                <li>mipsle</li>
                <li>mips64</li>
                <li>s390x</li>
                <li>amd64p32</li>
              </ul>
              <p className="my-5">
                <code>asset</code> refers to the name of an asset in the
                release. Currently, only <code>.zip</code>, <code>.tar.gz</code>{" "}
                and <code>.tar.xz</code> are supported.
              </p>
              <p className="my-5">
                <code>file</code> refers to the path to the binary file inside
                the archived asset.
              </p>
            </div>
          </Section>
          <Section title="FAQ">
            <div className="markdown-body">
              <details open>
                <summary>It shows 403 error or GitHub rate limit error</summary>
                <p>
                  On our server, we call GitHub API to retrived repo release
                  information, in the downloaded shell script it will call
                  GitHub API to download the asset. The first one happens on our
                  server, and the second one happens locally on your machine.
                </p>
                <p>
                  Sometimes it hits rate limit on the server side and shows{" "}
                  <code>server error</code> in the error message, in this case
                  you need to provide a GitHub personal token in the{" "}
                  <code>curl</code> command via query parameter{" "}
                  <code>?token=FOO</code> or http header{" "}
                  <code>x-github-token=FOO</code>.
                </p>
                <p>
                  Otherwise, it will be an error from the shell script you ran
                  locally. Setting query paramater or http header will also fix
                  this, but you can also use an environment variable{" "}
                  <code>GITHUB_TOKEN</code> locally to avoid that, in this way
                  the token will never be sent to our server.
                </p>
                <div></div>
              </details>
              <details open>
                <summary>Can I share the shell script?</summary>
                <p>
                  Absolutely Yes, if you open <code>{APP_URL}/$OWN/$REPO</code>{" "}
                  in your browser you can see the generated shell script, you
                  can share the code with anyone. But please note that the query
                  parameters will be harecoded into the script, which means you
                  should NOT share the script when using a <code>?token=</code>{" "}
                  query.
                </p>
              </details>
            </div>
          </Section>
          <Section title="Sponsors">
            <div className="markdown-body">
              <p>
                You can support this project via{" "}
                <a
                  href="https://github.com/sponsors/egoist"
                  target="_blank"
                  rel="nofollow noopener"
                  className="text-cyan-500 underline"
                >
                  GitHub Sponsors
                </a>
                .
              </p>
              <a
                href="https://github.com/sponsors/egoist"
                target="_blank"
                rel="nofollow noopener"
                className="border border-gray-800 rounded-lg p-5 block"
              >
                <img
                  alt="github sponsors"
                  src="https://sponsors-images.egoist.sh/sponsors.svg"
                  className="mx-auto"
                />
              </a>
            </div>
          </Section>
        </div>
      </div>
    </>
  )
}
