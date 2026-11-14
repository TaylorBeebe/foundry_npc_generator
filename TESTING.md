# Eldore verification

## Portrait Studio naming

- [ ] Point the Forge portrait and token settings at the uploaded NPC library. Both settings may target the same folder when portraits and tokens are stored together.
- [ ] Generate Bromgram Madhold and confirm Eldore uses the canonical `Bromgram Madhold_portrait.webp` and the token in Bromgram's folder. Check a legacy name-only export such as `AlaisStarnar.png` in the Alais Starnar folder, and a descriptive flat token such as `Luna Dwarf Bard 6, male.png` for a generic male dwarf bard.
- [ ] Verify the same assets resolve if Forge returns URL-encoded spaces. Offline smoke checks use the library's naming patterns and mocked file lists.

## Offline

From the module folder in PowerShell, run these commands with Node 24.

```powershell
node tools/hp-check.mjs --module=C:/Users/taylo/Downloads/npc-generator-dnd5e
node tools/hp-check.mjs --smoke
node tools/hp-check.mjs --hp=standard
node tools/hp-check.mjs --hp=original
node tools/hp-check.mjs --hp=original --mult=50
node tools/hp-check.mjs --matrix --seeds=2
node --expose-internals tools/audit-2024.cjs
```

The default run uses 25 seeds for each example and up to 15 per human job/CR cell. The matrix uses two seeds per eligible race/job/CR combination, covering CR 0 through 20 and 1/8, 1/4 and 1/2. The RNG is a mock, so these seeds are reproducible offline only.

| Example | Original module median HP (range) | Eldore Low median HP (range) | Standard median | Original budget median |
|---|---:|---:|---:|---:|
| Drow fighter CR 3 | 91 (72–113) | 26 (26–27) | 71 | 65 |
| Bullywug berserker CR 1 | 52 (39–130) | 19 (19–19) | 32 | 39 |
| Hobgoblin evoker CR 5 | 45 (27–153) | 31 (31–33) | 72 | 36 |
| Human priest CR 2 | 77 (18–576) | 17 (17–18) | 35 | 35 |
| Human berserker CR 5 | 260 (188–968) | 39 (37–39) | 104 | 104 |
| Half-orc berserker CR 5 | 195 (150–833) | 37 (37–37) | 112 | 112 |
| Human noble CR 1 | 50 (39–54) | 13 (13–16) | 31 | 36 |

- Original module human grid, 2,280 attempts, 12 crashes, 1,337 validation rejections among completed drafts, largest cap overshoot 210 dice.
- Eldore human grid, 2,760 attempts per mode, zero crashes or cap breaches in all three modes. Low and Standard had zero validation rejections. Original budget rejected 940 drafts under its existing validation rules, which can still trigger the fallback warning in-world.
- Eldore Low matrix, 17,940 drafts, zero crashes, rejections or cap breaches. The first broad run exposed missing mock breath weapons. The final run included all ten dragonborn variants.
- Original budget at 50× had zero cap breaches. The smoke test also forced 20 validation failures and verified the created CR 3 actor had 12 hit dice, the enforced maximum.
- Standard targets 52 HP at CR 2 before the cap. A human fighter reached 52 in the grid. A CR 2 human priest can be much lower because ten hit dice and a low Constitution cap the achievable HP.
- The original divided the HP budget by offensive power, and the weapon estimator omitted the ability and item damage bonuses. For example, the drow fighter's median offense rose from 10.8 to 16.9. Validation could reject excessive hit dice but still returned the last attempt. The baseline berserker example used `35d8 + 105`; the Low example used `5d8 + 15`.
- The low-CR human fighter and warrior failures came from Net. The empty save-damage list made the estimator evaluate an empty parenthesized expression. The repair skips that term and preserves the item's control action.
- The CR 5 hobgoblin evoker's median offense moved from 118.6 to 112.8. With the cap disabled on Eldore it was 120.9. Median caster level moved from 9 to 8, highest slot from 5 to 4, and spells from 26 to 24. A verbose Eldore example scored three Fireball casts at 116.88, 116.88 and 104.67. The score still weights area targets, Sculpt Spells, damage on saves and control effects such as Sleet Storm. It represents the generator's encounter estimate across targets. Low and Standard HP do not depend on that estimate.

## Temporary scene on The Forge

Use Foundry v14 build 370, dnd5e 6.0.6, Midi-QOL 14.6.12, DAE and Argon Combat HUD. Keep the original generator disabled while Eldore is enabled. Use a temporary actor folder and scene.

- [ ] Open **Generate NPC** from the Actor Directory. Confirm the world defaults populate the HP level, disposition, naming and rotation controls. Change HP level in the dialog and confirm the setting still applies to newly opened dialogs.
- [ ] Build a human Berserker at CR 5 and a human Fighter at CR 2 in all three HP modes. Check hit dice against 16 and 10 respectively. Check the formula uses sheet Constitution and the multiplier never bypasses the cap.
- [ ] Generate low-CR Fighters and Warriors until one gets a Net, then confirm creation and the existing Net activity. Compare a shield user's versatile sword damage with a two-handed version. Check ability and magic bonus on a generated +1 weapon.
- [ ] Generate a CR 5 hobgoblin Evoker, a CR 2 Priest and higher-CR casters with the caster cap on. Inspect prepared spells and slot levels. Confirm the ceilings are 5 at CR 2, 9 at CR 6 and 18 at CR 12.
- [ ] Set two Forge asset folders. Add `Luna-Stone_portrait.webp` and a token such as `luna-dwarf-bard-6,-male.webp`. Generate Luna Stone as a male dwarf bard. Check the portrait, the token art, same-score variants, an opposite-sex file and a manual portrait override. Try an empty or unavailable directory and verify creation still works.
- [ ] For named NPCs, try first, full and custom token names. Drag a token to the scene and check neutral disposition, actor linkage, artwork scale and rotation lock. Verify bars, display names and vision still follow the expected defaults. Open **Build NPC** from an actor made by the original module and confirm its existing flags populate the dialog.
- [ ] Generate three generic Dwarf Paladins with fixed Female sex, then a batch with random race and sex. Check actor names, token names, number appending on a temporary scene, actor links, and independent HP when two tokens share a prototype. Random selections can repeat.
- [ ] Create Commoner, Labourer, Merchant and Guard. Inspect their equipment and confirm they have no Multiattack, Parry or Rapier.
- [ ] Confirm a shared name such as Fireball resolves to the 2024 compendium, and a legacy name such as Rapier +1 or Branding Smite falls back. Toggle the preference and repeat.
- [ ] Inspect a generated Multiattack, Reckless, Protection and Parry. For each text-only feature, check for one Utility activity with the expected activation. Confirm a feature with an existing activity retains it. Open the real feature compendium and verify the source items still have their original activities and data.
- [ ] With a generated token selected, trigger the added activities in Argon with Midi-QOL enabled. Check action/reaction grouping, chat cards and whether any optional item-use consumption works as expected. Resolve the attacks, modifiers and rules in the feature text as needed. A Utility activity provides an entry point and does not implement the described mechanics.
- [ ] Switch off the activity setting and generate a fresh actor. Check that the setting applies to future generation and existing actors keep their embedded items.

Offline checks exercised generated data with mocks. Live Forge browsing and asset permissions, Foundry's rendered dialog and token drop behavior, actual LevelDB feature documents and Foundry's activity schema validation, and Argon/Midi-QOL/DAE workflows require the live checks above.
