import { createMiddleware } from 'hono/factory'
import type { AppEnv } from '@/context'
import { S3ErrorCode } from '@/lib/errors'
import { errorResponse } from '@/lib/response'

export const presign = createMiddleware<AppEnv>(async (c, next) => {
  const signature = c.req.query('X-Amz-Signature')
  if (!signature) return next()

  const dateStr = c.req.query('X-Amz-Date')
  const expiresStr = c.req.query('X-Amz-Expires')
  if (!dateStr || !expiresStr) return next()

  // Parse YYYYMMDDTHHmmssZ format
  const issued = new Date(
    `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}T${dateStr.slice(9, 11)}:${dateStr.slice(11, 13)}:${dateStr.slice(13, 15)}Z`,
  )
  const expiry = new Date(issued.getTime() + parseInt(expiresStr, 10) * 1000)

  if (Date.now() > expiry.getTime()) {
    return errorResponse(c, S3ErrorCode.RequestExpired, 403)
  }

  return next()
})
