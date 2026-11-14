import { pick, repeatFn, shuffle } from '../../utils.js';
import { applyCommonerWeapon } from './commoner.js';
export const thief = {
    name: 'thief',
    tags: ['charismatic'],
    alignment: ['N', 'NE', 'CN', 'CE'],
    bio: { height_multiplier: 0.95 },
    treasure: 1.5,
    apply: async function (draft) {
        // Abilities
        draft.str += ~~((draft.true_cr - 1) / 6);
        draft.dex += 4 + ~~((draft.true_cr - 1) / 2.5);
        draft.con += 2 + ~~((draft.true_cr - 1) / 4);
        draft.int += ~~((draft.true_cr - 1) / 6);
        draft.wis += ~~((draft.true_cr - 1) / 6);
        draft.cha += ~~((draft.true_cr - 1) / 3);
        // Skills
        draft.skill('slt');
        const skills = shuffle(['acr', 'per', 'ins', 'dec', 'his', 'ste', 'prc', 'prf']);
        repeatFn(() => draft.skill(skills.pop()), (draft.true_cr - 1) / 3 + 1, 4);
        // If the NPC is a Commoner
        if (draft.cr === 0) {
            await applyCommonerWeapon(draft);
            return;
        }
        // Saves
        if (draft.cr > 1)
            draft.save('dex');
        if (draft.cr > 3)
            draft.save('int');
        draft.language('cant');
        for (let i = draft.int; i > 13; i -= 2)
            draft.language(pick(['undercommon', 'dwarvish', 'elvish', 'draconic', 'orc', 'infernal']));
        // Armor and Equipment
        let armor = 'Leather Armor';
        if (draft.cr > 1)
            armor = 'Studded Leather Armor';
        await draft.armor(armor);
        // Weapons
        let weaponList = ['Dagger', 'Shortsword', 'Rapier', 'Scimitar', 'Whip'];
        const weapon = draft.pickFavoredWeapon(weaponList);
        const weapon_item = (await draft.weapon(weapon));
        // Multiattack
        // The multiattack is set even with one attack, to trigger multiattack in case the creature has Bite
        const strikes = ~~((draft.true_cr - 1 + 5) / 4);
        draft.multiattack(Array(strikes).fill(weapon_item));
        // Ranged Weapon
        let ranged = draft.pickFavoredWeapon(['Hand Crossbow', 'Light Crossbow', 'Shortbow', 'Longbow', 'Sling']);
        await draft.weapon(ranged);
        // Special Equipment
        // Besides the weapons, none
        // Features
        const sneak_attack = ~~(draft.cr / 3 + 1) * 2;
        if (draft.cr > 0.125)
            await draft.feature('Sneak Attack', sneak_attack);
        if (draft.cr > 0.5)
            await draft.feature('Cunning Action');
        if (draft.cr > 2)
            await draft.feature('Uncanny Dodge');
        if (draft.cr > 4)
            await draft.feature('Evasion');
    },
};
