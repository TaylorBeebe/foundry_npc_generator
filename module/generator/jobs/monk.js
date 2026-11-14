import { repeatFn, seeder, shuffle } from '../../utils.js';
import { applyCommonerWeapon } from './commoner.js';
export const monk = {
    name: 'monk',
    alignment: ['LG', 'LN', 'LE', 'NG', 'N', 'NE'],
    bio: { age_job_bias: 2 },
    treasure: 0.75,
    apply: async function (draft) {
        // Abilities
        draft.str += 1 + ~~((draft.true_cr - 1) / 5);
        draft.dex += 4 + ~~((draft.true_cr - 1) / 2);
        draft.con += 1 + ~~((draft.true_cr - 1) / 5);
        draft.int += ~~((draft.true_cr - 1) / 4);
        draft.wis += 3 + ~~((draft.true_cr - 1) / 2);
        draft.cha += ~~((draft.true_cr - 1) / 4);
        // Skills
        const skills = shuffle(['prc', 'acr', 'ath', 'his', 'rel', 'ste', 'ins']);
        repeatFn(() => draft.skill(skills.pop()), (draft.true_cr - 1) / 4 + 2, 4);
        // If the NPC is a Commoner
        if (draft.cr === 0) {
            await applyCommonerWeapon(draft);
            return;
        }
        // Saves
        if (draft.cr > 1)
            draft.save('dex');
        if (draft.cr > 3)
            draft.save('str');
        if (draft.cr > 8) {
            draft.save('con');
            draft.save('int');
            draft.save('wis');
            draft.save('cha');
        }
        // Armor and Equipment
        // None
        // Weapons
        const die = Math.min(4 + ~~((draft.true_cr - 1 + 3) / 4) * 2, 12);
        const weapon = await draft.feature('Unarmed Strike', die);
        if (draft.cr > 0.125 && seeder.rnd() > 0.5) {
            let ranged = ['Sling', 'Dart'];
            if (draft.cr > 1)
                ranged = ['Shortbow', 'Longbow', 'Sling', 'Dart'];
            await draft.weapon(draft.pickFavoredWeapon(ranged));
        }
        // Multiattack
        const strikes = ~~((draft.true_cr - 1 + 6) / 4);
        draft.multiattack(Array(strikes).fill(weapon));
        // Special Equipment
        // Besides the weapons, none
        // Features
        await draft.feature('Unarmored Defense');
        const speed = ~~((draft.true_cr - 1 + 6) / 4) * 5;
        if (speed > 5)
            await draft.feature('Unarmored Movement', speed);
        if (draft.cr > 5)
            await draft.feature('Evasion');
    },
};
