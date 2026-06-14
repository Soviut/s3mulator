import { createHash } from 'crypto'
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from 'fs'
import { dirname, join } from 'path'

export interface ObjectMeta {
  contentType: string
  etag: string
  size: number
  lastModified: string
}

export class Storage {
  constructor(private readonly dataDir: string) {}

  bucketPath(bucket: string): string {
    return join(this.dataDir, bucket)
  }

  private objectPath(bucket: string, key: string): string {
    return join(this.dataDir, bucket, key)
  }

  private metaPath(bucket: string, key: string): string {
    return `${this.objectPath(bucket, key)}.meta.json`
  }

  bucketExists(bucket: string): boolean {
    const p = this.bucketPath(bucket)
    return existsSync(p) && statSync(p).isDirectory()
  }

  createBucket(bucket: string): void {
    mkdirSync(this.bucketPath(bucket), { recursive: true })
  }

  putObject(bucket: string, key: string, data: Buffer, contentType: string): ObjectMeta {
    const objectPath = this.objectPath(bucket, key)
    mkdirSync(dirname(objectPath), { recursive: true })
    writeFileSync(objectPath, data)
    const etag = `"${createHash('md5').update(data).digest('hex')}"`
    const meta: ObjectMeta = {
      contentType,
      etag,
      size: data.length,
      lastModified: new Date().toISOString(),
    }
    writeFileSync(this.metaPath(bucket, key), JSON.stringify(meta))
    return meta
  }

  getObject(bucket: string, key: string): { data: Buffer; meta: ObjectMeta } | null {
    const objectPath = this.objectPath(bucket, key)
    if (!existsSync(objectPath)) return null
    const meta = this.getMeta(bucket, key)
    if (!meta) return null
    return { data: readFileSync(objectPath), meta }
  }

  getMeta(bucket: string, key: string): ObjectMeta | null {
    const mp = this.metaPath(bucket, key)
    if (!existsSync(mp)) return null
    return JSON.parse(readFileSync(mp, 'utf-8')) as ObjectMeta
  }

  deleteObject(bucket: string, key: string): void {
    const objectPath = this.objectPath(bucket, key)
    const mp = this.metaPath(bucket, key)
    if (existsSync(objectPath)) unlinkSync(objectPath)
    if (existsSync(mp)) unlinkSync(mp)
  }

  listObjects(
    bucket: string,
    prefix = '',
    maxKeys = 1000,
    continuationToken?: string,
  ): { objects: Array<{ key: string; meta: ObjectMeta }>; truncated: boolean; nextContinuationToken?: string } {
    const bucketPath = this.bucketPath(bucket)
    const allKeys = this.walkDir(bucketPath, bucketPath)
      .filter((k) => !k.endsWith('.meta.json'))
      .filter((k) => k.startsWith(prefix))
      .sort()

    let startIdx = 0
    if (continuationToken) {
      const tokenIdx = allKeys.indexOf(continuationToken)
      startIdx = tokenIdx === -1 ? 0 : tokenIdx + 1
    }

    const slice = allKeys.slice(startIdx, startIdx + maxKeys)
    const truncated = startIdx + maxKeys < allKeys.length

    return {
      objects: slice.map((key) => ({ key, meta: this.getMeta(bucket, key)! })),
      truncated,
      nextContinuationToken: truncated ? slice[slice.length - 1] : undefined,
    }
  }

  private walkDir(dir: string, base: string): string[] {
    if (!existsSync(dir)) return []
    const results: string[] = []
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name)
      if (entry.isDirectory()) {
        results.push(...this.walkDir(full, base))
      } else {
        results.push(full.slice(base.length + 1))
      }
    }
    return results
  }
}
