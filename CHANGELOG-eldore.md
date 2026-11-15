# Eldore changelog

## 1.28.6

- Register **Build NPC** before the Actors sidebar first renders so Foundry v14 includes it in the cached context menu. The entry uses the v14 label and click handler and retains compatibility with the legacy menu.

## 1.28.5

- Restored **Build NPC** on the Foundry v14 actor menu and kept the legacy hook with duplicate protection. The dialog restores the actor’s saved name, race, job, CR, and seed.
- A seed entered in the dialog, including `0`, is used for the first draft. Blank seeds are randomized. Low and Standard use one attempt. Original still retries with a fresh seed if validation fails.
- Biography draws share the pending CSV load. They skip unavailable, ineligible, and exhausted tables instead of throwing or spinning, including recursive draws.
- HP formulas omit a zero Constitution term. HP calculations and caps are unchanged.

## 1.28.3

- Set the package ID and settings namespace to `npc-generator-dnd5e-eldore`, including asset paths, Babele description flags, and generator lookups. Removed the upstream install and download URLs from the private fork manifest to avoid pointing updates at the original. Actor metadata stays under `flags.npcgen`. Enable only one generator at a time. Pack files were copied byte for byte.
- Added Low, Standard, and Original budget HP modes, a world multiplier, and a per-NPC mode selector. Low starts at `10 + 5.5 × CR`, with +8% for martial jobs and −15% for other casters. Standard starts at `12 + 20 × CR`. Original uses the XP/offense/AC/resistance budget, subtracts temporary HP and effective HP bonuses once, and accounts for cursed-axe effective HP separately from Constitution. All modes round to whole dice and cap at `floor(6 + 2 × CR)` before validation. Low and Standard bypass the Original-mode HP-versus-offense and minimum dice-versus-CR/caster-level checks so low targets do not cause retries.
- Restored weapon damage bonuses, ability modifiers and magic bonuses in offense estimates and generated descriptions. Versatile weapons use one-handed damage with a shield. Blank versatile fields, zero-damage attacks and empty save damage arrays are handled, including Net. Fixed die averages, negative odd ability modifiers, and support for the proficiency term on 2024 Unarmed Strike. Weapon attack descriptions include the item's magic attack bonus. Armor estimation uses the dnd5e 6 armor strength field and the relevant Dexterity cap.
- Applied the optional caster cap at the level calculation in all ten caster jobs before spell and slot generation. The ceiling is CR + 3 through CR 6 and rises by 1.5 levels per CR above that, rounded down and capped at 20. Spell offense uses actual slot levels, ignores exhausted slots, and calculates the half-on-save contribution from the estimated successful-save share. Slot spending and trait aggregation no longer leave negative slots or accumulate repeated trait bonuses. A spell's activation and casting ability now drive its offense estimate.
- Corrected the at-will class spell list, numeric and fractional CR parsing, race minimum-CR filtering, duplicate languages and resistances/immunities, and empty spell-use lists. Retries use a fresh seed without mutating the caller's input. Missing summary features and missing dragonborn breath weapon data no longer crash draft preparation. The actor payload omits the temporary draft AC function.
- Defaulted to 2024 equipment and spells, with exact-name legacy fallback. Custom pack lists retain their configured order. A missing pack is skipped. High-CR berserkers use Half Plate Armor when Spiked Armor is unavailable. The tiefling Fierna ancestry uses Thaumaturgy if Friends is unavailable. Fixed Swashbuckler requests for nonexistent +4 weapons by capping their bonus at +3.
- Added named portrait matching and a token directory with race/job/sex matching. Tokens with an explicitly opposite sex are excluded and ties use a random best match. A locked portrait or an explicit token takes priority. Art browsing uses the Forge Assets Library on Forge and the data directory elsewhere. Tokenizer remains available for portrait-only art.
- Added world defaults and dialog controls for disposition, named token links, token names and rotation lock. Artwork scale is a world setting. Generic batches create actors in the selected folder, with descriptive actor names, job-based token names, unlinked data, and append-number enabled on prototype tokens. Each copy can draw its own eligible race and sex. Existing token bars, display settings, vision and biography fields continue to use the original generation paths.
- Added the Civilian job group with Commoner, Labourer, Merchant and Guard. They use simple weapons without Multiattack, Parry or Rapier.
- Added a world toggle for generation-time utility activities on text-only active features. An existing activity is preserved. Utilities expose actions to the dnd5e activity workflow, with their original mechanical text for adjudication. See the [dnd5e utility activity reference](https://github.com/foundryvtt/dnd5e/wiki/Activity-Type-Utility) and the [Forge file picker documentation](https://forums.forge-vtt.com/t/using-the-filepicker-to-interact-with-the-assets-library/98008).
- Extended the offline harness with a full race/job/CR matrix, grouped crash output, mock features for the ten dynamic dragonborn names, and smoke checks for art, token fields, pack fallback, formulas, caster ceilings and retry exhaustion.

# Portrait Studio compatibility

- Match Studio's `<character folder name>_portrait.webp` and Eldore's hyphenated names using Unicode-aware name matching. Prefer the canonical WebP. Recognize numbered and older Studio portraits where the filename or character folder identifies the NPC.
- Prefer token art from the named character's folder. Recognize common descriptive labels such as Dwarven, Elven, Barbarian, Rogue, Wizard and Cleric. Exclude portraits and portrait history from automatic token selection. This works with the existing library filenames.

# Names missing from the 2024 fixture

Exact names requested by jobs and races, including the elf wizard-cantrip pool, the dynamic enchanted weapon suffixes and the two cursed axes. The audit parses JavaScript string literals, including apostrophes, and excludes commented-out entries. Entries absent from both fixture editions may exist in additional packs configured in Foundry. Spell list draws skip unavailable picks. Feature-compendium entries are outside this equipment and spell audit.

Reproduce with Node 24 using `node --expose-internals tools/audit-2024.cjs`.


## Equipment (63 names checked)

### Legacy fixture fallback

- Berserker Battleaxe
- Berserker Greataxe
- Dagger +1
- Dagger +2
- Dagger +3
- Greatsword +1
- Halberd +1
- Maul +1
- Net
- Pike +1
- Rapier +1
- Rapier +2
- Rapier +3
- War Pick +1

### Absent from both fixture editions

- Spiked Armor

## Spells (521 names checked)

### Legacy fixture fallback

- Branding Smite
- Feeblemind

### Absent from both fixture editions

- Abi-Dalzim's Horrid Wilting
- Absorb Elements
- Aganazzar's Scorcher
- Air Bubble
- Arcane Gate
- Armor of Agathys
- Arms of Hadar
- Ashardalon's Stride
- Aura of Purity
- Aura of Vitality
- Banishing Smite
- Beast Bond
- Beast Sense
- Bigby's Hand
- Binding Ice
- Blade of Disaster
- Blade Ward
- Blinding Smite
- Bones of the Earth
- Booming Blade
- Borrowed Knowledge
- Catapult
- Catnap
- Cause Fear
- Caustic Brew
- Ceremony
- Chaos Bolt
- Circle of Power
- Cloud of Daggers
- Compelled Duel
- Conjure Barrage
- Conjure Volley
- Control Flames
- Control Winds
- Cordon of Arrows
- Create Bonfire
- Create Homunculus
- Create Magen
- Create Spelljamming Helm
- Crown of Madness
- Crown of Stars
- Crusader's Mantle
- Danse Macabre
- Dawn
- Destructive Wave
- Distort Value
- Draconic Transformation
- Drawmij's Instant Summons
- Dream of the Blue Veil
- Druid Grove
- Dust Devil
- Earth Tremor
- Earthbind
- Earthen Grasp
- Elemental Bane
- Elemental Weapon
- Enemies Abound
- Enervation
- Erupting Earth
- Evard's Black Tentacles
- Far Step
- Fast Friends
- Feign Death
- Find Greater Steed
- Fizban's Platinum Shield
- Flame Arrows
- Friends
- Frost Fingers
- Frostbite
- Gift of Gab
- Glowing Coin
- Grasping Vine
- Green-Flame Blade
- Guardian of Nature
- Gust
- Hail of Thorns
- Healing Spirit
- Holy Weapon
- Hunger of Hadar
- Illusory Dragon
- Immolation
- Incite Greed
- Infernal Calling
- Infestation
- Intellect Fortress
- Investiture of Flame
- Investiture of Ice
- Investiture of Stone
- Investiture of Wind
- Invulnerability
- Jim's Glowing Coin
- Jim's Magic Missile
- Kinetic Jaunt
- Leomund's Secret Chest
- Leomund's Tiny Hut
- Life Transference
- Lightning Arrow
- Lightning Lure
- Maddening Darkness
- Maelstrom
- Magic Aura
- Magic Stone
- Mass Polymorph
- Maximilian's Earthen Grasp
- Melf's Acid Arrow
- Melf's Minute Meteors
- Mental Prison
- Mighty Fortress
- Mind Sliver
- Mind Whip
- Mischief
- Mold Earth
- Mordenkainen's Faithful Hound
- Mordenkainen's Magnificent Mansion
- Mordenkainen's Private Sanctum
- Mordenkainen's Sword
- Motivational Speech
- Nathair's Mischief
- Negative Energy Flood
- Nystul's Magic Aura
- Otherworldly Guise
- Otiluke's Freezing Sphere
- Otiluke's Resilient Sphere
- Otto's Irresistible Dance
- Platinum Shield
- Power Word Pain
- Primal Savagery
- Primordial Ward
- Psychic Lance
- Psychic Scream
- Pyrotechnics
- Rary's Telepathic Bond
- Raulothim's Psychic Lance
- Rime's Binding Ice
- Scatter
- Shadow Blade
- Shadow of Moil
- Shape Water
- Sickening Radiance
- Silvery Barbs
- Skill Empowerment
- Skywrite
- Snare
- Snilloc's Snowball Swarm
- Snowball Swarm
- Soul Cage
- Spirit Shroud
- Staggering Smite
- Steel Wind Strike
- Storm Sphere
- Summon Aberration
- Summon Beast
- Summon Celestial
- Summon Construct
- Summon Draconic Spirit
- Summon Elemental
- Summon Fey
- Summon Fiend
- Summon Greater Demon
- Summon Lesser Demons
- Summon Shadowspawn
- Summon Undead
- Swift Quiver
- Sword Burst
- Synaptic Static
- Tasha's Caustic Brew
- Tasha's Hideous Laughter
- Tasha's Mind Whip
- Tasha's Otherworldly Guise
- Telepathy
- Temple of the Gods
- Tenser's Floating Disk
- Tenser's Transformation
- Thorn Whip
- Thunder Step
- Thunderclap
- Thunderous Smite
- Tidal Wave
- Tiny Servant
- Toll the Dead
- Transmute Rock
- Vortex Warp
- Wall of Light
- Wall of Sand
- Wall of Water
- Warding Wind
- Watery Sphere
- Whirlwind
- Witch Bolt
- Wither and Bloom
- Word of Radiance
- Wrath of Nature
- Wrathful Smite
- Zephyr Strike
