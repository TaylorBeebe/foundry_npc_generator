import { between, findItem, pick, repeatFn, shuffle } from '../../utils.js';
import { races } from '../races.js';
import { applyCommonerWeapon } from './commoner.js';
export const berserker = {
    name: 'berserker',
    tags: ['martial'],
    alignment: ['CG', 'CN', 'CE'],
    bio: { age_job_bias: -1, height_multiplier: 1.05 },
    treasure: 0.5,
    apply: async function (draft) {
        const dwarven = [races.dwarf, races.duergar].includes(draft.race), elvish = [races.drow, races.elf].includes(draft.race);
        // Abilities
        draft.str += 3 + ~~((draft.true_cr - 1) / 2);
        draft.dex += ~~((draft.true_cr - 1) / 3);
        draft.con += 3 + ~~((draft.true_cr - 1) / 2.5);
        draft.int += -between(0, 4) + ~~((draft.true_cr - 1) / 3);
        draft.wis += ~~((draft.true_cr - 1) / 6);
        draft.cha += -between(2, 4) + ~~((draft.true_cr - 1) / 2);
        // Skills
        draft.skill('sur');
        const skills = shuffle(['ani', 'ath', 'itm', 'prc']);
        repeatFn(() => draft.skill(skills.pop()), (draft.true_cr - 1) / 4, 3);
        // If the NPC is a Commoner
        if (draft.cr === 0) {
            await applyCommonerWeapon(draft);
            return;
        }
        // Saves
        if (draft.cr > 1)
            draft.save('str');
        if (draft.cr > 2)
            draft.save('con');
        if (draft.cr > 7)
            draft.save('dex');
        // Armor and Equipment
        const naked = draft.mod('dex') + draft.mod('con') > 7;
        if (!naked) {
            let armor = ['Hide Armor'];
            if (elvish)
                armor = ['Studded Leather Armor'];
            if (draft.cr > 3)
                armor = ['Chain Shirt', 'Scale Mail', 'Breastplate'];
            if (draft.cr > 5)
                armor = ['Half Plate Armor'];
            if (dwarven && draft.cr > 1 && findItem('Spiked Armor', 'items'))
                armor = [findItem('Spiked Armor', 'items') ? 'Spiked Armor' : 'Half Plate Armor'];
            await draft.armor(armor);
        }
        // Weapons
        let weaponList = ['Club', 'Handaxe', 'Javelin'], weaponName = '', prefix = '', suffix = '';
        if (draft.cr > 0.125)
            weaponList = ['Spear', 'Greatclub'];
        if (draft.cr > 0.25)
            weaponList = ['Battleaxe', 'Greataxe', 'Greatsword', 'Pike', 'Maul', 'Halberd', 'War Pick'];
        const weapon = draft.pickFavoredWeapon(weaponList);
        if (draft.cr > 6) {
            if (['Greataxe', 'Battleaxe'].includes(weapon)) {
                prefix = 'Berserker ';
                weaponName = pick(['Ravager', 'Madaxe', 'Bloody', 'Defiller']);
                draft.specialEquipment = `<p>{{name}} wields the <b>${weaponName}</b>, a cursed ${weapon}.</p>`;
            }
            else {
                suffix = ' +1';
                weaponName = pick(['Razor', 'Vanquisher', 'Brimstone']);
                draft.specialEquipment = `<p>{{name}} wields the <b>${weaponName}</b>, a ${weapon + suffix}.</p>`;
            }
        }
        const weapon_item = (await draft.weapon(prefix + weapon + suffix));
        if (weaponName && weapon_item)
            weapon_item.name = weaponName;
        // Ranged Weapon
        if (draft.cr > 0.125) {
            let ranged = ['Javelin', 'Handaxe', 'Shortbow'];
            if (draft.cr > 3)
                ranged = ['Shortbow'];
            await draft.weapon(draft.pickFavoredWeapon(ranged));
        }
        // Multiattack
        // The multiattack is set even with one attack, to trigger multiattack in case the creature has Bite
        const strikes = ~~((draft.true_cr - 1 + 9) / 6);
        draft.multiattack(Array(strikes).fill(weapon_item));
        // Special Equipment
        // Besides the weapons, none
        // Features
        await draft.feature('Reckless');
        if (naked)
            await draft.feature('Unarmored Defense', { ability: 'con', condition: 'wearing no armor' });
        if (draft.cr > 2)
            await draft.feature('Fast Movement', 10);
        const brutal_dice = +(draft.cr > 3) + +(draft.cr > 7) + +(draft.cr > 11);
        if (brutal_dice)
            await draft.feature('Brutal Critical', brutal_dice);
    },
};
