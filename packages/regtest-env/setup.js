const { promisify } = require('util')
const { setTimeout } = require('timers')
const { execSync, spawn } = require('child_process')

const sleep = promisify(setTimeout)

async function execCommand(command) {
  return new Promise((resolve, reject) => {
    try {
      const result = execSync(command)
      resolve(result)
    } catch (error) {
      if (error.stderr && error.stderr.toString().includes('wallet already initialized')) {
        console.log('Wallet already initialized, continuing...')
        resolve(Buffer.from(''))
      } else {
        reject(error)
      }
    }
  })
}

async function waitForArkServer(serverInfoUrl, maxRetries = 30, retryDelay = 2000) {
  console.log('Waiting for ARK server to be ready...')
  for (let i = 0; i < maxRetries; i++) {
    try {
      execSync(`curl -s ${serverInfoUrl}`)
      console.log('ARK server is ready')
      return true
    } catch {
      console.log(`Waiting for ARK server to be ready (${i + 1}/${maxRetries})...`)
      await sleep(retryDelay)
    }
  }
  throw new Error('ARK server failed to be ready after maximum retries')
}

async function checkWalletStatus() {
  const statusOutput = execSync('nigiri arkd wallet status').toString()
  const initialized = statusOutput.includes('initialized: true')
  const unlocked = statusOutput.includes('unlocked: true')
  const synced = statusOutput.includes('synced: true')
  return { initialized, unlocked, synced }
}

async function waitForWalletReady(maxRetries = 30, retryDelay = 2000) {
  for (let i = 0; i < maxRetries; i++) {
    const status = await checkWalletStatus()
    if (status.initialized && status.unlocked && status.synced) {
      console.log('Wallet is ready')
      return true
    }
    console.log(`Waiting for wallet to be ready (${i + 1}/${maxRetries})...`)
    await sleep(retryDelay)
  }
  throw new Error('Wallet failed to be ready after maximum retries')
}

function waitForSettlement(password) {
  return new Promise((resolve, reject) => {
    const settle = spawn('nigiri', ['ark', 'settle', '--password', password])

    settle.stderr.on('data', (data) => {
      console.error(`settle stderr: ${data}`)
    })

    settle.on('error', (error) => {
      reject(error)
    })

    settle.on('close', (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`settle process exited with code ${code}`))
      }
    })
  })
}

async function setupArkEnvironment({
  serverUrl = 'http://localhost:7070',
  explorerUrl = 'http://chopsticks:3000',
  password = 'secret',
  network = 'regtest'
} = {}) {
  try {
    const normalizedServerUrl = serverUrl.replace(/\/+$/, '')
    const normalizedExplorerUrl = explorerUrl.replace(/\/+$/, '')
    const serverInfoUrl = `${normalizedServerUrl}/v1/info`

    await waitForArkServer(serverInfoUrl)

    const mnemonic = 'abandon '.repeat(23) + 'abandon'
    await execCommand(`nigiri arkd wallet create --password ${password} --mnemonic "${mnemonic}"`)
    await execCommand(`nigiri arkd wallet unlock --password ${password}`)

    await waitForWalletReady()

    const serverInfo = JSON.parse(execSync(`curl -s ${serverInfoUrl}`).toString())
    console.log('Ark Server Public Key:', serverInfo.pubkey)

    const arkdAddress = (await execCommand('nigiri arkd wallet address')).toString().trim()
    console.log('Funding arkd address:', arkdAddress)
    await execCommand(`nigiri faucet ${arkdAddress}`)

    await sleep(5000)

    await execCommand(
      `nigiri ark init --server-url ${normalizedServerUrl} --explorer ${normalizedExplorerUrl} --password ${password} --network ${network}`
    )

    const arkReceiveOutput = (await execCommand('nigiri ark receive')).toString()
    const boardingAddress = JSON.parse(arkReceiveOutput).boarding_address
    console.log('Funding boarding address:', boardingAddress)
    await execCommand(`nigiri faucet ${boardingAddress}`)

    await sleep(5000)

    await waitForSettlement(password)
    console.log('Settlement completed successfully')

    console.log('Ark server and client setup completed successfully')
  } catch (error) {
    console.error('Error setting up Ark server:', error)
    throw error
  }
}

async function main() {
  try {
    await setupArkEnvironment()
  } catch (error) {
    console.error('Setup failed:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

module.exports = {
  setupArkEnvironment
}
