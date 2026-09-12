import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { listSkillsByName, readSkillBlock } from "../skills.js";

const SKILL_INVOCATION_PATTERN = /(^|[^\w/-])\/skill:([a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?)(?=$|[^a-z0-9-])/g;
const EXPANDED_SKILL_BLOCKS = /^(?:<skill name="[^"]*" location="[^"]*">\n[\s\S]*?\n<\/skill>\n\n)+/;

export default function inlineSkillInvocation(pi: ExtensionAPI) {
  pi.on("input", async (event, ctx) => {
    if (event.source === "extension" || !event.text.includes("/skill:")) {
      return { action: "continue" };
    }

    // Drop skill blocks left by a previous expansion (fork resubmit) so the
    // prompt is expanded exactly once.
    const userText = event.text.replace(EXPANDED_SKILL_BLOCKS, "");

    const skillsByName = listSkillsByName(pi.getCommands());
    const invocations = findInvocations(userText);
    if (invocations.length === 0) return { action: "continue" };
    const unknown = invocations.filter((invocation) => !skillsByName.has(invocation.name));
    if (unknown.length > 0) {
      ctx.ui.notify(
        `Unknown skill invocation(s): ${Array.from(new Set(unknown.map((invocation) => invocation.name))).join(", ")}`,
        "warning",
      );
    }

    const blocks = new Map<string, string>();
    for (const invocation of invocations) {
      const skill = skillsByName.get(invocation.name);
      if (!skill || blocks.has(invocation.name)) continue;

      try {
        blocks.set(invocation.name, await readSkillBlock(skill));
      } catch (error) {
        ctx.ui.notify(
          `Failed to read skill ${invocation.name}: ${error instanceof Error ? error.message : String(error)}`,
          "warning",
        );
      }
    }

    if (blocks.size === 0) return { action: "continue" };

    // Canonical Pi expansion: prepend the <skill> blocks and keep the user's
    // input as typed, so Pi renders each skill as a collapsible [skill] entry.
    const expanded = `${Array.from(blocks.values()).join("\n\n")}\n\n${userText}`;

    return { action: "transform", text: expanded, images: event.images };
  });

}

function findInvocations(text: string): Array<{ name: string }> {
  const result: Array<{ name: string }> = [];
  const pattern = new RegExp(SKILL_INVOCATION_PATTERN.source, "g");
  for (const match of text.matchAll(pattern)) {
    result.push({ name: match[2] });
  }
  return result;
}
