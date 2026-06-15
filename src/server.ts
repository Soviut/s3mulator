#!/usr/bin/env node
import { parseArgs } from 'node:util'
import { serve } from '@hono/node-server'
import { createApp } from '@/index'
import { MemoryStorage } from '@/storage/memory'

const { values } = parseArgs({
  options: {
    port: {
      type: 'string',
      short: 'p',
      default: process.env.S3_PORT ?? '5300',
    },
    storage: {
      type: 'string',
      short: 's',
      default: process.env.S3_STORAGE,
    },
    memory: { type: 'boolean', short: 'm', default: process.env.S3_MEMORY === 'true' },
    quiet: { type: 'boolean', short: 'q', default: false },
    help: { type: 'boolean', short: 'h', default: false },
  },
})

if (values.help) {
  console.log(
    [
      'Usage: s3mulator [options]',
      '',
      'Options:',
      '  -p, --port <port>      Port to listen on            (default: 5300,     env: S3_PORT)',
      '  -s, --storage <path>   Directory to store objects   (default: ./s3-data, env: S3_STORAGE)',
      '  -m, --memory           Store objects in memory      (env: S3_MEMORY=true)',
      '  -q, --quiet            Suppress request logging',
      '  -h, --help             Show this help message',
    ].join('\n'),
  )
  process.exit(0)
}

if (values.memory && values.storage) {
  console.error('Error: --memory and --storage are mutually exclusive')
  process.exit(1)
}

const port = Number(values.port)
const storage = values.memory ? new MemoryStorage() : (values.storage ?? './s3-data')
const app = createApp({ storage, logging: !values.quiet })

serve({ fetch: app.fetch, port }, () => {
  if (!values.quiet) {
    const storageLabel = values.memory ? 'memory' : storage
    console.log(`S3mulator running on http://localhost:${port} (storage: ${storageLabel})`)
  }
})
