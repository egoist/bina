import { NextRequest, NextResponse } from "next/server"
import { generateConfig } from "../lib/generate_config"
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
      console.error(error)
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

  const tokenFromUser = req.headers.get("x-github-token") || params.get("token")
  const ghToken = tokenFromUser || process.env.GITHUB_TOKEN

  const tokenHeader: Record<string, string> = ghToken
    ? { Authorization: `token ${ghToken}` }
    : {}

  const releaseResponse = await fetch(
    `https://api.github.com/repos/${repo.owner}/${repo.name}/releases/${repo.originalVersion}`,
    {
      headers: {
        accept: "application/json",
        ...tokenHeader,
      },
    }
  )

  if (!releaseResponse.ok) {
    console.log("??")
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

  const useAutoGeneratedConfig = !binaConfigFile
  const generatedConfig = binaConfigFile
    ? undefined
    : generateConfig(repo, release.assets)

  const binaConfigResponse =
    binaConfigFile &&
    (await fetch(binaConfigFile.url, {
      method: "HEAD",
      headers: {
        accept: "application/octet-stream",
        ...tokenHeader,
      },
    }))

  const binaConfig: BinaConfig =
    generatedConfig ||
    (binaConfigResponse &&
      (await fetch(binaConfigResponse.url, {
        headers: {
          accept: "application/json",
        },
      })
        .then(async (res) => {
          if (!res.ok) {
            const msg = await res.text()
            throw new Error(msg)
          }
          return res
        })
        .then((res) => res.json())))

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
      name: params.get("name") || repo.name,
      installDir: params.get("dir") || "/usr/local/bin",
      fileInAsset: params.get("file"),
    },
    // Don't pass our own token to the generated script
    token: tokenFromUser ? ghToken : undefined,
    original_version: repo.originalVersion,
    resolved_version: release.tag_name,
    platforms,
    debug: params.has("debug"),
    useAutoGeneratedConfig,
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
