# AGENTS.md

Guidelines for AI agents working in this repository.

## Project overview

- S3 emulator for local development, built with Hono and TypeScript
- Distributed as a CLI (`npx s3mulator`)
- Objects are stored as plain files on disk (default) or in memory (`--memory`)

## Key files

- `src/index.ts` — `createApp(config)` factory; wired up by `server.ts`
- `src/server.ts` — CLI entry point; parses flags and calls `createApp`
- `src/context.ts` — `AppEnv` type that carries typed variables (`storage`, `requestId`) through Hono context
- `src/router.ts` — thin wrapper that creates a `Hono<AppEnv>` instance
- `src/storage/index.ts` — `Storage` interface, `ObjectMeta`, and `ListResult` types
- `src/storage/disk.ts` — `DiskStorage` implementation; all disk I/O; no HTTP concerns
- `src/storage/memory.ts` — `MemoryStorage` implementation; backed by a `Map`, no disk I/O
- `src/lib/response.ts` — shared helpers for XML and error responses
- `src/lib/xml.ts` — S3 XML envelope builders
- `src/lib/testHelpers.ts` — `createTestApp()` and `createTestServer()` for use in specs
- `src/middleware/logger.ts` — request logger (method, path, status, duration, byte size)
- `src/middleware/presign.ts` — validates `X-Amz-Expires` on presigned requests; skips SigV4 verification
- `src/routes/` — one file per operation group: `bucket`, `object`, `list`, `batch-delete`

## Architecture

- Routes are registered in a specific order in `src/index.ts`: `list` and `batch-delete` before `bucket`, because all three share the `/:bucket` path and fall through via `next()` when their query params are absent
- Route handlers that call `next()` are typed as `MiddlewareHandler<AppEnv, '/:bucket'>` from Hono
- `AppEnv.Variables` provides typed `c.get('storage')` and `c.get('requestId')` throughout all handlers
- `Storage` is an interface — `DiskStorage` and `MemoryStorage` both implement it; `createApp` accepts either a path string or a `Storage` instance

## Build

- Source uses `@/` path aliases (e.g. `@/storage/disk`) which TypeScript resolves at compile time
- `tsc` compiles to `dist/`; `tsc-alias` rewrites `@/` aliases to relative paths in the output — both steps are required, run via `npm run build`
- `npm run build` cleans `dist/` before compiling (`rm -rf dist`)
- Spec files and `src/lib/testHelpers.ts` are excluded from the build output
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
- `createTestApp()` and `createTestServer()` use `MemoryStorage` — no temp directories or cleanup needed
- Always pass `logging: false` when constructing apps in tests to suppress stdout noise; `src/index.spec.ts` is the exception as it tests logging behaviour directly

## Configuration

- `--port`/`-p` — port to listen on (default: `5300`, env: `S3_PORT`)
- `--storage`/`-s` — directory to store objects (default: `./s3-data`, env: `S3_STORAGE`)
- `--memory`/`-m` — use in-memory storage, lost on restart (env: `S3_MEMORY=true`)
- `--quiet`/`-q` — suppress request logging
- `--storage` and `--memory` are mutually exclusive; the CLI errors and exits if both are passed
- `AppConfig.storage` accepts either a path string or a `Storage` instance

## Conventions

- Response helpers (`xmlResponse`, `errorResponse`) live in `src/lib/response.ts` — add new ones there
- XML builders live in `src/lib/xml.ts` — keep them as pure string functions with no HTTP coupling
- Storage methods are synchronous — keep it that way; async adds complexity with no benefit at local dev scale
- Do not add SigV4 signature verification — it is intentionally skipped to avoid requiring real credentials
- New storage backends implement the `Storage` interface in `src/storage/index.ts`
