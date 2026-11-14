import { between, shuffle, seeder, repeatFn } from '../../utils.js';
import { applyCommonerWeapon } from './commoner.js';
import { removeEvilSpellsIfNotEvil } from '../item/spells.js';
export const paladin = {
    name: 'paladin',
    tags: ['religious', 'martial'],
    alignment: ['LG', 'LN', 'NG', 'N'],
    bio: {
        age_job_bias: 0.5,
        height_multiplier: 1.05,
    },
    treasure: 1.5,
    apply: async function (draft) {
        // Abilities
        draft.str += between(2, 4) + ~~((draft.true_cr - 1) / 2.25);
        draft.dex += between(0, 2) + ~~((draft.true_cr - 1) / 6);
        draft.con += between(0, 2) + ~~((draft.true_cr - 1) / 3);
        draft.int += between(0, 5) - 3 + ~~((draft.true_cr - 1) / 6);
        draft.wis += between(0, 5) - 3 + ~~((draft.true_cr - 1) / 6);
        draft.cha += between(0, 4) + ~~((draft.true_cr - 1) / 2.5);
        // Skills
        const skills = shuffle(['ath', 'ins', 'itm', 'med', 'per', 'rel', 'prc']);
        repeatFn(() => draft.skill(skills.pop()), (draft.true_cr - 1) / 4 + 2, 4);
        // If the NPC is a Commoner
        if (draft.cr === 0) {
            await applyCommonerWeapon(draft);
            return;
        }
        // Saves
        if (draft.cr > 1)
            draft.save('str');
        if (draft.cr > 3)
            draft.save('con');
        // Armor and Equipment
        let armor = ['Chain Shirt', 'Ring Mail', 'Scale Mail'];
        if (draft.cr > 1)
            armor = ['Ring Mail', 'Chain Shirt', 'Scale Mail', 'Breastplate', 'Half Plate Armor'];
        if (draft.cr > 3)
            armor = ['Half Plate Armor', 'Chain Mail', 'Splint Armor', 'Plate Armor'];
        if (draft.cr > 6)
            armor = ['Plate Armor'];
        await draft.armor(armor);
        await draft.item('Shield');
        // Weapons
        let weaponList = ['Mace', 'Light Hammer', 'Sickle', 'Trident'];
        const weaponList_superior = ['Longsword', 'Flail', 'Morningstar', 'Rapier', 'War Pick', 'Warhammer'];
        if (draft.cr > 0.25)
            weaponList = weaponList_superior;
        const weapon = await draft.weapon(draft.pickFavoredWeapon(weaponList));
        // Ranged Weapon
        if (draft.cr > 0.125) {
            let ranged = ['Shortbow', 'Hand Crossbow', 'Light Crossbow'];
            if (draft.cr > 1)
                ranged = ['Shortbow', 'Longbow', 'Light Crossbow', 'Heavy Crossbow'];
            await draft.weapon(draft.pickFavoredWeapon(ranged));
        }
        // Multiattack
        // The multiattack is set even with one attack, to trigger multiattack in case the creature has Bite
        const strikes = ~~((draft.true_cr - 1 + 7) / 5);
        draft.multiattack(Array(strikes).fill(weapon));
        // Special Equipment
        // Besides the weapons, none
        // Features
        if (draft.cr > 2)
            await draft.feature('Leadership (Recharges after a Short or Long Rest)');
        // Spellcasting
        let spellcaster_level = 1;
        if (draft.cr > 0.5)
            spellcaster_level = draft.true_cr - 1 + between(0, 2);
        if (draft.cr > 3)
            spellcaster_level = draft.true_cr - 1 + between(0, 4);
        spellcaster_level = draft.limitCasterLevel(spellcaster_level);
        await draft.feature('Lay on Hands', spellcaster_level * 5);
        if (spellcaster_level < 2)
            return;
        await draft.setSpellcaster('paladin', spellcaster_level);
        const spells_primary = {
            1: shuffle([
                'Bless',
                'Command',
                'Compelled Duel',
                'Cure Wounds',
                'Divine Favor',
                'Searing Smite',
                'Shield of Faith',
                'Thunderous Smite',
                'Wrathful Smite',
            ]),
            2: shuffle(['Aid', 'Branding Smite', 'Magic Weapon', 'Warding Bond']),
            3: shuffle(['Aura of Vitality', 'Blinding Smite', "Crusader's Mantle", 'Elemental Weapon', 'Spirit Shroud']),
            4: shuffle(['Aura of Life', 'Banishment', 'Staggering Smite']),
            5: shuffle(['Banishing Smite', 'Circle of Power', 'Destructive Wave', 'Holy Weapon', 'Summon Celestial']),
        };
        const spells_utility = {
            1: shuffle([
                'Ceremony',
                'Detect Evil and Good',
                'Detect Magic',
                'Detect Poison and Disease',
                'Heroism',
                'Protection from Evil and Good',
                'Purify Food and Drink',
            ]),
            2: shuffle([
                'Find Steed',
                'Gentle Repose',
                'Lesser Restoration',
                'Locate Object',
                'Prayer of Healing',
                'Protection from Poison',
                'Zone of Truth',
            ]),
            3: shuffle(['Create Food and Water', 'Daylight', 'Dispel Magic', 'Magic Circle', 'Remove Curse', 'Revivify']),
            4: shuffle(['Aura of Purity', 'Death Ward', 'Find Greater Steed', 'Locate Creature']),
            5: shuffle(['Dispel Evil and Good', 'Geas', 'Raise Dead']),
        };
        removeEvilSpellsIfNotEvil(draft, [spells_primary, spells_utility]);
        const max_level = draft.spellcasting.spellSlots.indexOf(0);
        const spell_slots = [...draft.spellcasting.spellSlots];
        const total_spell_slots = spell_slots.reduce((a, b) => a + b);
        const spells_prepared = draft.mod('cha') + ~~(spellcaster_level / 2);
        const additional_spells = spells_prepared - total_spell_slots;
        for (let i = 0; i < additional_spells; i++) {
            const slot = ~~(seeder.rnd() ** 3 * (max_level - 1) + 1 + 0.5);
            spell_slots[slot - 1]++;
        }
        const spells_drawn = [0, ...spell_slots];
        await draft.draftSpellList(spells_primary, spells_utility, spells_drawn);
    },
};
