import { describe, expect, it } from 'vitest'
import { createTestApp } from '@/lib/testHelpers'

const deleteBody = (keys: string[]) => `<?xml version="1.0" encoding="UTF-8"?>
<Delete>
  ${keys.map((k) => `<Object><Key>${k}</Key></Object>`).join('\n  ')}
</Delete>`

describe('batch-delete routes', () => {
  const app = createTestApp()

  async function putBucket(name: string) {
    await app.request(`/${name}`, { method: 'PUT' })
  }

  async function putObject(bucket: string, key: string) {
    await app.request(`/${bucket}/${key}`, { method: 'PUT', body: 'data' })
  }

  it('POST /:bucket?delete removes multiple keys and returns deleted list', async () => {
    await putBucket('bd')
    await putObject('bd', 'a.txt')
    await putObject('bd', 'b.txt')
    const res = await app.request('/bd?delete', {
      method: 'POST',
      body: deleteBody(['a.txt', 'b.txt']),
    })
    expect(res.status).toBe(200)
    const body = await res.text()
    expect(body).toContain('<Key>a.txt</Key>')
    expect(body).toContain('<Key>b.txt</Key>')
    const getA = await app.request('/bd/a.txt')
    expect(getA.status).toBe(404)
  })

  it('POST /:bucket?delete with missing keys still reports them as deleted', async () => {
    await putBucket('bd2')
    const res = await app.request('/bd2?delete', {
      method: 'POST',
      body: deleteBody(['ghost.txt']),
    })
    expect(res.status).toBe(200)
    expect(await res.text()).toContain('<Key>ghost.txt</Key>')
  })
})
