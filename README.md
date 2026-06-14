# S3mulator

> Pronounced "sem-yoo-lator"

A CLI S3 emulator for local development.

Supports common bucket and object operations, presigned URLs, and basic error handling.

## Installation

```bash
npm install s3mulator --save-dev
```

Then add a script to your `package.json`:

```json
{
  "scripts": {
    "s3": "s3mulator",
    "dev": "npm run s3 & npm run start"
  }
}
```

You can also run it directly:

```bash
npx s3mulator
```

## Configuration

CLI flags take precedence over environment variables.

### Flags

| Flag                   | Default     | Description                |
| ---------------------- | ----------- | -------------------------- |
| `-p, --port <port>`    | `5300`      | Port to listen on          |
| `-s, --storage <path>` | `./s3-data` | Directory to store objects |
| `-q, --quiet`          |             | Suppress request logging   |
| `-h, --help`           |             | Show help and exit         |

### Environment variables

| Variable     | Default     | Description                |
| ------------ | ----------- | -------------------------- |
| `S3_PORT`    | `5300`      | Port to listen on          |
| `S3_STORAGE` | `./s3-data` | Directory to store objects |

## Usage

### Client configuration

```ts
import { S3Client } from '@aws-sdk/client-s3'

const s3 = new S3Client({
  endpoint: 'http://localhost:5300',
  region: 'us-east-1',
  credentials: { accessKeyId: 'local', secretAccessKey: 'local' },
  forcePathStyle: true, // required — avoids bucket.localhost subdomain routing
})
```

### Bucket operations

| Command               | Description                          |
| --------------------- | ------------------------------------ |
| `CreateBucketCommand` | Creates a bucket (directory on disk) |
| `HeadBucketCommand`   | Checks whether a bucket exists       |

### Object operations

| Command                | Description                                                         |
| ---------------------- | ------------------------------------------------------------------- |
| `PutObjectCommand`     | Uploads an object                                                   |
| `GetObjectCommand`     | Downloads an object                                                 |
| `HeadObjectCommand`    | Returns object metadata without a body                              |
| `DeleteObjectCommand`  | Deletes an object (idempotent — 204 even if the key does not exist) |
| `DeleteObjectsCommand` | Deletes multiple objects in one request                             |
| `ListObjectsV2Command` | Lists objects in a bucket; supports `Prefix` and `MaxKeys`          |

### Presigned URLs

Generate a URL with the AWS SDK, then use it with any HTTP client.

```ts
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'

// Generate a presigned download URL
const downloadUrl = await getSignedUrl(
  s3,
  new GetObjectCommand({ Bucket: 'my-bucket', Key: 'photo.jpg' }),
  { expiresIn: 3600 },
)

// Fetch the object without credentials
const res = await fetch(downloadUrl)
const blob = await res.blob()

// Generate a presigned upload URL
const uploadUrl = await getSignedUrl(
  s3,
  new PutObjectCommand({ Bucket: 'my-bucket', Key: 'photo.jpg' }),
  { expiresIn: 3600 },
)

// Upload without credentials
await fetch(uploadUrl, {
  method: 'PUT',
  body: file,
  headers: { 'Content-Type': 'image/jpeg' },
})
```

Presigned URLs are validated for expiry (`X-Amz-Expires`). Expired requests return `403 RequestExpired`.

SigV4 signature verification is intentionally skipped.

### Not Implemented

- Multipart uploads (`CreateMultipartUpload`, `UploadPart`, `CompleteMultipartUpload`)
- Object versioning
- Bucket lifecycle rules
- Object tagging
- S3 CORS configuration API (`PutBucketCors`, `GetBucketCors`)

## Tests

```bash
npm test
```

Unit tests use Hono's in-process `app.request()`. Integration tests run a real server on a random port and exercise the full AWS SDK against it.
