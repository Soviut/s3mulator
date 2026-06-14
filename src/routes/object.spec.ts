import { describe, expect, it } from 'vitest'
import { createTestApp } from '@/lib/testHelpers'

describe('object routes', () => {
  const app = createTestApp()

  async function putBucket(name: string) {
    await app.request(`/${name}`, { method: 'PUT' })
  }

  async function putObject(bucket: string, key: string, body = 'hello', contentType = 'text/plain') {
    return app.request(`/${bucket}/${key}`, {
      method: 'PUT',
      body,
      headers: { 'Content-Type': contentType },
    })
  }

  it('PUT /:bucket/:key writes a file and returns 200 with ETag', async () => {
    await putBucket('b')
    const res = await putObject('b', 'file.txt')
    expect(res.status).toBe(200)
    expect(res.headers.get('ETag')).toMatch(/^"[a-f0-9]{32}"$/)
  })

  it('PUT /:bucket/:key stores the content-type in the sidecar', async () => {
    await putBucket('b')
    await putObject('b', 'img.png', 'data', 'image/png')
    const head = await app.request('/b/img.png', { method: 'HEAD' })
    expect(head.headers.get('Content-Type')).toBe('image/png')
  })

  it('GET /:bucket/:key returns file content with correct headers', async () => {
    await putBucket('b')
    await putObject('b', 'hello.txt', 'world')
    const res = await app.request('/b/hello.txt')
    expect(res.status).toBe(200)
    expect(await res.text()).toBe('world')
    expect(res.headers.get('Content-Type')).toBe('text/plain')
    expect(res.headers.get('ETag')).toBeTruthy()
    expect(res.headers.get('Last-Modified')).toBeTruthy()
  })

  it('GET /:bucket/:key returns 404 for a missing key', async () => {
    await putBucket('b')
    const res = await app.request('/b/missing.txt')
    expect(res.status).toBe(404)
    expect(await res.text()).toContain('NoSuchKey')
  })

  it('HEAD /:bucket/:key returns headers with no body', async () => {
    await putBucket('b')
    await putObject('b', 'meta.txt', 'content')
    const res = await app.request('/b/meta.txt', { method: 'HEAD' })
    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Length')).toBe('7')
    expect(await res.text()).toBe('')
  })

  it('DELETE /:bucket/:key removes file and returns 204', async () => {
    await putBucket('b')
    await putObject('b', 'del.txt')
    const res = await app.request('/b/del.txt', { method: 'DELETE' })
    expect(res.status).toBe(204)
    const get = await app.request('/b/del.txt')
    expect(get.status).toBe(404)
  })

  it('DELETE /:bucket/:key returns 204 even when key does not exist', async () => {
    await putBucket('b')
    const res = await app.request('/b/ghost.txt', { method: 'DELETE' })
    expect(res.status).toBe(204)
  })

  it('supports nested key paths', async () => {
    await putBucket('b')
    await putObject('b', 'dir/sub/file.txt', 'nested')
    const res = await app.request('/b/dir/sub/file.txt')
    expect(res.status).toBe(200)
    expect(await res.text()).toBe('nested')
  })
})
