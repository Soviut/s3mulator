import { describe, expect, it } from 'vitest'
import { createTestApp } from '@/lib/testHelpers'

describe('list routes', () => {
  const app = createTestApp()

  async function putBucket(name: string) {
    await app.request(`/${name}`, { method: 'PUT' })
  }

  async function putObject(bucket: string, key: string) {
    await app.request(`/${bucket}/${key}`, { method: 'PUT', body: 'data' })
  }

  it('GET /:bucket?list-type=2 returns all keys as XML', async () => {
    await putBucket('lb')
    await putObject('lb', 'a.txt')
    await putObject('lb', 'b.txt')
    const res = await app.request('/lb?list-type=2')
    expect(res.status).toBe(200)
    const body = await res.text()
    expect(body).toContain('<Key>a.txt</Key>')
    expect(body).toContain('<Key>b.txt</Key>')
    expect(body).toContain('<KeyCount>2</KeyCount>')
  })

  it('GET /:bucket?list-type=2&prefix= returns only matching keys', async () => {
    await putBucket('lb2')
    await putObject('lb2', 'uploads/photo.jpg')
    await putObject('lb2', 'uploads/video.mp4')
    await putObject('lb2', 'docs/readme.txt')
    const res = await app.request('/lb2?list-type=2&prefix=uploads/')
    const body = await res.text()
    expect(body).toContain('uploads/photo.jpg')
    expect(body).toContain('uploads/video.mp4')
    expect(body).not.toContain('docs/readme.txt')
  })

  it('GET /:bucket?list-type=2&max-keys=1 truncates results', async () => {
    await putBucket('lb3')
    await putObject('lb3', 'a.txt')
    await putObject('lb3', 'b.txt')
    const res = await app.request('/lb3?list-type=2&max-keys=1')
    const body = await res.text()
    expect(body).toContain('<IsTruncated>true</IsTruncated>')
    expect(body).toContain('NextContinuationToken')
  })

  it('GET /:bucket?list-type=2&continuation-token= returns the next page', async () => {
    await putBucket('lb4')
    await putObject('lb4', 'a.txt')
    await putObject('lb4', 'b.txt')
    const first = await app.request('/lb4?list-type=2&max-keys=1')
    const firstBody = await first.text()
    const token = firstBody.match(
      /<NextContinuationToken>([^<]+)<\/NextContinuationToken>/,
    )?.[1]
    expect(token).toBeTruthy()
    const second = await app.request(
      `/lb4?list-type=2&continuation-token=${token}`,
    )
    const secondBody = await second.text()
    expect(secondBody).toContain('<Key>b.txt</Key>')
    expect(secondBody).toContain('<IsTruncated>false</IsTruncated>')
  })

  it('returns 404 for a missing bucket', async () => {
    const res = await app.request('/no-bucket?list-type=2')
    expect(res.status).toBe(404)
    expect(await res.text()).toContain('NoSuchBucket')
  })
})
