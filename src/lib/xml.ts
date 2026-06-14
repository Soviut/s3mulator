export interface ListParams {
  prefix?: string
  maxKeys?: number
  continuationToken?: string
}

export interface ListObject {
  key: string
  size: number
  etag: string
  lastModified: Date
}

export interface DeletedObject {
  key: string
}

export interface DeleteError {
  key: string
  code: string
  message: string
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export function errorXml(code: string, message: string, requestId = ''): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Error>
  <Code>${escapeXml(code)}</Code>
  <Message>${escapeXml(message)}</Message>
  <RequestId>${escapeXml(requestId)}</RequestId>
</Error>`
}

export function listResultXml(
  bucket: string,
  objects: ListObject[],
  params: ListParams,
  truncated: boolean,
  nextContinuationToken?: string,
): string {
  const contents = objects
    .map(
      (obj) => `  <Contents>
    <Key>${escapeXml(obj.key)}</Key>
    <Size>${obj.size}</Size>
    <ETag>${escapeXml(obj.etag)}</ETag>
    <LastModified>${obj.lastModified.toISOString()}</LastModified>
    <StorageClass>STANDARD</StorageClass>
  </Contents>`,
    )
    .join('\n')

  const nextToken = nextContinuationToken
    ? `  <NextContinuationToken>${escapeXml(nextContinuationToken)}</NextContinuationToken>\n`
    : ''

  return `<?xml version="1.0" encoding="UTF-8"?>
<ListBucketResult xmlns="http://s3.amazonaws.com/doc/2006-03-01/">
  <Name>${escapeXml(bucket)}</Name>
  <Prefix>${escapeXml(params.prefix ?? '')}</Prefix>
  <MaxKeys>${params.maxKeys ?? 1000}</MaxKeys>
  <KeyCount>${objects.length}</KeyCount>
  <IsTruncated>${truncated}</IsTruncated>
${nextToken}${contents}
</ListBucketResult>`
}

export function deleteResultXml(deleted: DeletedObject[], errors: DeleteError[]): string {
  const deletedXml = deleted
    .map(
      (d) => `  <Deleted>
    <Key>${escapeXml(d.key)}</Key>
  </Deleted>`,
    )
    .join('\n')

  const errorsXml = errors
    .map(
      (e) => `  <Error>
    <Key>${escapeXml(e.key)}</Key>
    <Code>${escapeXml(e.code)}</Code>
    <Message>${escapeXml(e.message)}</Message>
  </Error>`,
    )
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<DeleteResult xmlns="http://s3.amazonaws.com/doc/2006-03-01/">
${deletedXml}
${errorsXml}
</DeleteResult>`
}

export function locationXml(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<LocationConstraint xmlns="http://s3.amazonaws.com/doc/2006-03-01/"></LocationConstraint>`
}
