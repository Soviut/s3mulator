import type { MiddlewareHandler } from 'hono'
import type { AppEnv } from '@/context'
import { S3ErrorCode } from '@/lib/errors'
import { errorResponse, xmlResponse } from '@/lib/response'
import { listResultXml } from '@/lib/xml'
import { createRouter } from '@/router'

export const listRouter = createRouter()

const listHandler: MiddlewareHandler<AppEnv, '/:bucket'> = async (c, next) => {
  if (c.req.query('list-type') !== '2') return next()

  const bucket = c.req.param('bucket')
  const storage = c.get('storage')

  if (!storage.bucketExists(bucket)) {
    return errorResponse(c, S3ErrorCode.NoSuchBucket, 404)
  }

  const prefix = c.req.query('prefix') ?? ''
  const maxKeys = Number(c.req.query('max-keys') ?? '1000')
  const continuationToken = c.req.query('continuation-token')

  const { objects, truncated, nextContinuationToken } = storage.listObjects(
    bucket,
    prefix,
    maxKeys,
    continuationToken,
  )

  const listObjects = objects.map(({ key, meta }) => ({
    key,
    size: meta.size,
    etag: meta.etag,
    lastModified: new Date(meta.lastModified),
  }))

  const xml = listResultXml(
    bucket,
    listObjects,
    { prefix, maxKeys, continuationToken },
    truncated,
    nextContinuationToken,
  )

  return xmlResponse(c, xml)
}

listRouter.get('/:bucket', listHandler)
listRouter.get('/:bucket/', listHandler)
