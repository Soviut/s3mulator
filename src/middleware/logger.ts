import type { MiddlewareHandler } from 'hono'
import type { AppEnv } from '@/context'

const RESET = '\x1b[0m'
const GREEN = '\x1b[32m'
const YELLOW = '\x1b[33m'
const RED = '\x1b[31m'
const DIM = '\x1b[2m'

function colorStatus(status: number): string {
  const s = String(status)
  if (status >= 500) return `${RED}${s}${RESET}`
  if (status >= 400) return `${RED}${s}${RESET}`
  if (status >= 300) return `${YELLOW}${s}${RESET}`
  return `${GREEN}${s}${RESET}`
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export const logger: MiddlewareHandler<AppEnv> = async (c, next) => {
  const start = Date.now()
  const { method } = c.req

  // Capture PUT request size before body is consumed
  let size: number | null = null
  if (method === 'PUT') {
    const cl = c.req.header('content-length')
    if (cl) size = Number(cl)
  }

  await next()

  // Capture GET response size after handler sets Content-Length
  if (method === 'GET') {
    const cl = c.res.headers.get('content-length')
    if (cl) size = Number(cl)
  }

  const { pathname, search } = new URL(c.req.url)
  const path = pathname + search
  const status = c.res.status
  const ms = Date.now() - start

  const sizeStr = size !== null ? `  ${formatBytes(size)}` : ''
  const line = `${method.padEnd(7)}${path}  ${colorStatus(status)}  ${DIM}${ms}ms${RESET}${sizeStr}`
  console.log(line)
}
