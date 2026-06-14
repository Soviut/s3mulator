import type { Context } from 'hono'
import type { AppEnv } from '@/context'
import { S3ErrorCode } from '@/lib/errors'
import { errorXml } from '@/lib/xml'

export function errorHandler(err: Error, c: Context<AppEnv>): Response {
  const requestId = c.get('requestId') ?? ''
  const xml = errorXml(S3ErrorCode.InternalError, err.message, requestId)
  return c.body(xml, 500, { 'Content-Type': 'application/xml' })
}
