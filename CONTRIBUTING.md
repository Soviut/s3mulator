# Contributing

Contributions to s3mulator are welcome! Please open an issue or submit a pull request with any improvements or bug fixes.

Follow the existing code style and include tests for any new features or bug fixes. Run `npm test` to ensure all tests pass before submitting.

## Dev Server

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Tests

Runs unit and integration tests with ViTest.

```bash
npm test
```

## Formatting

Linting with ESLint

```bash
npm run lint
```

Formatting with Prettier

```bash
npm run format
```

## Publishing

Releases are published to npm automatically via GitHub Actions when a version tag is pushed using Trusted Publishers.

Versions should be bumped according to semver, `patch` for bug fixes, `minor` for new features, and `major` for breaking changes.

To publish a new version:

1. Bump the version `npm version patch` (or `minor` / `major`)
2. Push the commit and tag `git push && git push --tags`

The `v*.*.*` tag triggers the publish workflow, which runs `prepublishOnly` (build + tests) before publishing. Provenance attestation is attached automatically via npm Trusted Publishers, so no `NPM_TOKEN` is required.
