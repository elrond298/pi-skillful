# FORK

This is a fork of `pi-skillful` from the upstream monorepo
<https://github.com/jvm/pi-mono>. This repo is a plain git clone of the
filtered single-package mirror hosted on GitHub (`origin`): the package
contents sit at the repo root, and the history was rewritten by
`git filter-repo --subdirectory-filter packages/pi-skillful --prune-empty
always`, so every commit hash differs from upstream's. Filtering is
deterministic, so this history still shares its filtered base with upstream:
syncs merge as a plain delta. Upstream is tracked via the `upstream` remote
(<https://github.com/jvm/pi-mono.git>, branch `main`).

## Base

- Upstream repository: <https://github.com/jvm/pi-mono> (this package lives
  at `packages/pi-skillful` there)
- Upstream branch: `main`
- Upstream snapshot this fork is based on: `150ff8c4f9b3d7a185af21b7f362aa843a0a3a60`
  (`Release pi-codex-tools 0.2.3`, tag `pi-codex-tools@0.2.3`), tracked as `refs/remotes/upstream/main`
- Cloned: 2026-08-13

Upstream main is already ahead of the last published release used locally
before the fork (`pi-skillful@0.4.0`): install telemetry was extracted into
`@mocito/install-telemetry`.

## Version control layout

- Single branch `main`, pushed to `origin` (GitHub mirror).
- Upstream state lives at `refs/remotes/upstream/main` (full monorepo, fetched
  read-only; never merged directly — wrong paths).
- Syncs land through local branch `upstream-pkg`: the filtered form of
  upstream's `packages/pi-skillful`, merged into `main`.

## Syncing upstream

Run the helper after upstream changes you want to pick up:

```bash
scripts/sync-upstream.sh
```

It fetches upstream, re-filters `packages/pi-skillful` into `upstream-pkg`
(same filter-repo recipe as the mirror; deterministic, so the filtered
commits are already ancestors of this history and the branch keeps growing
from the previous sync), and merges it into the current branch.
`--allow-unrelated-histories` is a fallback if the shared filtered base is
ever missing (e.g. a mirror made with different filter flags).

- Requires a clean working tree and `git-filter-repo`
  (`uv tool install git-filter-repo`).
- Files changed only upstream merge cleanly; files changed on both sides stop
  the merge for manual resolution, then commit.
- After the sync: `git push origin main`.

## GitHub mirror

The mirror at `git@github.com:elrond298/pi-skillful.git` was created
from the fork with `git filter-repo --subdirectory-filter packages/pi-skillful
--prune-empty always`, which is why the hashes differ from upstream's (the
rewrite is deterministic, so filtered upstream commits are still ancestors
of this history).
This repo is a clone of that mirror, so keeping it in sync is a plain push:

```bash
git push origin main
```

## Local modifications

### `wwlwrvqxoqzu` — Add $ skill autocomplete popup

`$` at a word boundary anywhere in the prompt opens a skill autocomplete
popup (pi's built-in slash popup only works at line start). `$` alone lists
all skills, typing filters, `$skill:name` is accepted. Choosing a suggestion
inserts `/skill:name`, which the existing inline skill invocation expands on
submit.

Files:

- `src/extensions/dollar-skill-autocomplete.ts` (new)
- `src/skills.ts` (shared `listSkillsByName()`)
- `src/extensions/inline-skill-invocation.ts` (uses shared util)
- `extensions/index.ts` (registration)
- `tests/dollar-skill-autocomplete.test.mjs` (new, 9 tests)
- `README.md`, `CHANGELOG.md` (docs)

## Local environment (outside this repo)

- The package directory is symlinked into the pi installation as
  `~/.pi/agent/npm/node_modules/pi-skillful`; the original 0.4.0 install is
  backed up next to it as `pi-skillful.upstream-0.4.0`. `pi package update`
  may replace the symlink — re-create it after updates.
- Validation (from this repo root): `npm run check`, `npm test`,
  `npm run pack:dry-run`.
