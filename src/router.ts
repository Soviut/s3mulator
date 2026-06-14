import { Hono } from 'hono'
import type { AppEnv } from '@/context'

export const createRouter = () => new Hono<AppEnv>()
