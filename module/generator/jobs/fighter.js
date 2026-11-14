import { between, seeder, shuffle, repeatFn } from '../../utils.js';
import { applyCommonerWeapon } from './commoner.js';
export const fighter = {
    name: 'fighter',
    tags: ['martial'],
    treasure: 1,
    apply: async function (draft) {
        // Abilities
        draft.str += between(2, 4) + ~~((draft.true_cr - 1) / 3);
        draft.dex += between(0, 2) + ~~((draft.true_cr - 1) / 3);
        draft.con += between(0, 2) + ~~((draft.true_cr - 1) / 2);
        draft.int += between(0, 4) - 2 + ~~((draft.true_cr - 1) / 6);
        draft.wis += between(0, 4) - 2 + ~~((draft.true_cr - 1) / 6);
        draft.cha += between(0, 4) - 2 + ~~((draft.true_cr - 1) / 6);
        // Skills
        draft.skill('ath');
        const skills = shuffle(['acr', 'ani', 'his', 'ins', 'itm', 'prc', 'sur']);
        repeatFn(() => draft.skill(skills.pop()), (draft.true_cr - 1) / 4 + 1, 3);
        // If the NPC is a Commoner
        if (draft.cr === 0) {
            await applyCommonerWeapon(draft);
            return;
        }
        // Saves
        if (draft.cr > 1)
            draft.save('con');
        if (draft.cr > 3)
            draft.save('str');
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
            await draft.feature('Second Wind');
        if (draft.cr > 1) {
            if (seeder.rnd() > 0.5)
                await draft.feature('Attacker');
            else
                await draft.feature('Protection');
        }
        if (draft.cr > 3)
            await draft.feature('Battle Readiness');
        if (draft.cr > 5)
            await draft.feature('Improved Critical');
        if (draft.cr > 8)
            await draft.feature('Indomitable', 2 + +(draft.cr > 11));
    },
};
