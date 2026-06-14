import type { Storage } from '@/lib/storage'

export type AppEnv = {
  Bindings: {
    S3_PORT: string
    S3_DATA_DIR: string
  }
  Variables: {
    requestId: string
    storage: Storage
  }
}
