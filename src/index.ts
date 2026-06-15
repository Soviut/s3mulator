import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type { AppEnv } from '@/context'
import { S3ErrorCode } from '@/lib/errors'
import { DiskStorage } from '@/lib/storage'
import { errorXml } from '@/lib/xml'
import { errorHandler } from '@/middleware/error'
import { logger } from '@/middleware/logger'
import { presign } from '@/middleware/presign'
import { requestId } from '@/middleware/request-id'
import {
  batchDeleteRouter,
  bucketRouter,
  listRouter,
  objectRouter,
} from '@/routes'

export interface AppConfig {
  storage?: string
  logging?: boolean
}

export function createApp(config: AppConfig = {}): Hono<AppEnv> {
  const dataDir = config.storage ?? process.env.S3_STORAGE ?? './s3-data'
  const logging = config.logging ?? true
  const storage = new DiskStorage(dataDir)

  const app = new Hono<AppEnv>()

  app.use('*', cors())
  if (logging) app.use('*', logger)
  app.use('*', requestId)
  app.use('*', presign)
  app.use('*', async (c, next) => {
    c.set('storage', storage)
    await next()
  })
  app.onError(errorHandler)

  // list and batch-delete must come before bucket — they share /:bucket path
  // and use next() to fall through when query params don't match
  app.route('/', listRouter)
  app.route('/', batchDeleteRouter)
  app.route('/', bucketRouter)
  app.route('/', objectRouter)

  app.notFound((c) => {
    const xml = errorXml(
      S3ErrorCode.NoSuchKey,
      'The specified key does not exist.',
      c.get('requestId') ?? '',
    )
    return c.body(xml, 404, { 'Content-Type': 'application/xml' })
  })

  return app
}
