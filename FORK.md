# FORK

This is a fork of `pi-skillful` from the upstream monorepo
<https://github.com/jvm/pi-mono>, maintained as a jj (jujutsu) clone of the
monorepo with local changes stacked on a bookmark, and mirrored to GitHub as a
filtered single-package repository.

## Base

- Upstream repository: <https://github.com/jvm/pi-mono> (this package lives
  at `packages/pi-skillful` there)
- Upstream branch: `main`
- Upstream snapshot this fork is based on: `150ff8c4f9b3d7a185af21b7f362aa843a0a3a60`
  (`Release pi-codex-tools 0.2.3`, tag `pi-codex-tools@0.2.3`), tracked locally as `main@origin`
- Cloned: 2026-08-13

Upstream main is already ahead of the last published release used locally
before the fork (`pi-skillful@0.4.0`): install telemetry was extracted into
`@mocito/install-telemetry`.

## Version control layout

- Local repo is a jj clone of the whole monorepo, colocated with git;
  upstream state is immutable via `main@origin`.
- Sparse working copy: only `packages/pi-skillful/` (this directory) plus the
  monorepo-root `package.json`, `package-lock.json`, and `AGENTS.md` are
  materialized (`jj sparse list`). The local repo still tracks the full
  monorepo history; only the working tree is trimmed.
- All local changes are stacked on bookmark `skillful`; upstream history is
  never rewritten.
- Sync upstream locally:

  ```bash
  jj git fetch && jj rebase -s 'trunk()..@' -d trunk()
  ```

## GitHub mirror

The local changes are mirrored to `git@github.com:elrond298/pi-skillful.git`
The mirror contains only this package: the monorepo history is
rewritten with `git filter-repo --subdirectory-filter packages/pi-skillful
--prune-empty always --refs skillful`, so the package contents sit at the
repo root, commits that never touched the package are dropped, and all
commit hashes differ from the local repo.

Refresh the mirror after local work is committed (bookmark `skillful`):

```bash
cd ~/opt/pi-skillful
git clone -q --no-local --branch skillful . /tmp/pi-skillful-export && cd /tmp/pi-skillful-export
git filter-repo --subdirectory-filter packages/pi-skillful --prune-empty always --refs skillful
git remote add github git@github.com:elrond298/pi-skillful.git
git push github skillful:main
```

`git filter-repo` comes from `uv tool install git-filter-repo`.

Re-filtering is deterministic for unchanged upstream commits, so pushes
fast-forward; add `--force` if local history was rewritten (squash/amend)
and the push is rejected.

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
- Validation (from the monorepo root): `npm run -w packages/pi-skillful check`,
  `npm test -w packages/pi-skillful`,
  `npm run -w packages/pi-skillful pack:dry-run`.
