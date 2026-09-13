# Local Changes

Upstream repository: <https://github.com/jvm/pi-mono> (`packages/pi-skillful`,
branch `main`). This fork is hosted on GitHub at
`git@github.com:elrond298/pi-skillful.git`. See [FORK.md](FORK.md) for the full
fork and sync procedure.

## Change log

| Date | Change | Commit |
| ---- | ------ | ------ |
| 2026-09-12 | Backport `/skillful` menu improvements from pi-mono: configurable `descriptionKey`, keybindings-aware menu input, scrollable full-description view, RPC capability warning | `f39d495` |
| 2026-09-12 | Inline skill expansion procedure: drop `<skill>` blocks left by a previous expansion, resolve every `/skill:name` marker anywhere in the prompt, then prepend each one as a canonical `<skill name=... location=...>` block and submit the prompt exactly as typed — Pi renders each block as a collapsible `[skill] name` entry, and a forked resubmit expands once instead of duplicating | `422ead1` |
| 2026-08-22 | Support `/skillful` in interactive remote clients such as Pi Web | `2f700b6` |
| 2026-08-13 | FORK.md: add push command to mirror section | `e113739` |
| 2026-08-13 | Refine sync docs: filtered history shares ancestry with upstream | `2f729cf` |
| 2026-08-13 | Document upstream pi-mono and add sync-upstream helper | `2cca141` |
| 2026-08-13 | Document fork base and local modifications | `62800dc` |
| 2026-08-13 | Add $ skill autocomplete popup | `379de81` |
