import assert from "node:assert/strict";
import test from "node:test";

const { default: dollarSkillAutocomplete } = await import(
  "../.test-dist/src/extensions/dollar-skill-autocomplete.js"
);

const skills = [
  {
    name: "skill:uv",
    source: "skill",
    description: "Python package manager",
    sourceInfo: { path: "/skills/uv/SKILL.md", baseDir: "/skills" },
  },
  {
    name: "skill:jujutsu",
    source: "skill",
    description: "jj VCS workflow",
    sourceInfo: { path: "/skills/jujutsu/SKILL.md", baseDir: "/skills" },
  },
];

function registerProvider() {
  const handlers = new Map();
  let factory;
  const pi = {
    on: (event, handler) => handlers.set(event, handler),
    getCommands: () => skills,
  };
  dollarSkillAutocomplete(pi);
  const ui = {
    addAutocompleteProvider: (f) => {
      factory = f;
    },
  };
  handlers.get("session_start")({}, { mode: "tui", ui });
  return factory;
}

const inner = {
  getSuggestions: async () => ({ items: [{ value: "inner" }], prefix: "inner-prefix" }),
  applyCompletion: (lines, cursorLine, cursorCol, item, prefix) => ({
    lines,
    cursorLine,
    cursorCol: 999,
  }),
};

function suggestionsFor(provider, text) {
  return provider.getSuggestions([text], 0, text.length, { signal: new AbortController().signal });
}

test("$ followed by a skill name offers matching skills", async () => {
  const provider = registerProvider()(inner);
  const result = await suggestionsFor(provider, "$uv");
  assert.deepEqual(
    result.items.map((item) => item.value),
    ["uv"],
  );
  assert.equal(result.prefix, "$uv");
  assert.equal(result.items[0].description, "Python package manager");
});

test("$ works mid-input after other text", async () => {
  const provider = registerProvider()(inner);
  const result = await suggestionsFor(provider, "please run $juj");
  assert.deepEqual(
    result.items.map((item) => item.value),
    ["jujutsu"],
  );
  assert.equal(result.prefix, "$juj");
});

test("bare $ lists all skills", async () => {
  const provider = registerProvider()(inner);
  const result = await suggestionsFor(provider, "$");
  assert.deepEqual(
    result.items.map((item) => item.value).sort(),
    ["jujutsu", "uv"],
  );
  assert.equal(result.prefix, "$");
});

test("$skill: prefix is normalized to the bare skill name", async () => {
  const provider = registerProvider()(inner);
  const result = await suggestionsFor(provider, "$skill:uv");
  assert.deepEqual(
    result.items.map((item) => item.value),
    ["uv"],
  );
});

test("unmatched $ token returns no popup", async () => {
  const provider = registerProvider()(inner);
  assert.equal(await suggestionsFor(provider, "echo $HOME"), null);
});

test("text without $ delegates to the inner provider", async () => {
  const provider = registerProvider()(inner);
  const result = await suggestionsFor(provider, "/skill:uv");
  assert.deepEqual(result.items, [{ value: "inner" }]);
});

test("accepting a $ suggestion inserts /skill:name and keeps trailing text", () => {
  const provider = registerProvider()(inner);
  const result = provider.applyCompletion(["run $uv please"], 0, 7, { value: "uv", label: "uv" }, "$uv");
  assert.equal(result.lines[0], "run /skill:uv  please");
  assert.equal(result.cursorCol, 14);
});

test("non-$ prefixes delegate completion to the inner provider", () => {
  const provider = registerProvider()(inner);
  const result = provider.applyCompletion(["text"], 0, 4, { value: "x", label: "x" }, "prefix");
  assert.equal(result.cursorCol, 999);
});
