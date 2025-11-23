import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const { setupArkEnvironment } = require('../packages/regtest-env/setup.js')

setupArkEnvironment()
  .then(() => {
    console.log('Ark server and client setup completed successfully')
  })
  .catch((error) => {
    console.error('Setup failed:', error)
    process.exit(1)
  })
