# Changesets

This repository uses Changesets to prepare package versions and generate `CHANGELOG.md` files.

Create a changeset after a user-facing package change:

```bash
pnpm changeset
```

Apply pending changesets into package versions and changelogs:

```bash
pnpm version
```

Publish packages after versioning:

```bash
pnpm release
```
