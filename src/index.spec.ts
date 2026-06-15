import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { createApp } from '@/index'
import { MemoryStorage } from '@/storage/memory'

beforeEach(() => {
  vi.spyOn(console, 'log').mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
})

it('logs requests by default', async () => {
  const app = createApp({ storage: new MemoryStorage() })
  await app.request('/nonexistent')
  expect(console.log).toHaveBeenCalled()
})

it('suppresses logging when logging is false', async () => {
  const app = createApp({ storage: new MemoryStorage(), logging: false })
  await app.request('/nonexistent')
  expect(console.log).not.toHaveBeenCalled()
})
