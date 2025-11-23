# @arklabs/regtest-env

A small npm package that boots the Ark regtest dependencies (arkd wallet + server) with Docker Compose. It repackages the compose/Dockerfile setup that previously lived in `wallet-sdk` so it can be reused from any project via `npx`.

## Prerequisites

- Docker Engine with the modern `docker compose` plugin (or legacy `docker-compose`).
- [Nigiri](https://github.com/vulpemventures/nigiri) running locally (`nigiri start`). The compose stack joins the external network exposed by Nigiri (`nigiri`).

## Usage

```bash
# Start nigiri somewhere else
nigiri start --ark

# Start/up the Ark services in detached mode
npx @arklabs/regtest-env up

# Follow logs
npx @arklabs/regtest-env logs -f

# Stop and remove containers
npx @arklabs/regtest-env down
```

### Commands

| Command | Description |
| ------- | ----------- |
| `up` (default) | Builds (if necessary) and starts both services in detached mode. Use `--foreground` to keep logs attached. |
| `down` | Stops containers and removes the compose stack. Pass `--volumes` to remove tmpfs volumes. |
| `build` | Rebuilds both images. |
| `logs` | Streams logs from both containers (`docker compose logs`). |
| `ps` / `status` | Shows container status. |

### Options

| Flag | Description |
| ---- | ----------- |
| `--branch <branch>` | Git branch/tag of `arkade-os/arkd` to build (defaults to `next-version`). |
| `--version <version>` | Version string baked into the binaries (defaults to `dev`). |
| `--network <name>` | External Docker network to join (defaults to `nigiri`). |
| `--project-name <name>` | Compose project name prefix (defaults to `ark-regtest`). |
| `--foreground` | When used with `up`, leaves containers attached (no `-d`). |
| `--help` | Prints usage information. |

Environment variables `ARK_BRANCH`, `ARK_VERSION`, and `NIGIRI_NETWORK` offer the same overrides if you prefer configuring via the shell.

## Notes

- Containers mount tmpfs volumes for state. If you need persistence, edit `docker-compose.yml` before running.
- The compose file exposes ports `6060` (arkd-wallet) and `7070` (arkd server) matching the defaults expected by the SDK integration tests.
- Nigiri must already be running so that the external network exists and bitcoind/blockchain services are available.
