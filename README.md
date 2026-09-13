# pi-skillful

Make [Pi](https://pi.dev) skills easier to invoke, curate, and control without editing their source files.

This is a fork of [`pi-skillful`](https://github.com/jvm/pi-mono/tree/main/packages/pi-skillful) from the [pi-mono](https://github.com/jvm/pi-mono) monorepo. Every upstream feature works here unchanged; the interaction changes listed below live here first.

> [!WARNING]
> Pi packages can execute arbitrary code through extensions. Review package source before installing any third-party Pi package.

## What this fork adds

Upstream provides progressive skill loading, inline `/skill:name` invocation, skill prompt visibility, and session skill toggles; those work here unchanged and are documented in the [upstream README](https://github.com/jvm/pi-mono/tree/main/packages/pi-skillful#readme). What this fork changes:

### `$` skill autocomplete

Type `$` at a word boundary anywhere in the prompt, not only at the start, to open a fuzzy-matched skill popup. `$` alone lists every skill, typing filters the list, and `$skill:name` is accepted too. Choosing a suggestion inserts `/skill:name`, which inline invocation expands on submit. Tokens that match no skill, like `$HOME`, never open the popup.

### Inline invocation renders like the built-in command

Your prompt is submitted exactly as typed, and each invoked skill is prepended as a canonical `<skill>` block. Pi then renders a collapsible `[skill] name (ctrl+o to expand)` entry per skill with your text underneath — the same display as Pi's built-in `/skill:name`. Resubmitting a forked prompt replaces the blocks from the previous expansion instead of stacking a second copy.

### Skill menu: stable, scrollable descriptions

Description previews stay at two lines, so moving through the list no longer resizes the menu. `descriptionKey` (`space` by default) opens the complete description in a bounded, scrollable view. The menu follows Pi's configured actions instead of hard-coded keys: the Confirm action (`Enter` by default) toggles the selected skill, including while filtering, and `1` through `9` assign or clear a session toggle slot.

### Pi Web and other RPC clients

The menu works in Pi's terminal interface and through the RPC custom-component bridge used by Pi Web and compatible clients. The active Global/Project scope stays readable with a plain theme, and a client that cannot render custom components gets a warning instead of failing silently.

## Install

From GitHub:

```bash
pi install git:github.com/elrond298/pi-skillful
```

From a local checkout:

```bash
pi install /path/to/pi-skillful     # user settings
pi install -l /path/to/pi-skillful  # project settings
pi -e /path/to/pi-skillful          # one-off test run, no install
```

## Usage

1. Start Pi in a project with this package installed.
2. Run `/skillful` to choose which skills the model sees automatically, and to assign toggle slots.
3. Invoke skills inline: `/skill:name` anywhere in a prompt, or type `$` to search for one and insert it.

```text
Use /skill:code-security and /skill:semgrep to review this change.
```

Settings live under the `skillful` key — globally in `~/.pi/agent/settings.json`, per project in `.pi/settings.json` (project settings apply only while Pi trusts the project):

```json
{
  "skillful": {
    "hiddenSkills": ["pdf", "xlsx"],
    "descriptionKey": "space"
  }
}
```

`descriptionKey` accepts Pi key identifiers such as `"ctrl+o"`; invalid or empty values fall back to `"space"`, a configured project value overrides the global one, and a conflict with an existing menu action leaves that action in charge. In Pi Web, prefer printable keys or simple combinations — function keys and multi-modifier chords may not survive its input bridge.

The remaining features, settings, and menu keys are inherited from upstream and documented in the [upstream README](https://github.com/jvm/pi-mono/tree/main/packages/pi-skillful#readme).

## Development

This package is source-distributed: Pi loads the TypeScript extensions directly. Node.js >= 20.6.0 required.

```bash
npm install
npm run check        # tsc --noEmit
npm test             # compile to .test-dist, then node --test
npm run pack:dry-run
```

This checkout is normally symlinked into the Pi installation as `~/.pi/agent/npm/node_modules/pi-skillful`. `pi package update` may replace that symlink — re-create it after updates.

## Upstream

Forked from upstream `packages/pi-skillful` at `150ff8c` (2026-08-11). Upstream `main` is tracked as the `upstream` remote and merged with `scripts/sync-upstream.sh`, which re-filters `packages/pi-skillful` into this single-package layout. Because the history is a filtered rewrite, commit hashes differ from upstream's; the shared filtered base still lets each sync merge as a plain delta.

## Contributing

Contributions are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md).

## Security

Please report security issues privately. See [SECURITY.md](SECURITY.md).

## License

MIT. See [LICENSE](LICENSE).
