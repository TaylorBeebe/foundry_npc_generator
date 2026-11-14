import { between, shuffle, repeatFn, pick, seeder } from '../../utils.js';
import { applyCommonerRangedWeapon, applyCommonerWeapon } from './commoner.js';
export const archer = {
    name: 'archer',
    treasure: 1,
    apply: async function (draft) {
        // Abilities
        draft.str += between(0, 2) + ~~((draft.true_cr - 1) / 6);
        draft.dex += between(3, 5) + ~~((draft.true_cr - 1) / 2);
        draft.con += between(1, 4) + ~~((draft.true_cr - 1) / 3);
        draft.int += between(0, 4) - 2 + ~~((draft.true_cr - 1) / 6);
        draft.wis += between(0, 4) + ~~((draft.true_cr - 1) / 6);
        draft.cha += between(0, 4) - 2 + ~~((draft.true_cr - 1) / 6);
        // Skills
        draft.skill('prc');
        const skills = shuffle(['acr', 'ath', 'sur', 'nat', 'ste']);
        repeatFn(() => draft.skill(skills.pop()), (draft.true_cr - 1) / 3 + 1, 3);
        // If the NPC is a Commoner
        if (draft.cr === 0) {
            await applyCommonerWeapon(draft);
            if (seeder.rnd() > 0.5)
                await applyCommonerRangedWeapon(draft);
            return;
        }
        // Saves
        if (draft.cr > 1)
            draft.save('dex');
        if (draft.cr > 3)
            draft.save('con');
        // Armor and Equipment
        let armor = ['Padded Armor', 'Leather Armor', 'Studded Leather Armor'];
        if (draft.cr > 1)
            armor = ['Studded Leather Armor'];
        await draft.armor(pick(armor));
        // Weapons
        const weaponList = ['Shortsword', 'Dagger'];
        await draft.weapon(draft.pickFavoredWeapon(weaponList));
        // Ranged Weapon
        let rangedList = ['Shortbow'];
        if (draft.cr > 0.125)
            rangedList = ['Shortbow', 'Longbow'];
        const ranged = await draft.weapon(draft.pickFavoredWeapon(rangedList));
        // Multiattack
        // The multiattack is set even with one attack, to trigger multiattack in case the creature has Bite
        const strikes = ~~((draft.true_cr - 1 + 8) / 5);
        draft.multiattack(Array(strikes).fill(ranged));
        // Special Equipment
        // Besides the weapons, none
        // Features
        await draft.feature('Keen Hearing and Sight');
        if (draft.cr > 0.5) {
            const die = 8 + 2 * +(draft.cr > 2);
            await draft.feature("Archer's Eye", die);
        }
        if (draft.cr > 3)
            await draft.feature('Archery');
        if (draft.cr > 8)
            await draft.feature('Indomitable', 2 + +(draft.cr > 11));
    },
};
