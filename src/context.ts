import type { Storage } from '@/lib/storage'

export type AppEnv = {
  Bindings: {
    S3_PORT: string
    S3_STORAGE: string
  }
  Variables: {
    requestId: string
    storage: Storage
  }
}
