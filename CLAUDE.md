# Eldore NPC Generator

Foundry VTT module for generating dnd5e NPCs. It is based on Mad Wizard's NPC Generator for DnD5e 1.28.3.

## Development

- Keep the module ID `npc-generator-dnd5e-eldore` and actor flags under `flags.npcgen`.
- Apply changes to future NPC generation. Keep existing actors and the LevelDB packs intact.
- Keep Portrait Studio's canonical `<character folder name>_portrait.webp` naming compatible with Eldore. The portrait and token library is configured separately in Foundry.
- See [CHANGELOG-eldore.md](CHANGELOG-eldore.md) for the 2024 pack audit and [TESTING.md](TESTING.md) for live Foundry checks.

## Verification

- Use Node 24 and run `npm test`. No dependency install or running Foundry instance is required.
- Run `npm run test:matrix` for the larger race, job, and CR sweep.
- Verify Forge asset browsing, dialog behavior, and Argon and Midi-QOL interactions on a temporary scene.

## Release

- Bump the version in `module.json`, then push the matching version tag. GitHub Actions runs the tests and publishes the manifest and module ZIP.
- In The Forge, install Eldore as a custom module using [the stable manifest URL](https://github.com/TaylorBeebe/foundry_npc_generator/releases/latest/download/module.json). Enable only one NPC Generator at a time.

## Foundry MCP

With Eldore and Foundry MCP Bridge active in a D&D 5e world, `eldore_generate_npc` creates one actor using Eldore's rules. The connected Foundry session must be a GM and the bridge's **Allow Write Operations** setting must be enabled.

For Foundry MCP Server 0.8.3 on Windows, run `node tools/install-eldore-mcp.cjs "<path to packages/mcp-server>"` and fully restart Claude Desktop. Add `--check` to inspect compatibility without changing the backend. The installer saves `dist/backend.bundle.cjs.eldore-original` alongside the modified file. Recheck compatibility after updating Foundry MCP.

Example request to Claude: “Use eldore_generate_npc to create a female dwarf bard named Luna Stone at CR 3 with Low HP.”
