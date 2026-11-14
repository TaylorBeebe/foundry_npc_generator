import { between, repeatFn, seeder, shuffle } from '../../utils.js';
import { applyCommonerRangedWeapon, applyCommonerWeapon } from './commoner.js';
import { removeEvilSpellsIfNotEvil } from '../item/spells.js';
export const druid = {
    name: 'druid',
    tags: ['naturalist', 'spellcaster'],
    bio: { age_multiplier: 2 },
    treasure: 0.5,
    apply: async function (draft) {
        // Abilities
        draft.str += between(0, 2) - 1;
        draft.dex += between(0, 4) + ~~((draft.true_cr - 1) / 6);
        draft.con += between(0, 2) + ~~((draft.true_cr - 1) / 4);
        draft.int += between(0, 2) + ~~((draft.true_cr - 1) / 6);
        draft.wis += between(3, 5) + ~~((draft.true_cr - 1) / 2.5);
        draft.cha += between(0, 2) - 1 + ~~((draft.true_cr - 1) / 6);
        // Skills
        draft.skill('nat');
        const skills = shuffle(['arc', 'ani', 'ins', 'med', 'prc', 'rel', 'sur']);
        repeatFn(() => draft.skill(skills.pop()), (draft.true_cr - 1) / 4 + 1, 3);
        // If the NPC is a Commoner
        if (draft.cr === 0) {
            await applyCommonerWeapon(draft);
            await applyCommonerRangedWeapon(draft);
            return;
        }
        // Saves
        if (draft.cr > 1)
            draft.save('wis');
        if (draft.cr > 3)
            draft.save('int');
        // Languages
        draft.language('druidic');
        // Armor and Equipment
        let armor = ['Padded Armor', 'Leather Armor', 'Studded Leather Armor', 'Hide Armor'];
        if (draft.cr > 1)
            armor = ['Studded Leather Armor'];
        await draft.armor(armor);
        if (seeder.rnd() > 0.7)
            await draft.item('Shield');
        // Weapons
        const weaponList = ['Club', 'Quarterstaff', 'Spear'];
        const weapon = await draft.weapon(draft.pickFavoredWeapon(weaponList));
        // Multiattack
        // The multiattack is set even with one attack, to trigger multiattack in case the creature has Bite
        const strikes = 1;
        draft.multiattack(Array(strikes).fill(weapon));
        // Special Equipment
        // Besides the weapons, none
        // Spellcasting
        let spellcaster_level = 1;
        if (draft.cr > 0.25)
            spellcaster_level = draft.true_cr - 1 + between(0, 3) - 1;
        if (draft.cr > 1)
            spellcaster_level = draft.true_cr - 1 + between(0, 2);
        if (draft.cr > 5)
            spellcaster_level = draft.true_cr - 1 + between(0, 4);
        spellcaster_level = draft.limitCasterLevel(spellcaster_level);
        await draft.setSpellcaster('druid', spellcaster_level);
        // Cantrips
        const circle_land = seeder.rnd() > 0.5;
        const cantrips = 3 + +(spellcaster_level > 3) + +(spellcaster_level > 9) + +circle_land;
        // Spells
        const spells_primary = {
            0: shuffle([
                'Create Bonfire',
                'Frostbite',
                'Infestation',
                'Magic Stone',
                'Poison Spray',
                'Primal Savagery',
                'Produce Flame',
                'Shillelagh',
                'Thorn Whip',
                'Thunderclap',
            ]),
            1: shuffle([
                'Absorb Elements',
                'Cure Wounds',
                'Earth Tremor',
                'Entangle',
                'Faerie Fire',
                'Fog Cloud',
                'Healing Word',
                'Ice Knife',
                'Thunderwave',
            ]),
            2: shuffle([
                'Barkskin',
                'Dust Devil',
                'Earthbind',
                'Flame Blade',
                'Flaming Sphere',
                'Healing Spirit',
                'Heat Metal',
                'Hold Person',
                'Moonbeam',
                'Spike Growth',
                'Summon Beast',
                'Warding Wind',
                'Wither and Bloom',
            ]),
            3: shuffle([
                'Aura of Vitality',
                'Call Lightning',
                'Conjure Animals',
                'Erupting Earth',
                'Flame Arrows',
                'Sleet Storm',
                'Summon Fey',
                'Tidal Wave',
                'Wall of Water',
                'Wind Wall',
            ]),
            4: shuffle([
                'Blight',
                'Confusion',
                'Conjure Minor Elementals',
                'Conjure Woodland Beings',
                'Control Water',
                'Fire Shield',
                'Freedom of Movement',
                'Giant Insect',
                'Grasping Vine',
                'Guardian of Nature',
                'Ice Storm',
                'Polymorph',
                'Stoneskin',
                'Summon Elemental',
                'Wall of Fire',
                'Watery Sphere',
            ]),
            5: shuffle([
                'Antilife Shell',
                'Cone of Cold',
                'Conjure Elemental',
                'Contagion',
                'Insect Plague',
                'Maelstrom',
                'Mass Cure Wounds',
                'Summon Draconic Spirit',
                'Transmute Rock',
                'Wall of Stone',
                'Wrath of Nature',
            ]),
            6: shuffle([
                'Bones of the Earth',
                'Conjure Fey',
                'Flesh to Stone',
                'Heal',
                "Heroes' Feast",
                'Investiture of Flame',
                'Investiture of Ice',
                'Investiture of Stone',
                'Investiture of Wind',
                'Sunbeam',
                'Wall of Thorns',
            ]),
            7: shuffle(['Draconic Transformation', 'Fire Storm', 'Reverse Gravity', 'Whirlwind']),
            8: shuffle([
                'Animal Shapes',
                'Antipathy/Sympathy',
                'Control Weather',
                'Earthquake',
                'Feeblemind',
                'Incendiary Cloud',
                'Sunburst',
                'Tsunami',
            ]),
            9: shuffle(['Foresight', 'Shapechange', 'Storm of Vengeance', 'True Resurrection']),
        };
        const spells_utility = {
            0: shuffle([
                'Control Flames',
                'Druidcraft',
                'Guidance',
                'Gust',
                'Mending',
                'Mold Earth',
                'Resistance',
                'Shape Water',
            ]),
            1: shuffle([
                'Animal Friendship',
                'Beast Bond',
                'Charm Person',
                'Create or Destroy Water',
                'Detect Magic',
                'Detect Poison and Disease',
                'Goodberry',
                'Jump',
                'Longstrider',
                'Protection from Evil and Good',
                'Purify Food and Drink',
                'Snare',
                'Speak with Animals',
            ]),
            2: shuffle([
                'Air Bubble',
                'Animal Messenger',
                'Augury',
                'Beast Sense',
                'Continual Flame',
                'Darkvision',
                'Enhance Ability',
                'Enlarge/Reduce',
                'Find Traps',
                'Gust of Wind',
                'Lesser Restoration',
                'Locate Animals or Plants',
                'Locate Object',
                'Pass without Trace',
                'Protection from Poison',
                'Skywrite',
            ]),
            3: shuffle([
                'Daylight',
                'Dispel Magic',
                'Elemental Weapon',
                'Feign Death',
                'Meld into Stone',
                'Plant Growth',
                'Protection from Energy',
                'Revivify',
                'Speak with Plants',
                'Water Breathing',
                'Water Walk',
            ]),
            4: shuffle([
                'Charm Monster',
                'Divination',
                'Dominate Beast',
                'Elemental Bane',
                'Hallucinatory Terrain',
                'Locate Creature',
                'Stone Shape',
            ]),
            5: shuffle([
                'Awaken',
                'Commune with Nature',
                'Control Winds',
                'Geas',
                'Greater Restoration',
                'Planar Binding',
                'Reincarnate',
                'Scrying',
                'Tree Stride',
            ]),
            6: shuffle(['Druid Grove', 'Find the Path', 'Move Earth', 'Primordial Ward', 'Transport via Plants', 'Wind Walk']),
            7: shuffle(['Mirage Arcane', 'Plane Shift', 'Regenerate', 'Symbol']),
            8: [],
            9: [],
        };
        removeEvilSpellsIfNotEvil(draft, [spells_primary, spells_utility]);
        const spell_slots = [...draft.spellcasting.spellSlots];
        const total_spell_slots = spell_slots.reduce((a, b) => a + b);
        const spells_prepared = spellcaster_level + draft.mod('int');
        let max_level = draft.spellcasting.spellSlots.indexOf(0);
        if (max_level === -1)
            max_level = 9;
        const additional_spells = spells_prepared - total_spell_slots;
        for (let i = 0; i < additional_spells; i++) {
            const slot = ~~(seeder.rnd() ** 3 * (max_level - 1) + 1 + 0.5);
            spell_slots[slot - 1]++;
        }
        const spells_drawn = [cantrips, ...spell_slots];
        await draft.draftSpellList(spells_primary, spells_utility, spells_drawn);
        // Features
        await draft.feature('Speak with Beasts and Plants');
        if (spellcaster_level > 1) {
            let shape_cr = '1/4';
            if (circle_land) {
                if (spellcaster_level > 3)
                    shape_cr = '1/2';
                if (spellcaster_level > 7)
                    shape_cr = '1';
            }
            else {
                shape_cr = '' + Math.max(1, ~~(spellcaster_level / 3));
            }
            let speak = spellcaster_level > 17;
            const time = ~~(spellcaster_level / 2);
            let description = `<p>The druid magically polymorphs into a <b>beast</b> with a challenge rating of ${shape_cr} or less, and can remain in this form up to ${time} hours.
                            The druid can choose whether its equipment falls to the ground, melds with its new form, or is worn by the new form. The druid reverts to its true form if it dies or falls unconscious.
                            The druid can revert to its true form using a bonus action on its turn.</p>
                        <p>While in a new form, the druid retains its game statistics${speak ? ' and ability to speak' : ''}, but its AC, movement modes, Strength, and Dexterity are replaced by those of the new form, and it gains any special senses, proficiencies, traits, actions, and reactions (except class features, legendary actions, and lair actions) that the new form has but that it lacks.
                        ${speak
                ? 'It can cast its spells with verbal or somatic components in its new form.'
                : 'It cannot cast spells in its new form.'}</p>`;
            await draft.feature('Change Shape', { description, uses: 2 });
        }
    },
};
