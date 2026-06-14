import { S3ErrorCode } from '@/lib/errors'
import { errorResponse, xmlResponse } from '@/lib/response'
import { deleteResultXml } from '@/lib/xml'
import { createRouter } from '@/router'

export const batchDeleteRouter = createRouter()

const batchDeleteHandler: Parameters<typeof batchDeleteRouter.post>[1] = async (c, next) => {
  const url = new URL(c.req.url)
  if (!url.searchParams.has('delete')) return next()

  const bucket = c.req.param('bucket')
  const storage = c.get('storage')

  if (!storage.bucketExists(bucket)) {
    return errorResponse(c, S3ErrorCode.NoSuchBucket, 404)
  }

  const body = await c.req.text()
  const keys = [...body.matchAll(/<Key>([^<]+)<\/Key>/g)].map((m) => m[1])

  const deleted: { key: string }[] = []
  for (const key of keys) {
    storage.deleteObject(bucket, key)
    deleted.push({ key })
  }

  return xmlResponse(c, deleteResultXml(deleted, []))
}

batchDeleteRouter.post('/:bucket', batchDeleteHandler)
batchDeleteRouter.post('/:bucket/', batchDeleteHandler)
