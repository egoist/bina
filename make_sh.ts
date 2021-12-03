import { Platform } from "./types"

export const makeErrorScript = (error: string) => {
  return `
  #!/bin/sh

  set -e

  echoerr() {
    printf "$@\n" 1>&2
  }

  log_crit() {
    echoerr
    echoerr "  \\033[38;5;125m$@\\033[0;00m"
    echoerr
  }

  log_crit ${JSON.stringify(error)}
  exit 1

  `
}

export const makeInstallerScript = ({
  original_version,
  resolved_version,
  api,
  repo,
  bin,
  platforms,
  token,
  debug,
}: {
  original_version: string
  resolved_version: string
  api: string
  repo: { owner: string; name: string }
  bin: { name: string; installDir: string }
  platforms: Platform[]
  token?: string | null
  debug?: boolean
}) => {
  const whenDebug = (input: string) => {
    return debug ? input : ""
  }
  return `
  #!/bin/sh

  set -e
  
  # Some utilities from https://github.com/client9/shlib

  echoerr() {
    printf "$@\n" 1>&2
  }
  
  log_info() {
    printf "\\033[38;5;61m  ==>\\033[0;00m $@\n"
  }
  
  log_crit() {
    echoerr
    echoerr "  \\033[38;5;125m$@\\033[0;00m"
    echoerr
  }
  
  is_command() {
    command -v "$1" >/dev/null
    #type "$1" > /dev/null 2> /dev/null
  }
  
  http_download_curl() {
    local_file=$1
    source_url=$2
    header1=$3
    header2=$4
    header3=$5

    code=$(curl ${whenDebug(
      `-v`
    )} -w '%{http_code}' -H "$header1" -H "$header2" -H "$header3" -sSL -o "$local_file" "$source_url")
    if [ "$code" != "200" ]; then
      log_crit "Error downloading, got $code response from server"
      return 1
    fi
    return 0
  }
  
  http_download_wget() {
    local_file=$1
    source_url=$1
    header1=$3
    header2=$4
    header3=$5

    wget -q --header "$header1" --header "$header2" --header "$header3" -O "$local_file" "$source_url"
  }
  
  http_download() {
    if is_command curl; then
      http_download_curl "$@"
      return
    elif is_command wget; then
      http_download_wget "$@"
      return
    fi
    log_crit "http_download unable to find wget or curl"
    return 1
  }

  
  uname_os() {
    os=$(uname -s | tr '[:upper:]' '[:lower:]')
  
    # fixed up for https://github.com/client9/shlib/issues/3
    case "$os" in
      msys_nt*) os="windows" ;;
      mingw*) os="windows" ;;
    esac
  
    # other fixups here
    echo "$os"
  }
  
  uname_os_check() {
    os=$(uname_os)
    case "$os" in
      darwin) return 0 ;;
      dragonfly) return 0 ;;
      freebsd) return 0 ;;
      linux) return 0 ;;
      android) return 0 ;;
      nacl) return 0 ;;
      netbsd) return 0 ;;
      openbsd) return 0 ;;
      plan9) return 0 ;;
      solaris) return 0 ;;
      windows) return 0 ;;
    esac
    log_crit "uname_os_check '$(uname -s)' got converted to '$os' which is not supported by Bina."
    return 1
  }
  
  uname_arch() {
    arch=$(uname -m)
    case $arch in
      x86_64) arch="amd64" ;;
      x86) arch="386" ;;
      i686) arch="386" ;;
      i386) arch="386" ;;
      aarch64) arch="arm64" ;;
      armv5*) arch="armv5" ;;
      armv6*) arch="armv6" ;;
      armv7*) arch="armv7" ;;
    esac
    echo \${arch}
  }
  
  uname_arch_check() {
    arch=$(uname_arch)
      case "$arch" in
      386) return 0 ;;
      amd64) return 0 ;;
      arm64) return 0 ;;
      armv5) return 0 ;;
      armv6) return 0 ;;
      armv7) return 0 ;;
      ppc64) return 0 ;;
      ppc64le) return 0 ;;
      mips) return 0 ;;
      mipsle) return 0 ;;
      mips64) return 0 ;;
      mips64le) return 0 ;;
      s390x) return 0 ;;
      amd64p32) return 0 ;;
    esac
    log_crit "uname_arch_check '$(uname -m)' got converted to '$arch' which is not supported by Bina."
    return 1
  }

  platform_check() {
    platform="$os-$arch"
    case "$platform" in
      ${platforms
        .map((p) => {
          return `${p.platform}) 
          download_url="${p.asset.url}" 
          download_file_name="${p.asset.name}"
          bin_file="${p.file}"
          ;;`
        })
        .join("\n")}
      *)
      log_crit "platform $platform is not supported by $repo_url."
      exit 1
      ;;
    esac
  }

  #
  # untar: untar or unzip $1
  #
  # if you need to unpack in specific directory use a
  # subshell and cd
  #
  # (cd /foo && untar mytarball.gz)
  #
  untar() {
    tarball=$1
    case "\${tarball}" in
      *.tar.gz | *.tgz) tar -xzf "\${tarball}" ;;
      *.tar) tar -xf "\${tarball}" ;;
      *.zip) unzip -qj "\${tarball}" ;;
      *)
        log_err "untar unknown archive format for \${tarball}"
        return 1
        ;;
    esac
  }

  
  mktmpdir() {
    TMPDIR="$(mktemp -d)"
    mkdir -p "\${TMPDIR}"
    echo "\${TMPDIR}"
  }

  
  start() {
    uname_os_check
    uname_arch_check
    platform_check

    repo="${repo.owner}/${repo.name}"
    # github repo such as "github.com/egoist/doko"
    repo_url="github.com/$repo"
  
    install_dir="${bin.installDir}"
    bin_name="${bin.name}"
    ${token ? `github_token="${token}"` : ``}
  
    # API endpoint such as "http://localhost:3000"
    api="${api}"

    # original_version such as "latest"
    original_version="${original_version}"
  
    # version such as "master"
    version="${resolved_version}"
    
    tmpdir="$(mktmpdir)"

    bin_dest="$tmpdir/$bin_name"
    tmp="$tmpdir/$download_file_name"
  
    echo
    log_info "Downloading $repo_url@$original_version"
    if [ "$original_version" != "$version" ]; then
      log_info "Resolved version $original_version to $version"
    fi
    log_info "Downloading asset for $os $arch"

    if [ -n "$github_token" ]; then
      auth_header="Authorization: token $github_token"
    fi

    http_download "$tmp" "$download_url" "accept: application/octet-stream" "$auth_header"

    ${whenDebug(`echo "temp dir: $tmpdir"`)}

    # Extract
    cd "$tmpdir"
    untar "$tmp"
  
    if [ -w "$install_dir" ]; then
    log_info "Installing $bin_name to $install_dir"
      install "$bin_file" "$install_dir"
    else
      log_info "Permissions required for installation to $install_dir — alternatively specify a new directory with:"
      log_info "  $ curl -sSL "https://bina.egoist.sh/$repo@$version?dir=/dir/to/install/to" | sh"
      sudo install "$bin_file" "$install_dir"
    fi
  
    log_info "Installation complete"
    echo
  }
  
  start  
  `
}
