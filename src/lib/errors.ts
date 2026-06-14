export const S3ErrorCode = {
  NoSuchKey: 'NoSuchKey',
  NoSuchBucket: 'NoSuchBucket',
  BucketAlreadyExists: 'BucketAlreadyExists',
  RequestExpired: 'RequestExpired',
  InternalError: 'InternalError',
} as const

export type S3ErrorCode = (typeof S3ErrorCode)[keyof typeof S3ErrorCode]
