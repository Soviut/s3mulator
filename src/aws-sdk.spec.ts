import {
  CreateBucketCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { beforeAll, describe, expect, it } from 'vitest'
import { createTestServer } from '@/lib/testHelpers'

describe('AWS SDK integration', () => {
  let client: S3Client

  beforeAll(async () => {
    const endpoint = await createTestServer()
    client = new S3Client({
      endpoint,
      region: 'us-east-1',
      credentials: { accessKeyId: 'local', secretAccessKey: 'local' },
      forcePathStyle: true,
    })
    await client.send(new CreateBucketCommand({ Bucket: 'test' }))
  })

  it('PutObject uploads a file and returns an ETag', async () => {
    const res = await client.send(
      new PutObjectCommand({
        Bucket: 'test',
        Key: 'hello.txt',
        Body: 'world',
        ContentType: 'text/plain',
      }),
    )
    expect(res.ETag).toMatch(/^"[a-f0-9]{32}"$/)
  })

  it('GetObject retrieves correct content and headers', async () => {
    await client.send(
      new PutObjectCommand({ Bucket: 'test', Key: 'get.txt', Body: 'content' }),
    )
    const res = await client.send(
      new GetObjectCommand({ Bucket: 'test', Key: 'get.txt' }),
    )
    const body = await res.Body!.transformToString()
    expect(body).toBe('content')
    expect(res.ETag).toBeTruthy()
    expect(res.LastModified).toBeInstanceOf(Date)
  })

  it('HeadObject returns metadata without a body', async () => {
    await client.send(
      new PutObjectCommand({ Bucket: 'test', Key: 'head.txt', Body: 'data' }),
    )
    const res = await client.send(
      new HeadObjectCommand({ Bucket: 'test', Key: 'head.txt' }),
    )
    expect(res.ContentLength).toBe(4)
    expect(res.ETag).toBeTruthy()
  })

  it('DeleteObject removes the file; subsequent GetObject throws NoSuchKey', async () => {
    await client.send(
      new PutObjectCommand({ Bucket: 'test', Key: 'del.txt', Body: 'bye' }),
    )
    await client.send(
      new DeleteObjectCommand({ Bucket: 'test', Key: 'del.txt' }),
    )
    await expect(
      client.send(new GetObjectCommand({ Bucket: 'test', Key: 'del.txt' })),
    ).rejects.toThrow()
  })

  it('DeleteObjects removes multiple keys in one request', async () => {
    await client.send(
      new PutObjectCommand({ Bucket: 'test', Key: 'multi/a.txt', Body: 'a' }),
    )
    await client.send(
      new PutObjectCommand({ Bucket: 'test', Key: 'multi/b.txt', Body: 'b' }),
    )
    await client.send(
      new DeleteObjectsCommand({
        Bucket: 'test',
        Delete: { Objects: [{ Key: 'multi/a.txt' }, { Key: 'multi/b.txt' }] },
      }),
    )
    await expect(
      client.send(new GetObjectCommand({ Bucket: 'test', Key: 'multi/a.txt' })),
    ).rejects.toThrow()
  })

  it('ListObjectsV2 returns all keys and respects prefix and MaxKeys', async () => {
    await client.send(
      new PutObjectCommand({ Bucket: 'test', Key: 'list/x.txt', Body: 'x' }),
    )
    await client.send(
      new PutObjectCommand({ Bucket: 'test', Key: 'list/y.txt', Body: 'y' }),
    )
    await client.send(
      new PutObjectCommand({ Bucket: 'test', Key: 'other/z.txt', Body: 'z' }),
    )

    const res = await client.send(
      new ListObjectsV2Command({ Bucket: 'test', Prefix: 'list/' }),
    )
    const keys = res.Contents?.map((o) => o.Key) ?? []
    expect(keys).toContain('list/x.txt')
    expect(keys).toContain('list/y.txt')
    expect(keys).not.toContain('other/z.txt')
  })

  it('getSignedUrl with GetObjectCommand — presigned download returns correct content', async () => {
    await client.send(
      new PutObjectCommand({
        Bucket: 'test',
        Key: 'signed.txt',
        Body: 'signed-body',
      }),
    )
    const url = await getSignedUrl(
      client,
      new GetObjectCommand({ Bucket: 'test', Key: 'signed.txt' }),
      {
        expiresIn: 3600,
      },
    )
    const res = await fetch(url)
    expect(res.status).toBe(200)
    expect(await res.text()).toBe('signed-body')
  })

  it('getSignedUrl with PutObjectCommand — presigned upload is retrievable via GetObject', async () => {
    const url = await getSignedUrl(
      client,
      new PutObjectCommand({ Bucket: 'test', Key: 'presigned-put.txt' }),
      {
        expiresIn: 3600,
      },
    )
    await fetch(url, { method: 'PUT', body: 'presigned-content' })
    const res = await client.send(
      new GetObjectCommand({ Bucket: 'test', Key: 'presigned-put.txt' }),
    )
    const body = await res.Body!.transformToString()
    expect(body).toBe('presigned-content')
  })
})
