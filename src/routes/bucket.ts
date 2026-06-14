import { S3ErrorCode } from '@/lib/errors'
import { errorResponse, xmlResponse } from '@/lib/response'
import { locationXml } from '@/lib/xml'
import { createRouter } from '@/router'

export const bucketRouter = createRouter()

const bucketHandler: Parameters<typeof bucketRouter.on>[2] = async (c, next) => {
  const method = c.req.method
  const bucket = c.req.param('bucket')
  const url = new URL(c.req.url)
  const storage = c.get('storage')

  if (method === 'GET') {
    if (!url.searchParams.has('location')) return next()
    // GetBucketLocation stub — always succeeds regardless of bucket existence
    return xmlResponse(c, locationXml())
  }

  if (method === 'HEAD') {
    if (!storage.bucketExists(bucket)) {
      return errorResponse(c, S3ErrorCode.NoSuchBucket, 404)
    }
    return c.body(null, 200)
  }

  if (method === 'PUT') {
    if (storage.bucketExists(bucket)) {
      return errorResponse(c, S3ErrorCode.BucketAlreadyExists, 409)
    }
    storage.createBucket(bucket)
    return c.body(null, 200)
  }

  return next()
}

bucketRouter.on(['GET', 'HEAD', 'PUT'], '/:bucket', bucketHandler)
bucketRouter.on(['GET', 'HEAD', 'PUT'], '/:bucket/', bucketHandler)
