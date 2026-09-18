# Integration ledger

The base pipeline needs only Node 22+. These integration routes are explicit; “specified” does not mean connected or tested.

| Capability | Implementation route | Actual V1 status |
| --- | --- | --- |
| Research and writing | Interactive host + six original skills | Packaged; pilot produced in this build session |
| GitHub source | Existing connector or local Git | Repository publication separately verified in handoff |
| Notion input | Host connector fetch + private extraction | Existing plan fetched; not a headless Notion importer |
| GPT Image | Host image tool guided by plan-visuals | Brief prepared; image generation not run for pilot |
| Mermaid | Editable .mmd + installed host renderer | Source included; pilot cover is original SVG, not a claimed Mermaid render |
| Whimsical | Optional authenticated host connector | Not required by base pipeline; no board created |
| LinkedIn Animated Infographics | Optional installed specialist skill | Brief prepared; no animation exported |
| Zapier / LinkedIn | Actual discovered host action after approval | Dry-run handoff implemented; live connection not assumed |
| GitHub Pages | Manual workflow after repository Pages setup | Configuration supplied; live status requires deployment verification |
| Remote MCP | None | Deliberately not built or hosted |

## Third-party editorial candidates
ECC: https://ecc.tools/skills and https://github.com/affaan-m/ecc
LinkedIn skills: https://github.com/sergebulaev/linkedin-skills

The repository ships original content-specific skills rather than silently installing whole third-party bundles. Before adding upstream material, inspect its current source, license, scripts, tool calls, data destinations and dependency chain. Pin the reviewed commit and retain its notices. Keep Jordan's voice and safety rules separate. Do not inherit optional scraping/publishing dependencies merely to obtain writing instructions. Algorithm claims are hypotheses, not verified platform rules.

## Plugin packaging
The portable root plugin.json follows the manual skills-only format documented at https://developers.openai.com/codex/build-plugins. Skills follow the SKILL.md frontmatter convention. Account-level installation and host capability testing are separate from repository validation. During a local test, read skills/content-studio/SKILL.md explicitly. No endpoint is registered, and no host credentials are copied into the package.
