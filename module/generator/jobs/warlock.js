import { between, findItem, pick, repeatFn, shuffle } from '../../utils.js';
import { removeEvilSpellsIfNotEvil, spells } from '../item/spells.js';
import { applyCommonerWeapon } from './commoner.js';
/**
 * Draw spells for the given spell lists
 * @param spells_primary Primary Spell List
 * @param spells_utility Utility Spell List - Spells wich do not affect combat
 * @param spells_drawn An array with the number of spells to draw at each spell level
 * @param draw_primary Wether the first spell of each level should be a primary or utility spell
 */
export async function draftPactSpellList(draft, spells_primary, spells_utility, spells_drawn, skip = 1) {
    for (let level = 0; level < spells_drawn.length; level++) {
        const slot = spells_drawn[level];
        let spellLevel = level;
        for (let i = skip; i < slot; i++) {
            const primary = 1 - (i % 2);
            let spell;
            let k = 0;
            while (!spell || draft.cr < (spells[spell]?.cr ?? 0) || !findItem(spell, 'spells')) {
                spell = (primary ? spells_primary[spellLevel] : spells_utility[spellLevel])?.pop();
                if (!spell) {
                    const mixed_list = [...spells_primary[spellLevel], ...spells_utility[spellLevel]];
                    spells_primary[spellLevel] = mixed_list;
                    spells_utility[spellLevel] = mixed_list;
                    if (mixed_list.length === 0)
                        spellLevel--;
                }
                k++;
                if (k++ > 100) {
                    throw new Error(`Failed to draft spells from ${draft.race} / ${draft.job} (#${draft.seed})`);
                }
            }
            if (level < 6)
                await draft.spell(spell);
            else
                await draft.innate(spell, { max: 1, period: 'day' });
            if (skip)
                skip = Math.max(0, skip - i);
        }
    }
}
export const warlock = {
    name: 'warlock',
    alignment: ['LN', 'LE', 'N', 'NE', 'CN', 'CE'],
    tags: ['spellcaster', 'arcanist', 'cultist'],
    treasure: 2,
    apply: async function (draft) {
        // Abilities
        draft.str += between(0, 2) - 2 + ~~((draft.true_cr - 1) / 5);
        draft.dex += between(0, 4) + ~~((draft.true_cr - 1) / 4);
        draft.con += between(0, 2) - 2 + ~~((draft.true_cr - 1) / 5);
        draft.int += between(0, 2) + ~~((draft.true_cr - 1) / 3);
        draft.wis += between(0, 3) + ~~((draft.true_cr - 1) / 3);
        draft.cha += between(3, 5) + ~~((draft.true_cr - 1) / 2.5);
        // Skills
        draft.skill('dec');
        const skills = shuffle(['arc', 'his', 'itm', 'inv', 'nat', 'rel']);
        repeatFn(() => draft.skill(skills.pop()), (draft.true_cr - 1) / 4 + 1, 4);
        // If the NPC is a Commoner
        if (draft.cr === 0) {
            await applyCommonerWeapon(draft);
            return;
        }
        // Saves
        if (draft.cr > 1)
            draft.save('wis');
        if (draft.cr > 3)
            draft.save('cha');
        // Languages
        draft.language(pick(['abyssal', 'draconic', 'infernal', 'ignan', 'sylvan', 'deep']));
        // Armor and Equipment
        let armor = ['Padded Armor', 'Leather Armor', 'Studded Leather Armor'];
        if (draft.cr > 0.5)
            armor = ['Studded Leather Armor'];
        await draft.armor(pick(armor));
        // Weapons
        const weaponList = ['Dagger', 'Quarterstaff'];
        const weapon = await draft.weapon(draft.pickFavoredWeapon(weaponList));
        // Multiattack
        const strikes = ~~((draft.true_cr - 1 + 9) / 6);
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
        await draft.setSpellcaster('warlock', spellcaster_level);
        // Cantrips
        const cantrips = 2 + +(spellcaster_level > 3) + +(spellcaster_level > 9);
        await draft.spell('Eldritch Blast');
        // Spells
        const spells_primary = {
            0: shuffle([
                'Booming Blade',
                'Chill Touch',
                'Create Bonfire',
                'Frostbite',
                'Green-Flame Blade',
                'Infestation',
                'Lightning Lure',
                'Magic Stone',
                'Mind Sliver',
                'Poison Spray',
                'Sword Burst',
                'Thunderclap',
                'Toll the Dead',
            ]),
            1: shuffle(['Armor of Agathys', 'Arms of Hadar', 'Cause Fear', 'Hellish Rebuke', 'Hex', 'Witch Bolt']),
            2: shuffle([
                'Cloud of Daggers',
                'Crown of Madness',
                'Hold Person',
                'Mind Spike',
                'Mirror Image',
                'Misty Step',
                'Ray of Enfeeblement',
                'Shadow Blade',
                'Shatter',
            ]),
            3: shuffle([
                'Counterspell',
                'Enemies Abound',
                'Fear',
                'Hunger of Hadar',
                'Hypnotic Pattern',
                'Incite Greed',
                'Remove Curse',
                'Spirit Shroud',
                'Summon Fey',
                'Summon Lesser Demons',
                'Summon Shadowspawn',
                'Summon Undead',
                'Vampiric Touch',
            ]),
            4: shuffle([
                'Banishment',
                'Blight',
                'Psychic Lance',
                "Raulothim's Psychic Lance",
                'Shadow of Moil',
                'Sickening Radiance',
                'Summon Aberration',
                'Summon Greater Demon',
            ]),
            5: shuffle([
                'Danse Macabre',
                'Enervation',
                'Far Step',
                'Hold Monster',
                'Negative Energy Flood',
                'Synaptic Static',
                'Wall of Light',
            ]),
            6: shuffle([
                'Arcane Gate',
                'Circle of Death',
                'Conjure Fey',
                'Create Undead',
                'Eyebite',
                'Flesh to Stone',
                'Investiture of Flame',
                'Investiture of Ice',
                'Investiture of Stone',
                'Investiture of Wind',
                'Mass Suggestion',
                'Mental Prison',
                'Scatter',
                'Soul Cage',
                'Summon Fiend',
                "Tasha's Otherworldly Guise",
                'Otherworldly Guise',
                'True Seeing',
            ]),
            7: shuffle([
                'Crown of Stars',
                'Dream of the Blue Veil',
                'Etherealness',
                'Finger of Death',
                'Forcecage',
                'Plane Shift',
                'Power Word Pain',
            ]),
            8: shuffle(['Demiplane', 'Dominate Monster', 'Feeblemind', 'Glibness', 'Maddening Darkness', 'Power Word Stun']),
            9: shuffle([
                'Astral Projection',
                'Blade of Disaster',
                'Foresight',
                'Gate',
                'Imprisonment',
                'Power Word Kill',
                'Psychic Scream',
                'True Polymorph',
                'Weird',
            ]),
        };
        const spells_utility = {
            0: shuffle(['Blade Ward', 'Friends', 'Mage Hand', 'Minor Illusion', 'Prestidigitation', 'True Strike']),
            1: shuffle([
                'Charm Person',
                'Comprehend Languages',
                'Distort Value',
                'Expeditious Retreat',
                'Illusory Script',
                'Protection from Evil and Good',
                'Unseen Servant',
            ]),
            2: shuffle(['Borrowed Knowledge', 'Darkness', 'Earthbind', 'Enthrall', 'Invisibility', 'Spider Climb', 'Suggestion']),
            3: shuffle([
                'Dispel Magic',
                'Fly',
                'Gaseous Form',
                'Intellect Fortress',
                'Magic Circle',
                'Major Image',
                'Thunder Step',
                'Tongues',
            ]),
            4: shuffle(['Charm Monster', 'Dimension Door', 'Elemental Bane', 'Hallucinatory Terrain']),
            5: shuffle([
                'Contact Other Plane',
                'Dream',
                'Infernal Calling',
                'Mislead',
                'Planar Binding',
                'Scrying',
                'Teleportation Circle',
            ]),
            6: [],
            7: [],
            8: [],
            9: [],
        };
        removeEvilSpellsIfNotEvil(draft, [spells_primary, spells_utility]);
        const max_level = draft.data.system.spells.pact.level;
        const spells_known = Math.min(spellcaster_level + 1, 10) + Math.max(Math.min(~~((spellcaster_level - 9) / 2), 5), 0);
        const spells_drawn = [cantrips, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        for (let i = 0; i < spells_known; i++) {
            const level = 1 + (i % max_level);
            spells_drawn[level]++;
        }
        const arcanums = ~~((spellcaster_level - 9) / 2);
        for (let i = 0; i < arcanums; i++)
            spells_drawn[i + 6]++;
        await draftPactSpellList(draft, spells_primary, spells_utility, spells_drawn, 1);
        // Features
        // None
    },
};
