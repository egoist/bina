import { NextRequest, NextResponse } from "next/server"
import { makeErrorScript, makeInstallerScript } from "../make_sh"
import { Asset, BinaConfig, Platform } from "../types"

const REPO_RE = /^([^\/]+)\/([^\/@]+)(?:@(.+))?$/

const parseRepo = (input: string) => {
  const [, owner, name, originalVersion = "latest"] = REPO_RE.exec(input) || []
  if (!owner || !name) {
    return
  }

  return { owner, name, originalVersion }
}

const handleMakeInstallerError = (
  handler: (req: NextRequest) => Promise<NextResponse | Response>
) => {
  return async (req: NextRequest) => {
    try {
      return await handler(req)
    } catch (error: any) {
      return new Response(makeErrorScript(error.message))
    }
  }
}

const installerScriptHandler = handleMakeInstallerError(async (req) => {
  const pathname = req.nextUrl.pathname
  const params = req.nextUrl.searchParams

  const repo = parseRepo(pathname.slice(1))

  if (!repo) {
    return NextResponse.next()
  }

  const githubHeaders: Record<string, string> = {
    accept: "application/json",
  }
  const ghToken = params.get("token")

  if (ghToken) {
    githubHeaders.authorization = `token ${ghToken}`
  }

  const releaseResponse = await fetch(
    `https://api.github.com/repos/${repo.owner}/${repo.name}/releases/${repo.originalVersion}`,
    {
      headers: {
        ...githubHeaders,
      },
    }
  )

  if (!releaseResponse.ok) {
    throw new Error(releaseResponse.statusText)
  }

  const release: {
    tag_name: string
    assets?: Asset[]
  } = await releaseResponse.json()

  if (!release.assets || release.assets.length === 0) {
    throw new Error(`No assets in this release (tag: ${release.tag_name})`)
  }

  const binaConfigFile = release.assets.find(
    (asset) => asset.name === "bina.json"
  )

  if (!binaConfigFile) {
    throw new Error(
      `No Bina config found in this release (tag: ${release.tag_name})`
    )
  }

  const binaConfig: BinaConfig = await fetch(
    binaConfigFile.browser_download_url,
    {
      headers: {
        ...githubHeaders,
      },
    }
  ).then((res) => res.json())

  const platforms: Platform[] = []
  for (const platform in binaConfig.platforms) {
    const value = binaConfig.platforms[platform]
    const asset = release.assets!.find((asset) => asset.name === value.asset)
    if (!asset) {
      throw new Error(
        `No asset found for platform ${platform}: ${value} does not exist`
      )
    }
    platforms.push({
      platform,
      asset,
      file: value.file,
    })
  }

  const script = makeInstallerScript({
    api: "http://localhost:3000",
    repo,
    bin: {
      name: repo.name,
      installDir: params.get("dir") || "/usr/local/bin",
    },
    token: ghToken,
    original_version: repo.originalVersion,
    resolved_version: release.tag_name,
    platforms,
    debug: params.has("debug"),
  })

  return new Response(script)
})

export default async (req: NextRequest) => {
  if (req.nextUrl.pathname === "/test") {
    console.log(req.headers)
    return new Response(`<h1>Hello world</h1>`)
  }
  const res = await installerScriptHandler(req)
  return res
}
