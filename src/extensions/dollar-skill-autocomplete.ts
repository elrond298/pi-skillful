import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import {
  fuzzyFilter,
  type AutocompleteItem,
  type AutocompleteProvider,
  type AutocompleteSuggestions,
} from "@earendil-works/pi-tui";
import { listSkillsByName } from "../skills.js";

const DOLLAR_TOKEN_PATTERN = /(^|[\s])(\$[^\s]*)$/;

/**
 * Autocomplete popup for skills triggered by `$` anywhere in the input
 * (the built-in slash-command popup only works at line start).
 * Accepting a suggestion inserts `/skill:name`, which the inline
 * invocation extension expands on submit.
 */
export default function dollarSkillAutocomplete(pi: ExtensionAPI) {
  pi.on("session_start", (event, ctx) => {
    if (ctx.mode !== "tui") return;
    ctx.ui.addAutocompleteProvider((current) => new DollarSkillAutocompleteProvider(current, pi));
  });
}

class DollarSkillAutocompleteProvider implements AutocompleteProvider {
  readonly triggerCharacters = ["$"];

  constructor(
    private readonly inner: AutocompleteProvider,
    private readonly pi: ExtensionAPI,
  ) {}

  async getSuggestions(
    lines: string[],
    cursorLine: number,
    cursorCol: number,
    options: { signal: AbortSignal; force?: boolean },
  ): Promise<AutocompleteSuggestions | null> {
    const textBeforeCursor = (lines[cursorLine] ?? "").slice(0, cursorCol);
    const match = DOLLAR_TOKEN_PATTERN.exec(textBeforeCursor);
    if (!match) return this.inner.getSuggestions(lines, cursorLine, cursorCol, options);

    const query = match[2].slice(1).replace(/^skill:/, "");
    const filtered = fuzzyFilter(this.skillItems(), query, (item) => item.value);
    if (filtered.length === 0) return null;
    return { items: filtered, prefix: match[2] };
  }

  applyCompletion(
    lines: string[],
    cursorLine: number,
    cursorCol: number,
    item: AutocompleteItem,
    prefix: string,
  ): { lines: string[]; cursorLine: number; cursorCol: number } {
    if (!prefix.startsWith("$")) {
      return this.inner.applyCompletion(lines, cursorLine, cursorCol, item, prefix);
    }
    const currentLine = lines[cursorLine] ?? "";
    const replacement = `/skill:${item.value} `;
    const nextLines = [...lines];
    nextLines[cursorLine] = `${currentLine.slice(0, cursorCol - prefix.length)}${replacement}${currentLine.slice(cursorCol)}`;
    return { lines: nextLines, cursorLine, cursorCol: cursorCol - prefix.length + replacement.length };
  }

  shouldTriggerFileCompletion(lines: string[], cursorLine: number, cursorCol: number): boolean {
    return this.inner.shouldTriggerFileCompletion?.(lines, cursorLine, cursorCol) ?? true;
  }

  private skillItems(): AutocompleteItem[] {
    const items: AutocompleteItem[] = [];
    for (const skill of listSkillsByName(this.pi.getCommands()).values()) {
      items.push({
        value: skill.name,
        label: skill.name,
        ...(skill.description ? { description: skill.description } : {}),
      });
    }
    return items;
  }
}
