export type { DiskStorage } from '@/storage/disk'
export type { MemoryStorage } from '@/storage/memory'

export interface ObjectMeta {
  contentType: string
  etag: string
  size: number
  lastModified: string
}

export type ListResult = {
  objects: Array<{ key: string; meta: ObjectMeta }>
  truncated: boolean
  nextContinuationToken?: string
}

export interface Storage {
  bucketExists(bucket: string): boolean
  createBucket(bucket: string): void
  putObject(bucket: string, key: string, data: Buffer, contentType: string): ObjectMeta
  getObject(bucket: string, key: string): { data: Buffer; meta: ObjectMeta } | null
  getMeta(bucket: string, key: string): ObjectMeta | null
  deleteObject(bucket: string, key: string): void
  listObjects(bucket: string, prefix?: string, maxKeys?: number, continuationToken?: string): ListResult
}
