# AGENTS.md

Guidelines for AI agents working in this repository.

## Project overview

- S3 emulator for local development, built with Hono and TypeScript
- Distributed as a CLI (`npx s3mulator`)
- Objects are stored as plain files on disk; metadata is stored as `.meta.json` siblings

## Key files

- `src/index.ts` — `createApp(config)` factory; wired up by `server.ts`
- `src/server.ts` — CLI entry point; parses flags and calls `createApp`
- `src/context.ts` — `AppEnv` type that carries typed variables (`storage`, `requestId`) through Hono context
- `src/router.ts` — thin wrapper that creates a `Hono<AppEnv>` instance
- `src/lib/storage.ts` — all disk I/O; no HTTP concerns
- `src/lib/response.ts` — shared helpers for XML and error responses
- `src/lib/xml.ts` — S3 XML envelope builders
- `src/middleware/logger.ts` — request logger (method, path, status, duration, byte size)
- `src/middleware/presign.ts` — validates `X-Amz-Expires` on presigned requests; skips SigV4 verification
- `src/routes/` — one file per operation group: `bucket`, `object`, `list`, `batch-delete`

## Architecture

- Routes are registered in a specific order in `src/index.ts`: `list` and `batch-delete` before `bucket`, because all three share the `/:bucket` path and fall through via `next()` when their query params are absent
- Route handlers that call `next()` are typed as `MiddlewareHandler<AppEnv, '/:bucket'>` from Hono
- `AppEnv.Variables` provides typed `c.get('storage')` and `c.get('requestId')` throughout all handlers

## Build

- Source uses `@/` path aliases (e.g. `@/lib/storage`) which TypeScript resolves at compile time
- `tsc` compiles to `dist/`; `tsc-alias` rewrites `@/` aliases to relative paths in the output — both steps are required, run via `npm run build`
- Spec files are excluded from the build output
- `dist/server.js` has a `#!/usr/bin/env node` shebang and is the `bin` entry

## Development commands

- `npm run dev` — run the server with live reload via `tsx watch`
- `npm run build` — compile to `dist/`
- `npm test` — run all tests
- `npm run check` — type-check without emitting

## Testing

- Tests are written with Vitest and located alongside source files as `*.spec.ts`
- Unit tests use Hono's in-process `app.request()` — no server is started
- Integration tests in `src/aws-sdk.spec.ts` spin up a real server on a random port and use the AWS SDK against it
- `src/lib/testHelpers.ts` exports `createTestApp()` and `createTestServer()` for use in specs
- The `logging` option should be omitted in tests — it defaults to `true` but the logger writes to stdout which is fine; suppress it with `createApp({ logging: false })` if output is unwanted

## Configuration

- `--port`/`-p` — port to listen on (default: `5300`, env: `S3_PORT`)
- `--storage`/`-s` — directory to store objects (default: `./s3-data`, env: `S3_STORAGE`)
- `--quiet`/`-q` — suppress request logging
- Internally, `createApp` accepts `storage` and `logging` options used by `server.ts` and tests

## Conventions

- Response helpers (`xmlResponse`, `errorResponse`) live in `src/lib/response.ts` — add new ones there
- XML builders live in `src/lib/xml.ts` — keep them as pure string functions with no HTTP coupling
- Storage methods are synchronous (`readFileSync`, `writeFileSync`) — keep it that way; async adds complexity with no benefit at local dev scale
- Do not add SigV4 signature verification — it is intentionally skipped to avoid requiring real credentials
