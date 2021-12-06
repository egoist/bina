#!/usr/bin/env node
import { cac } from "cac"
import { execSync } from "child_process"

let cli = cac("bina")

const ENDOINT = process.env.BINA_DEV
  ? "http://localhost:3000"
  : "https://bina.egoist.sh"

cli
  .command("[repo]", "Install a binary from a repository")
  .option("--token <gh_token>", "Set a GitHub token to access private repos")
  .option(
    "-d, --install-dir <dir>",
    "Set the installation directory (default: /usr/local/bin)"
  )
  .option("-n, --name <name>", "Set the binary name (default: repo name)")
  .action((repo, flags) => {
    if (!repo) return cli.outputHelp()

    const search = new URLSearchParams(
      [
        ["token", flags.token],
        ["dir", flags.installDir],
        ["name", flags.name],
        ["debug", process.env.BINA_DEBUG ? "true" : ""],
      ].filter((v) => Boolean(v[1]))
    ).toString()

    execSync(
      `curl -fsSL "${ENDOINT}/${repo}${search ? `?${search}` : ""}" | sh`,
      {
        stdio: "inherit",
      }
    )
  })

cli.parse()
