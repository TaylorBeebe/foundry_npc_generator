import { pick, numberExtense, shuffle, repeatFn } from '../../utils.js';
import { applyCommonerWeapon } from './commoner.js';
export const swashbuckler = {
    name: 'swashbuckler',
    tags: ['charismatic', 'scholar'],
    alignment: ['LG', 'LN', 'LE', 'NG', 'N', 'NE'],
    treasure: 1.5,
    apply: async function (draft) {
        // Abilities
        draft.str += 1 + ~~((draft.true_cr - 1) / 5);
        draft.dex += 4 + ~~((draft.true_cr - 1) / 2);
        draft.con += 1 + ~~((draft.true_cr - 1) / 5);
        draft.int += 2 + ~~((draft.true_cr - 1) / 3);
        draft.wis += ~~((draft.true_cr - 1) / 4);
        draft.cha += 3 + ~~((draft.true_cr - 1) / 2);
        // Skills
        draft.skill('acr');
        const skills = shuffle(['per', 'ins', 'dec', 'his', 'ste', 'slt', 'prc', 'prf']);
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
        // Armor and Equipment
        let armor = 'Leather Armor';
        if (draft.cr > 3)
            armor = 'Studded Leather Armor';
        await draft.armor(armor);
        // Weapons
        const weapons = ['Dagger', 'Rapier'];
        const magic_bonus = Math.min(3, ~~((draft.cr - 2) / 4));
        const magic_bonus_str = magic_bonus ? ' +' + magic_bonus : '';
        const magicDaggers = ['Destiny', 'Barb', 'Scar'];
        const magicRapiers = ['Echo', 'Needle', 'Winterthorn'];
        const rapier = await draft.weapon(weapons[1] + magic_bonus_str);
        const dagger = await draft.weapon(weapons[0] + magic_bonus_str);
        if (magic_bonus) {
            dagger.name = pick(magicDaggers);
            rapier.name = pick(magicRapiers);
        }
        // Multiattack
        const rapier_strikes = ~~((draft.true_cr - 1 + 5) / 4);
        if (draft.cr > 0.125) {
            draft.multiattack([dagger, ...Array(rapier_strikes).fill(rapier)]);
            draft.multiattacks.desc = `{{name}} makes ${numberExtense(rapier_strikes + 1)} attacks: ${numberExtense(rapier_strikes)} with its rapier and one with its dagger.`;
        }
        // Special Equipment
        // Besides the weapons, none
        if (magic_bonus)
            draft.specialEquipment = `<p>{{name}} wields <b>${rapier.name}</b> <i>(rapier +${magic_bonus})</i> and <b>${dagger.name}</b> <i>(dagger +${magic_bonus})</i>, two magical weapons.</p>`;
        // Features
        await draft.feature('Suave Defense');
        if (draft.cr > 0.5)
            await draft.feature('Lightfooted');
        if (draft.cr > 3)
            await draft.feature('Uncanny Dodge');
        if (draft.cr > 5)
            await draft.feature('Evasion');
    },
};
