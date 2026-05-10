# Release Workflow

Wire Grid uses Changesets for package versioning and changelog generation.

## Add A Changeset

After a user-facing package change:

```bash
pnpm changeset
```

Select the affected package and version bump. Changesets writes a markdown file into `.changeset/`.

## Version Packages

When preparing a release:

```bash
pnpm version
```

This updates package versions and package-level `CHANGELOG.md` files.

## Publish

After verifying the repository:

```bash
pnpm check
pnpm release
```

The release script builds packages before publishing.
