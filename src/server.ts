import { serve } from '@hono/node-server'
import { config } from 'dotenv'
import { createApp } from '@/index'

config()

const port = parseInt(process.env.S3_PORT ?? '5300', 10)
const app = createApp()

serve({ fetch: app.fetch, port }, () => {
  console.log(`S3mulator running on http://localhost:${port}`)
})
