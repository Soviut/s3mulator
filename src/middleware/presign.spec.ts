import { describe, expect, it } from 'vitest'
import { createTestApp } from '@/lib/testHelpers'

function makePresignedQuery(expiresIn: number, offsetMs = 0) {
  const now = new Date(Date.now() + offsetMs)
  const date = now
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d+Z$/, 'Z')
  return `X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Date=${date}&X-Amz-Expires=${expiresIn}&X-Amz-Signature=fakesig&X-Amz-Credential=local`
}

describe('presign middleware', () => {
  const app = createTestApp()

  it('valid presigned GET returns file content', async () => {
    await app.request('/ps-bucket', { method: 'PUT' })
    await app.request('/ps-bucket/file.txt', { method: 'PUT', body: 'hello' })
    const res = await app.request(
      `/ps-bucket/file.txt?${makePresignedQuery(3600)}`,
    )
    expect(res.status).toBe(200)
    expect(await res.text()).toBe('hello')
  })

  it('valid presigned PUT writes a file', async () => {
    await app.request('/ps-bucket2', { method: 'PUT' })
    const res = await app.request(
      `/ps-bucket2/upload.txt?${makePresignedQuery(3600)}`,
      {
        method: 'PUT',
        body: 'uploaded',
      },
    )
    expect(res.status).toBe(200)
    const get = await app.request('/ps-bucket2/upload.txt')
    expect(await get.text()).toBe('uploaded')
  })

  it('expired presigned request returns 403 RequestExpired', async () => {
    // offset -7200s so the issued time is 2 hours ago, expires=3600 → already expired
    const res = await app.request(
      `/ps-bucket/file.txt?${makePresignedQuery(3600, -7200 * 1000)}`,
    )
    expect(res.status).toBe(403)
    expect(await res.text()).toContain('RequestExpired')
  })

  it('request without X-Amz-Signature passes through normally', async () => {
    await app.request('/ps-bucket3', { method: 'PUT' })
    await app.request('/ps-bucket3/file.txt', { method: 'PUT', body: 'plain' })
    const res = await app.request('/ps-bucket3/file.txt')
    expect(res.status).toBe(200)
  })
})
