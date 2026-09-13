#!/usr/bin/env bash
# Sync upstream pi-mono's packages/pi-skillful into this fork.
#
# This repo is a filtered single-package fork: single-package history
# with files at the root, so `git merge upstream/main` cannot work directly.
#
# How this works:
#   1. Fetch upstream (full monorepo) as refs/remotes/upstream/main.
#   2. In a throwaway clone, re-filter upstream main with the same
#      filter-repo recipe used to create this fork. Filtering is
#      deterministic, so the filtered commits match our history
#      (they are already ancestors of ours) and the branch keeps growing
#      from the previous sync instead of restarting.
#   3. Fetch the filtered result back as local branch `upstream-pkg`.
#   4. Merge it. --allow-unrelated-histories is only a fallback if the
#      shared filtered base is ever missing (e.g. a filtered copy with other
#      filter flags).
#
# Conflicts (files changed both locally and upstream) stop the merge; resolve
# them and commit. Push with `git push origin main` afterwards.
set -euo pipefail
cd "$(dirname "$0")/.."

if ! git remote get-url upstream >/dev/null 2>&1; then
  echo "error: no 'upstream' remote. Add it with:" >&2
  echo "  git remote add upstream https://github.com/jvm/pi-mono.git" >&2
  exit 1
fi

command -v git-filter-repo >/dev/null 2>&1 || {
  echo "error: git-filter-repo not installed (uv tool install git-filter-repo)" >&2
  exit 1
}

if [ -n "$(git status --porcelain)" ]; then
  echo "error: working tree not clean; commit or stash changes first" >&2
  exit 1
fi

echo "== fetching upstream =="
git fetch upstream

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

echo "== filtering upstream main down to packages/pi-skillful =="
git clone -q --no-checkout "$(pwd)" "$tmp/repo"
git -C "$tmp/repo" update-ref refs/remotes/upstream/main "$(git rev-parse upstream/main)"
git -C "$tmp/repo" filter-repo --force \
  --refs refs/remotes/upstream/main \
  --subdirectory-filter packages/pi-skillful \
  --prune-empty always

echo "== updating local branch upstream-pkg =="
git fetch -q "$tmp/repo" refs/remotes/upstream/main:refs/heads/upstream-pkg

if git merge-base HEAD refs/heads/upstream-pkg >/dev/null 2>&1; then
  git merge --no-edit -m "Sync upstream pi-mono (packages/pi-skillful)" refs/heads/upstream-pkg
else
  echo "== no shared filtered base; merging as unrelated histories =="
  git merge --no-edit --allow-unrelated-histories \
    -m "Sync upstream pi-mono (packages/pi-skillful)" refs/heads/upstream-pkg
fi

echo
echo "Done. Push the result with: git push origin main"
