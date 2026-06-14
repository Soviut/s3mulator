import { mkdtempSync, rmSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { afterAll, afterEach } from 'vitest'
import { serve } from '@hono/node-server'
import { createApp } from '@/index'

export function createTestApp() {
  const dataDir = mkdtempSync(join(tmpdir(), 's3-'))
  const app = createApp({ storage: dataDir })

  afterEach(() => {
    rmSync(dataDir, { recursive: true, force: true })
  })

  return app
}

export function createTestServer(): Promise<string> {
  const dataDir = mkdtempSync(join(tmpdir(), 's3-'))
  const app = createApp({ storage: dataDir })

  return new Promise((resolve) => {
    const server = serve({ fetch: app.fetch, port: 0 }, (info) => {
      afterAll(() => {
        server.close()
        rmSync(dataDir, { recursive: true, force: true })
      })
      resolve(`http://localhost:${info.port}`)
    })
  })
}
