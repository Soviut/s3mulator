#!/usr/bin/env node
import { parseArgs } from 'node:util'
import { serve } from '@hono/node-server'
import { config } from 'dotenv'
import { createApp } from '@/index'

config()

const { values } = parseArgs({
  options: {
    port: { type: 'string', short: 'p', default: process.env.S3_PORT ?? '5300' },
    storage: { type: 'string', short: 's', default: process.env.S3_STORAGE ?? './s3-data' },
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
      '  -q, --quiet            Suppress request logging',
      '  -h, --help             Show this help message',
    ].join('\n'),
  )
  process.exit(0)
}

const port = parseInt(values.port!, 10)
const app = createApp({ storage: values.storage, logging: !values.quiet })

serve({ fetch: app.fetch, port }, () => {
  if (!values.quiet) console.log(`S3mulator running on http://localhost:${port}`)
})
