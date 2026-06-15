import { afterAll } from 'vitest'
import { serve } from '@hono/node-server'
import { createApp } from '@/index'
import { MemoryStorage } from '@/storage/memory'

export function createTestApp() {
  return createApp({ storage: new MemoryStorage(), logging: false })
}

export function createTestServer(): Promise<string> {
  const app = createApp({ storage: new MemoryStorage(), logging: false })

  return new Promise((resolve) => {
    const server = serve({ fetch: app.fetch, port: 0 }, (info) => {
      afterAll(() => server.close())
      resolve(`http://localhost:${info.port}`)
    })
  })
}
