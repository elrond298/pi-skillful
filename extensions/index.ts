import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import dollarSkillAutocomplete from "../src/extensions/dollar-skill-autocomplete.js";
import inlineSkillInvocation from "../src/extensions/inline-skill-invocation.js";
import progressiveSkills from "../src/extensions/progressive-skills.js";
import { reportInstallTelemetry } from "../src/install-telemetry.js";
import skillVisibility from "../src/extensions/skill-visibility.js";
import sessionSkillToggles from "../src/extensions/session-skill-toggles.js";

export default function piSkillful(pi: ExtensionAPI) {
  reportInstallTelemetry();

  progressiveSkills(pi);
  inlineSkillInvocation(pi);
  dollarSkillAutocomplete(pi);
  skillVisibility(pi);
  sessionSkillToggles(pi);
}
