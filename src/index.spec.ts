import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { createApp } from '@/index'

beforeEach(() => {
  vi.spyOn(console, 'log').mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
})

it('logs requests by default', async () => {
  const app = createApp()
  await app.request('/nonexistent')
  expect(console.log).toHaveBeenCalled()
})

it('suppresses logging when logging is false', async () => {
  const app = createApp({ logging: false })
  await app.request('/nonexistent')
  expect(console.log).not.toHaveBeenCalled()
})
