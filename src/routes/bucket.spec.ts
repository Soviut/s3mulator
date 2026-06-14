import { describe, expect, it } from 'vitest'
import { createTestApp } from '@/lib/testHelpers'

describe('bucket routes', () => {
  const app = createTestApp()

  it('PUT /:bucket creates a bucket and returns 200', async () => {
    const res = await app.request('/my-bucket', { method: 'PUT' })
    expect(res.status).toBe(200)
  })

  it('PUT /:bucket returns 409 when bucket already exists', async () => {
    await app.request('/existing-bucket', { method: 'PUT' })
    const res = await app.request('/existing-bucket', { method: 'PUT' })
    expect(res.status).toBe(409)
    expect(await res.text()).toContain('BucketAlreadyExists')
  })

  it('HEAD /:bucket returns 200 for an existing bucket', async () => {
    await app.request('/head-bucket', { method: 'PUT' })
    const res = await app.request('/head-bucket', { method: 'HEAD' })
    expect(res.status).toBe(200)
  })

  it('HEAD /:bucket returns 404 for a missing bucket', async () => {
    const res = await app.request('/missing-bucket', { method: 'HEAD' })
    expect(res.status).toBe(404)
  })

  it('GET /:bucket?location returns location stub XML', async () => {
    await app.request('/loc-bucket', { method: 'PUT' })
    const res = await app.request('/loc-bucket?location')
    expect(res.status).toBe(200)
    expect(await res.text()).toContain('LocationConstraint')
  })
})
