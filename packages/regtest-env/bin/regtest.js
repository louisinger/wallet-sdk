#!/usr/bin/env node
'use strict'

const { spawnSync } = require('child_process')
const path = require('path')
const fs = require('fs')
const { setupArkEnvironment } = require('../setup')

const pkgRoot = path.resolve(__dirname, '..')
const composeFile = path.join(pkgRoot, 'docker-compose.yml')
const defaultProject = process.env.REGTEST_PROJECT || 'ark-regtest'

if (!fs.existsSync(composeFile)) {
  console.error(`Unable to locate compose file at ${composeFile}. Try reinstalling @arklabs/regtest-env.`)
  process.exit(1)
}

const composeCommands = new Set(['up', 'down', 'build', 'logs', 'ps', 'status', 'restart'])
const allowedCommands = new Set([...composeCommands, 'setup'])
let composeCommand = null

const parsed = parseArgs(process.argv.slice(2))
const { command, options, passthrough } = parsed

if (options.help) {
  printHelp()
  process.exit(0)
}

if (command === 'setup') {
  warnMissingNetwork(options.network)
  setupArkEnvironment({
    serverUrl: options.serverUrl,
    explorerUrl: options.explorerUrl,
    password: options.password,
    network: options.network
  })
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Setup failed:', error)
      process.exit(1)
    })
} else if (composeCommands.has(command)) {
  composeCommand = detectComposeCommand()
  if (command === 'up') {
    warnMissingNetwork(options.network)
    const upArgs = ['up']
    if (!options.foreground) {
      upArgs.push('-d')
    }
    runCompose([...upArgs, ...passthrough])
  } else if (command === 'down') {
    runCompose(['down', ...passthrough])
  } else if (command === 'build') {
    runCompose(['build', ...passthrough])
  } else if (command === 'logs') {
    runCompose(['logs', ...passthrough])
  } else if (command === 'ps' || command === 'status') {
    runCompose(['ps', ...passthrough])
  } else if (command === 'restart') {
    runCompose(['restart', ...passthrough])
  }
} else {
  console.error(`Unknown command "${command}"`)
  printHelp()
  process.exit(1)
}

function runCompose(args) {
  const env = {
    ...process.env,
    ARK_BRANCH: options.branch,
    ARK_VERSION: options.version,
    NIGIRI_NETWORK: options.network
  }

  const result = spawnSync(
    composeCommand.command,
    [...composeCommand.args, '-p', options.projectName, '-f', composeFile, ...args],
    {
      cwd: pkgRoot,
      stdio: 'inherit',
      env
    }
  )

  if (result.error) {
    console.error(result.error.message)
    process.exit(1)
  }

  process.exit(result.status ?? 0)
}

function detectComposeCommand() {
  const modern = spawnSync('docker', ['compose', 'version'], { stdio: 'ignore' })
  if (modern.status === 0) {
    return { command: 'docker', args: ['compose'] }
  }

  const legacy = spawnSync('docker-compose', ['version'], { stdio: 'ignore' })
  if (legacy.status === 0) {
    return { command: 'docker-compose', args: [] }
  }

  console.error('Neither "docker compose" nor "docker-compose" is available. Install Docker Compose to continue.')
  process.exit(1)
}

function warnMissingNetwork(networkName) {
  const check = spawnSync('docker', ['network', 'inspect', networkName], { stdio: 'ignore' })
  if (check.status !== 0) {
    console.warn(
      `Docker network "${networkName}" not found. Start Nigiri (e.g. "nigiri start") or create the network manually before running the stack.`
    )
  }
}

function parseArgs(argv) {
  const options = {
    branch: process.env.ARK_BRANCH || 'next-version',
    version: process.env.ARK_VERSION || 'dev',
    network: process.env.NIGIRI_NETWORK || 'nigiri',
    projectName: defaultProject,
    foreground: false,
    help: false,
    serverUrl: process.env.ARK_SERVER_URL || 'http://localhost:7070',
    explorerUrl: process.env.ARK_EXPLORER_URL || 'http://chopsticks:3000',
    password: process.env.ARK_PASSWORD || 'secret'
  }

  let command = null
  const passthrough = []
  const tokens = [...argv]

  while (tokens.length) {
    const token = tokens.shift()

    if (token === '--') {
      passthrough.push(...tokens)
      break
    }

    if (token === 'help') {
      options.help = true
      continue
    }

    if (!command && allowedCommands.has(token)) {
      command = token
      continue
    }

    if (token.startsWith('--branch')) {
      options.branch = readFlagValue(token, tokens, '--branch')
      continue
    }

    if (token.startsWith('--version')) {
      options.version = readFlagValue(token, tokens, '--version')
      continue
    }

    if (token.startsWith('--network')) {
      options.network = readFlagValue(token, tokens, '--network')
      continue
    }

    if (token.startsWith('--project-name')) {
      options.projectName = readFlagValue(token, tokens, '--project-name')
      continue
    }

    if (token === '--foreground') {
      options.foreground = true
      continue
    }

    if (token === '--help' || token === '-h') {
      options.help = true
      continue
    }

    if (token.startsWith('--server-url')) {
      options.serverUrl = readFlagValue(token, tokens, '--server-url')
      continue
    }

    if (token.startsWith('--explorer-url')) {
      options.explorerUrl = readFlagValue(token, tokens, '--explorer-url')
      continue
    }

    if (token.startsWith('--password')) {
      options.password = readFlagValue(token, tokens, '--password')
      continue
    }

    if (!token.startsWith('-') && !command) {
      command = token
      continue
    }

    passthrough.push(token)
  }

  return {
    command: command || 'up',
    options,
    passthrough
  }
}

function readFlagValue(token, tokens, flag) {
  if (token === flag) {
    return expectValue(flag, tokens.shift())
  }
  const [, value] = token.split('=')
  if (value === undefined || value === '') {
    console.error(`Missing value for ${flag}`)
    process.exit(1)
  }
  return value
}

function expectValue(flag, value) {
  if (!value) {
    console.error(`Missing value for ${flag}`)
    process.exit(1)
  }
  return value
}

function printHelp() {
  console.log(`Usage: ark-regtest [command] [options] [-- <docker compose args>]

Commands:
  up         Build (if needed) and start the stack (default)
  down       Stop and remove the stack
  build      Rebuild arkd and arkd-wallet images
  logs       Tail docker compose logs
  ps|status  Show container status
  restart    Restart the running containers
  setup      Run the Nigiri-based provisioning routine (arkd wallet + ark client)

Options:
  --branch <branch>         Git branch/tag of arkade-os/arkd (default: next-version)
  --version <version>       Version string baked into the binaries (default: dev)
  --network <name>          External Docker network to join (default: nigiri)
  --project-name <name>     Compose project name (default: ark-regtest)
  --foreground              Run "up" in the foreground (omit -d)
  --server-url <url>        ARK server URL for setup (default: http://localhost:7070)
  --explorer-url <url>      Explorer URL for setup (default: http://chopsticks:3000)
  --password <value>        Nigiri password used during setup (default: secret)
  --help, -h                Show this help text

Additional arguments following "--" are passed directly to docker compose.`)
}
