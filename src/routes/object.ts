import { S3ErrorCode } from '@/lib/errors'
import { errorResponse, setObjectHeaders } from '@/lib/response'
import { createRouter } from '@/router'

function extractKey(url: string, bucket: string): string {
  const pathname = new URL(url).pathname
  return decodeURIComponent(pathname.slice(`/${bucket}/`.length)).replace(
    /\/$/,
    '',
  )
}

export const objectRouter = createRouter()

objectRouter.put('/:bucket/*', async (c, next) => {
  const bucket = c.req.param('bucket')
  const key = extractKey(c.req.url, bucket)
  const storage = c.get('storage')

  // empty key means trailing-slash bucket request — let bucket router handle it
  if (!key) return next()

  if (!storage.bucketExists(bucket)) {
    return errorResponse(c, S3ErrorCode.NoSuchBucket, 404)
  }

  const data = Buffer.from(await c.req.arrayBuffer())
  const contentType = c.req.header('content-type') ?? 'application/octet-stream'
  const meta = storage.putObject(bucket, key, data, contentType)

  return c.body(null, 200, { ETag: meta.etag })
})

objectRouter.get('/:bucket/*', async (c) => {
  const bucket = c.req.param('bucket')
  const key = extractKey(c.req.url, bucket)
  const storage = c.get('storage')

  if (!storage.bucketExists(bucket)) {
    return errorResponse(c, S3ErrorCode.NoSuchBucket, 404)
  }

  const result = storage.getObject(bucket, key)
  if (!result) {
    return errorResponse(c, S3ErrorCode.NoSuchKey, 404)
  }

  setObjectHeaders(c, result.meta)
  return c.body(new Uint8Array(result.data))
})

objectRouter.delete('/:bucket/*', async (c) => {
  const bucket = c.req.param('bucket')
  const key = extractKey(c.req.url, bucket)
  const storage = c.get('storage')

  // S3 deletes are idempotent — always 204 regardless of existence
  storage.deleteObject(bucket, key)
  return c.body(null, 204)
})
