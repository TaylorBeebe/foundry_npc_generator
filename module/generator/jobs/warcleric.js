import { between, repeatFn, seeder, shuffle } from '../../utils.js';
import { applyCommonerWeapon } from './commoner.js';
import { removeEvilSpellsIfNotEvil } from '../item/spells.js';
export const warcleric = {
    name: 'warcleric',
    tags: ['religious', 'martial'],
    treasure: 1.5,
    apply: async function (draft) {
        // Abilities
        draft.str += between(2, 4) + ~~((draft.true_cr - 1) / 3);
        draft.dex += between(0, 2) + ~~((draft.true_cr - 1) / 6);
        draft.con += between(0, 2) + ~~((draft.true_cr - 1) / 3);
        draft.int += between(0, 4) - 3 + ~~((draft.true_cr - 1) / 5);
        draft.wis += between(3, 5) + ~~((draft.true_cr - 1) / 3);
        draft.cha += between(0, 2) + ~~((draft.true_cr - 1) / 5);
        // Skills
        draft.skill('rel');
        const skills = shuffle(['his', 'ins', 'med', 'per']);
        repeatFn(() => draft.skill(skills.pop()), (draft.true_cr - 1) / 4 + 1, 3);
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
        // Armor and Equipment
        let armor = ['Padded Armor', 'Leather Armor', 'Studded Leather Armor', 'Hide Armor', 'Chain Shirt', 'Ring Mail'];
        if (draft.cr > 1)
            armor = ['Ring Mail', 'Chain Shirt', 'Scale Mail', 'Breastplate', 'Half Plate Armor'];
        if (draft.cr > 3)
            armor = ['Half Plate Armor', 'Chain Mail', 'Splint Armor', 'Plate Armor'];
        await draft.armor(armor);
        if (seeder.rnd() > 0.5)
            await draft.item('Shield');
        // Weapons
        let weaponList = ['Club', 'Mace', 'Light Hammer'];
        if (draft.cr > 0.25)
            weaponList = ['Club', 'Mace', 'Light Hammer', 'Warhammer'];
        const weapon = await draft.weapon(draft.pickFavoredWeapon(weaponList));
        // Multiattack
        // The multiattack is set even with one attack, to trigger multiattack in case the creature has Bite
        const strikes = 1 + +(draft.cr > 0.5);
        draft.multiattack(Array(strikes).fill(weapon));
        // Special Equipment
        // Besides the weapons, none
        // Spellcasting
        let spellcaster_level = 1;
        if (draft.cr > 0.25)
            spellcaster_level += draft.true_cr - 1 + between(0, 2);
        spellcaster_level -= ~~((draft.true_cr - 1) / 3);
        spellcaster_level = draft.limitCasterLevel(spellcaster_level);
        await draft.setSpellcaster('cleric', spellcaster_level);
        // Cantrips
        const cantrips = 3 + +(spellcaster_level > 3) + +(spellcaster_level > 9);
        // Spells
        const spells_primary = {
            0: shuffle(['Sacred Flame', 'Toll the Dead', 'Word of Radiance', 'Guidance', 'Light']),
            1: shuffle([
                'Bane',
                'Bless',
                'Command',
                'Cure Wounds',
                'Guiding Bolt',
                'Healing Word',
                'Inflict Wounds',
                'Purify Food and Drink',
                'Sanctuary',
                'Shield of Faith',
            ]),
            2: shuffle([
                'Aid',
                'Blindness/Deafness',
                'Hold Person',
                'Prayer of Healing',
                'Silence',
                'Spiritual Weapon',
                'Warding Bond',
            ]),
            3: shuffle([
                'Aura of Vitality',
                'Beacon of Hope',
                'Bestow Curse',
                'Dispel Magic',
                'Fast Friends',
                'Incite Greed',
                'Life Transference',
                'Mass Healing Word',
                'Spirit Guardians',
                'Spirit Shroud',
            ]),
            4: shuffle(['Aura of Life', 'Banishment', 'Death Ward', 'Guardian of Faith']),
            5: shuffle(['Contagion', 'Dawn', 'Flame Strike', 'Insect Plague', 'Mass Cure Wounds', 'Summon Celestial']),
            6: shuffle(['Blade Barrier', 'Harm', 'Heal', 'Sunbeam']),
            7: shuffle(['Conjure Celestial', 'Divine Word', 'Fire Storm', 'Regenerate']),
            8: shuffle(['Antimagic Field', 'Earthquake', 'Holy Aura', 'Sunburst']),
            9: shuffle(['Gate', 'Mass Heal', 'Power Word Heal']),
        };
        const spells_utility = {
            0: shuffle(['Mending', 'Resistance', 'Spare the Dying', 'Thaumaturgy']),
            1: shuffle([
                'Ceremony',
                'Create or Destroy Water',
                'Detect Evil and Good',
                'Detect Magic',
                'Detect Poison and Disease',
                'Protection from Evil and Good',
            ]),
            2: shuffle([
                'Augury',
                'Borrowed Knowledge',
                'Calm Emotions',
                'Continual Flame',
                'Enhance Ability',
                'Find Traps',
                'Gentle Repose',
                'Lesser Restoration',
                'Locate Object',
                'Protection from Poison',
                'Zone of Truth',
            ]),
            3: shuffle([
                'Animate Dead',
                'Clairvoyance',
                'Create Food and Water',
                'Daylight',
                'Feign Death',
                'Glyph of Warding',
                'Magic Circle',
                'Meld into Stone',
                'Motivational Speech',
                'Protection from Energy',
                'Remove Curse',
                'Revivify',
                'Sending',
                'Speak with Dead',
                'Tongues',
                'Water Walk',
            ]),
            4: shuffle([
                'Aura of Purity',
                'Control Water',
                'Divination',
                'Freedom of Movement',
                'Locate Creature',
                'Stone Shape',
            ]),
            5: shuffle([
                'Commune',
                'Dispel Evil and Good',
                'Geas',
                'Greater Restoration',
                'Hallow',
                'Holy Weapon',
                'Legend Lore',
                'Planar Binding',
                'Raise Dead',
                'Scrying',
            ]),
            6: shuffle([
                'Create Undead',
                'Find the Path',
                'Forbiddance',
                "Heroes' Feast",
                'Planar Ally',
                'True Seeing',
                'Word of Recall',
            ]),
            7: shuffle(['Etherealness', 'Plane Shift', 'Resurrection', 'Symbol', 'Temple of the Gods']),
            8: shuffle(['Control Weather']),
            9: shuffle(['Astral Projection', 'True Resurrection']),
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
        // None
    },
};
