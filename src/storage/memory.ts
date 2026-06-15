import { createHash } from 'crypto'
import type { ListResult, ObjectMeta, Storage } from '@/storage'

type ObjectEntry = { data: Buffer; meta: ObjectMeta }

export class MemoryStorage implements Storage {
  private readonly buckets = new Map<string, Map<string, ObjectEntry>>()

  bucketExists(bucket: string): boolean {
    return this.buckets.has(bucket)
  }

  createBucket(bucket: string): void {
    this.buckets.set(bucket, new Map())
  }

  putObject(bucket: string, key: string, data: Buffer, contentType: string): ObjectMeta {
    const etag = `"${createHash('md5').update(data).digest('hex')}"`
    const meta: ObjectMeta = {
      contentType,
      etag,
      size: data.length,
      lastModified: new Date().toISOString(),
    }
    this.buckets.get(bucket)!.set(key, { data, meta })
    return meta
  }

  getObject(bucket: string, key: string): { data: Buffer; meta: ObjectMeta } | null {
    return this.buckets.get(bucket)?.get(key) ?? null
  }

  getMeta(bucket: string, key: string): ObjectMeta | null {
    return this.buckets.get(bucket)?.get(key)?.meta ?? null
  }

  deleteObject(bucket: string, key: string): void {
    this.buckets.get(bucket)?.delete(key)
  }

  listObjects(bucket: string, prefix = '', maxKeys = 1000, continuationToken?: string): ListResult {
    const objects = this.buckets.get(bucket)
    if (!objects) return { objects: [], truncated: false }

    const allKeys = [...objects.keys()].filter((k) => k.startsWith(prefix)).sort()

    let startIdx = 0
    if (continuationToken) {
      const tokenIdx = allKeys.indexOf(continuationToken)
      startIdx = tokenIdx === -1 ? 0 : tokenIdx + 1
    }

    const slice = allKeys.slice(startIdx, startIdx + maxKeys)
    const truncated = startIdx + maxKeys < allKeys.length

    return {
      objects: slice.map((key) => ({ key, meta: objects.get(key)!.meta })),
      truncated,
      nextContinuationToken: truncated ? slice[slice.length - 1] : undefined,
    }
  }
}
