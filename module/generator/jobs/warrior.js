import { between, seeder, shuffle, repeatFn } from '../../utils.js';
import { applyCommonerWeapon } from './commoner.js';
export const warrior = {
    name: 'warrior',
    tags: ['martial'],
    bio: { height_multiplier: 1.05 },
    treasure: 1,
    apply: async function (draft) {
        // Abilities
        draft.str += between(0, 2) + ~~((draft.true_cr - 1) / 2);
        draft.dex += between(0, 2) + ~~((draft.true_cr - 1) / 3);
        draft.con += between(0, 2) + ~~((draft.true_cr - 1) / 2);
        draft.int += between(0, 4) - 2 + ~~((draft.true_cr - 1) / 6);
        draft.wis += between(0, 4) - 2 + ~~((draft.true_cr - 1) / 6);
        draft.cha += between(0, 4) - 2 + ~~((draft.true_cr - 1) / 6);
        // Skills
        draft.skill('prc');
        const skills = shuffle(['acr', 'ath', 'ani', 'his', 'ins', 'itm', 'sur']);
        repeatFn(() => draft.skill(skills.pop()), (draft.true_cr - 1) / 4 + 1, 3);
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
        let armor = ['Padded Armor', 'Leather Armor', 'Studded Leather Armor', 'Hide Armor', 'Chain Shirt', 'Ring Mail'];
        if (draft.cr > 1)
            armor = ['Ring Mail', 'Chain Shirt', 'Scale Mail', 'Breastplate', 'Half Plate Armor'];
        if (draft.cr > 3)
            armor = ['Half Plate Armor', 'Chain Mail', 'Splint Armor', 'Plate Armor'];
        if (draft.cr > 6)
            armor = ['Plate Armor'];
        await draft.armor(armor);
        await draft.item('Shield');
        // Weapons
        let weaponList = ['Club', 'Spear', 'Handaxe', 'Scimitar', 'Mace', 'Shortsword', 'Trident'];
        const weaponList_superior = ['Longsword', 'Flail', 'Morningstar', 'Rapier', 'War Pick', 'Warhammer'];
        if (draft.cr > 0.25)
            weaponList = weaponList_superior;
        const weapon = await draft.weapon(draft.pickFavoredWeapon(weaponList));
        // Ranged Weapon
        if (draft.cr > 0.125) {
            let ranged = ['Javelin', 'Shortbow', 'Hand Crossbow', 'Light Crossbow', 'Net', 'Sling'];
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
        if (draft.cr > 0.25)
            await draft.feature('Parry');
        if (draft.cr > 2) {
            if (seeder.rnd() > 0.5)
                await draft.feature('Leadership (Recharges after a Short or Long Rest)');
            else
                await draft.feature('Taunt');
        }
        if (draft.cr > 4)
            await draft.feature('Shield Bash');
        if (draft.cr > 8)
            await draft.feature('Indomitable', 2 + +(draft.cr > 11));
    },
};
