import { Asset, BinaConfig } from "../types"

const getOS = (name: string) => {
  if (/windows/i.test(name)) {
    return "windows"
  }
  if (/linux/i.test(name)) {
    return "linux"
  }
  if (/(mac|darwin|apple)/i.test(name)) {
    return "darwin"
  }
  return "unknown"
}

const getARCH = (name: string) => {
  if (/x64/i.test(name)) {
    return "amd64"
  }
  if (/x86_64/.test(name)) {
    return "amd64"
  }
  if (/x86/i.test(name)) {
    return "386"
  }
  if (/(arm64|aarch)/i.test(name)) {
    return "arm64"
  }
  if (/(386|686)/.test(name)) {
    return "386"
  }
  if (/arm/.test(name)) {
    return "armv7"
  }
  return "unknown"
}

// Generate a bina.json from asset, used if the project doesn't have it
export const generateConfig = (
  repo: { name: string },
  assets: Asset[]
): BinaConfig => {
  const config: BinaConfig = { platforms: {} }

  for (const asset of assets) {
    const platform = `${getOS(asset.name)}-${getARCH(asset.name)}`
    if (!config.platforms[platform]) {
      config.platforms[platform] = {
        asset: asset.name,
        file: repo.name,
      }
    }
  }
  return config
}
