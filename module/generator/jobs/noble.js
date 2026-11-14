import { pick, numberExtense, seeder, shuffle, repeatFn, getItemName } from '../../utils.js';
import { replaceUnarmedStrikeDescription } from './commoner.js';
export const noble = {
    name: 'noble',
    tags: ['rich', 'scholar', 'aristocrat'],
    alignment: ['LG', 'LN', 'LE', 'NG', 'N', 'NE'],
    bio: { age_job_bias: 1 },
    treasure: 2,
    treasure_extra: 2000,
    apply: async function (draft) {
        // Abilities
        draft.str += ~~((draft.true_cr - 1) / 2);
        draft.dex += 1 + ~~((draft.true_cr - 1) / 2);
        draft.con += ~~((draft.true_cr - 1) / 2);
        draft.int += 1 + ~~((draft.true_cr - 1) / 4);
        draft.wis += 3 + ~~((draft.true_cr - 1) / 4);
        draft.cha += 5 + ~~((draft.true_cr - 1) / 4);
        // Skills
        const skills = shuffle(['per', 'prc', 'dec', 'ins', 'his', 'inv']);
        repeatFn(() => draft.skill(skills.pop()), (draft.true_cr - 1) / 4 + 2, 4);
        draft.skill('per');
        draft.skill('dec');
        draft.skill('ins');
        if (draft.cr > 2)
            draft.skill('his');
        // If the NPC is a Commoner
        if (draft.cr === 0) {
            const weapon = await draft.weapon(pick(['Unarmed Strike', 'Dagger']));
            if (getItemName(weapon) === 'Unarmed Strike')
                replaceUnarmedStrikeDescription(weapon);
            return;
        }
        // Saves
        if (draft.cr > 1)
            draft.save('wis');
        if (draft.cr > 3)
            draft.save('cha');
        // Languages
        draft.language('common');
        // Armor and Equipment
        let armor = ['Studded Leather Armor', 'Chain Shirt', 'Breastplate'];
        if (draft.cr > 2)
            armor = ['Breastplate', 'Half Plate Armor'];
        await draft.armor(shuffle(armor));
        // Weapons
        const weapons = ['Dagger', 'Rapier'];
        const magic_bonus = Math.min(~~(draft.cr / 4), 3);
        const magic_bonus_str = magic_bonus ? ' +' + magic_bonus : '';
        const magicDaggers = ['Destiny', 'Barb', 'Scar'];
        const magicRapiers = ['Echo', 'Needle', 'Winterthorn'];
        const dagger = await draft.weapon(weapons[0] + magic_bonus_str);
        const rapier = await draft.weapon(weapons[1] + magic_bonus_str);
        if (magic_bonus) {
            dagger.name = pick(magicDaggers);
            rapier.name = pick(magicRapiers);
        }
        // Multiattack
        const rapier_strikes = ~~((draft.true_cr - 1 + 5) / 4);
        if (draft.cr > 0.25) {
            draft.multiattack([dagger, ...Array(rapier_strikes).fill(rapier)]);
            draft.multiattacks.desc = `{{name}} makes ${numberExtense(rapier_strikes + 1)} attacks: ${numberExtense(rapier_strikes)} with its rapier and one with its dagger.`;
        }
        // Special Equipment
        // Besides the weapons, none
        if (magic_bonus)
            draft.specialEquipment = `<p>{{name}} wields <b>${rapier.name}</b> <i>(rapier +${magic_bonus})</i> and <b>${dagger.name}</b> <i>(dagger +${magic_bonus})</i>, two magical weapons.</p>`;
        // Features
        await draft.feature('Parry');
        if (draft.cr > 1) {
            if (seeder.rnd() > 0.5)
                await draft.feature('Leadership (Recharges after a Short or Long Rest)');
            else
                await draft.feature('Taunt');
        }
    },
};
