import type { Context } from 'hono'
import type { ContentfulStatusCode } from 'hono/utils/http-status'
import type { AppEnv } from '@/context'
import type { S3ErrorCode } from '@/lib/errors'
import type { ObjectMeta } from '@/lib/storage'
import { errorXml } from '@/lib/xml'

type AppContext = Context<AppEnv>

const ERROR_MESSAGES: Record<string, string> = {
  NoSuchKey: 'The specified key does not exist.',
  NoSuchBucket: 'The specified bucket does not exist.',
  BucketAlreadyExists: 'The requested bucket name is not available.',
  RequestExpired: 'Request has expired.',
  InternalError: 'We encountered an internal error. Please try again.',
}

export function xmlResponse(
  c: AppContext,
  xml: string,
  status = 200,
): Response {
  return c.body(xml, status as ContentfulStatusCode, {
    'Content-Type': 'application/xml',
  })
}

export function errorResponse(
  c: AppContext,
  code: S3ErrorCode,
  status: number,
): Response {
  const requestId = c.get('requestId') ?? ''
  const message = ERROR_MESSAGES[code] ?? 'An error occurred.'
  return xmlResponse(c, errorXml(code, message, requestId), status)
}

export function setObjectHeaders(c: AppContext, meta: ObjectMeta): void {
  c.header('ETag', meta.etag)
  c.header('Content-Type', meta.contentType)
  c.header('Content-Length', String(meta.size))
  c.header('Last-Modified', new Date(meta.lastModified).toUTCString())
}
