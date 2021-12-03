export type Asset = {
  url: string
  browser_download_url: string
  name: string
  size: number
}

export type BinaConfig = {
  platforms: Record<
    string,
    {
      asset: string
      file: string
    }
  >
}

export type Platform = { platform: string; asset: Asset; file: string }
