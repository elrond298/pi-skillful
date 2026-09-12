import assert from "node:assert/strict";
import test from "node:test";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const { default: inlineSkillInvocation } = await import(
  "../.test-dist/src/extensions/inline-skill-invocation.js"
);

const testDir = await mkdtemp(join(tmpdir(), "pi-skillful-inline-"));

async function makeSkill(name, body) {
  const baseDir = join(testDir, name);
  await mkdir(baseDir, { recursive: true });
  const path = join(baseDir, "SKILL.md");
  await writeFile(path, `---\nname: ${name}\ndescription: ${name} frontmatter\n---\n\n${body}`);
  return { name, sourceInfo: { path, baseDir } };
}

async function register(skillList) {
  const handlers = new Map();
  const pi = {
    on: (event, handler) => handlers.set(event, handler),
    getCommands: () =>
      skillList.map((skill) => ({
        name: `skill:${skill.name}`,
        source: "skill",
        description: `${skill.name} description`,
        sourceInfo: skill.sourceInfo,
      })),
  };
  inlineSkillInvocation(pi);
  const notifications = [];
  const ctx = { ui: { notify: (message, type) => notifications.push({ message, type }) } };
  return { handle: (event) => handlers.get("input")(event, ctx), notifications };
}

test("inline invocation prepends a canonical skill block and keeps the input", async () => {
  const harness = await register([await makeSkill("uv", "UV BODY")]);
  const result = await harness.handle({ source: "interactive", text: "Use /skill:uv to run tests." });

  assert.equal(result.action, "transform");
  const block = `<skill name="uv" location="${join(testDir, "uv/SKILL.md")}">\nReferences are relative to ${join(testDir, "uv")}.\n\nUV BODY\n</skill>`;
  assert.ok(result.text.startsWith(block), "must start with the canonical skill block");
  assert.equal(result.text, `${block}\n\nUse /skill:uv to run tests.`);
  assert.ok(!result.text.includes("frontmatter"), "frontmatter must be stripped");
});

test("multiple invocations prepend one block per skill in order", async () => {
  const harness = await register([await makeSkill("uv", "UV BODY"), await makeSkill("jj", "JJ BODY")]);
  const result = await harness.handle({ source: "interactive", text: "Use /skill:uv and /skill:jj." });

  assert.equal(result.action, "transform");
  const blocks = result.text.match(/<skill name="[^"]+"/g) ?? [];
  assert.deepEqual(blocks, ['<skill name="uv"', '<skill name="jj"']);
  assert.ok(result.text.endsWith("Use /skill:uv and /skill:jj."));
});

test("unknown skill warns and leaves the prompt untouched", async () => {
  const harness = await register([await makeSkill("uv", "UV BODY")]);
  const result = await harness.handle({ source: "interactive", text: "Use /skill:nope now." });

  assert.equal(result.action, "continue");
  assert.equal(harness.notifications.length, 1);
  assert.equal(harness.notifications[0].type, "warning");
});

test("mixed known and unknown skills expand only the known ones", async () => {
  const harness = await register([await makeSkill("uv", "UV BODY")]);
  const result = await harness.handle({ source: "interactive", text: "Use /skill:uv and /skill:nope." });

  assert.equal(result.action, "transform");
  assert.ok(result.text.includes("/skill:nope"), "unknown marker must stay");
  assert.ok(result.text.includes("UV BODY"));
  assert.equal(harness.notifications.length, 1);
});

test("resubmitting a forked prompt expands exactly once", async () => {
  const harness = await register([await makeSkill("uv", "UV BODY")]);
  const forkedText = [
    '<skill name="uv" location="/stale/path/SKILL.md">',
    "References are relative to /stale/path.",
    "",
    "OLD BODY",
    "</skill>",
    "",
    "/skill:uv run again",
  ].join("\n");
  const result = await harness.handle({ source: "interactive", text: forkedText });

  assert.equal(result.action, "transform");
  const blockCount = (result.text.match(/<skill name="uv"/g) ?? []).length;
  assert.equal(blockCount, 1, "stale block must be replaced by exactly one fresh block");
  assert.ok(!result.text.includes("/stale/path"), "stale block must not survive");
  assert.ok(result.text.includes("UV BODY"));
  assert.ok(result.text.endsWith("/skill:uv run again"));
});

test("text without invocations is untouched", async () => {
  const harness = await register([await makeSkill("uv", "UV BODY")]);
  const result = await harness.handle({ source: "interactive", text: "plain prompt" });
  assert.equal(result.action, "continue");
  assert.equal(harness.notifications.length, 0);
});

test("extension-sourced input is ignored", async () => {
  const harness = await register([await makeSkill("uv", "UV BODY")]);
  const result = await harness.handle({ source: "extension", text: "/skill:uv" });
  assert.equal(result.action, "continue");
});
