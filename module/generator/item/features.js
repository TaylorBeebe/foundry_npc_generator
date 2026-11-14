import { ABILITIES } from '../npcdraft.js';
import { getActivity, updateDescription } from './item5e.js';
import { avgDmg, formulaReplace } from './weapons.js';
export const featureApply = {
    "Archer's Eye": (_draft, item, die) => {
        updateDescription(item, { die: '' + die });
        const activity = getActivity(item, 'utility');
        activity.roll.formula = `1d${die}`;
        item.flags.npcgen = { die };
    },
    Bite: (_draft, item, part) => {
        if (item.type !== 'weapon')
            throw new Error('Bite feature can only be applied to weapons');
        const avg_dmg = '{{~~(' + avgDmg(part[0], true) + ')}}', formula = formulaReplace(part[0], true), type = part[1];
        updateDescription(item, { avg_dmg, formula, type });
        item.system.damage.base.types = [part[1]];
        item.system.damage.base.custom = {
            enabled: true,
            formula: part[0],
        };
    },
    'Brutal Critical': (_draft, item, dice) => {
        updateDescription(item, { dice: '' + dice });
        item.effects[0].changes[0].value = '' + dice;
        item.flags.npcgen = { dice };
    },
    'Change Shape': (_draft, item, { description, uses = 0 }) => {
        item.system.description.value = description;
        if (uses) {
            item.system.uses.max = uses;
            item.system.uses.recovery[0] = {
                period: 'day',
                type: 'recoverAll',
            };
        }
    },
    'Cunning Action': (draft) => {
        draft.removeFeature('Aggressive');
        draft.removeFeature('Nimble Escape');
    },
    'Dwarven Resilience': (draft) => draft.resistance('poison'),
    'Duergar Resilience': (draft) => draft.resistance('poison'),
    'Fast Movement': (draft, item, speed) => {
        updateDescription(item, { speed });
        const movement = draft.data.system.attributes.movement;
        for (const type of ['walk', 'swim', 'climb', 'burrow', 'fly']) {
            if (movement[type])
                movement[type] += speed;
        }
    },
    Indomitable: (_draft, item, uses) => {
        item.system.uses.max = uses;
    },
    'Lay on Hands': (_draft, item, heal) => {
        item.system.uses.max = heal;
        updateDescription(item, { heal: '' + heal });
    },
    Lightfooted: (draft) => draft.removeFeature('Aggressive'),
    'Martial Advantage': (_draft, item, dice) => {
        updateDescription(item, { dices: '' + dice });
        const activity = getActivity(item, 'damage');
        activity.damage.parts[0].number = dice;
        item.flags.npcgen = { dices: dice };
    },
    Parry: (draft, item) => {
        const bonus = ~~(2 + draft.cr / 3);
        updateDescription(item, { ac_bonus: '' + bonus });
    },
    'Sneak Attack': (_draft, item, dice) => {
        updateDescription(item, { dice: '' + dice });
        const activity = getActivity(item, 'damage');
        activity.damage.parts[0].number = dice;
        item.flags.npcgen = { dice };
    },
    'Song of Rest': (_draft, item, die) => {
        updateDescription(item, { die: '' + die });
        const activity = getActivity(item);
        activity.healing.denomination = die;
        item.flags.npcgen = { die };
    },
    'Spell Resistance': (draft) => {
        draft.resistance('acid');
        draft.resistance('cold');
        draft.resistance('fire');
        draft.resistance('force');
        draft.resistance('lightning');
        draft.resistance('necrotic');
        draft.resistance('poison');
        draft.resistance('psychic');
        draft.resistance('radiant');
        draft.resistance('thunder');
    },
    'Suave Defense': (draft) => {
        draft.data.system.attributes.ac.calc = 'custom';
        draft.data.system.attributes.ac.formula = '@attributes.ac.armor + @attributes.ac.dex + @abilities.cha.mod';
        draft.data.system.attributes.ac._formula = (draft, { armor_bonus, dex_bonus }) => armor_bonus + dex_bonus + draft.mod('cha');
    },
    Survivor: (_draft, item, regen) => {
        updateDescription(item, { regen });
        item.flags.npcgen = { regen };
    },
    'Unarmed Strike': (_draft, item, die) => {
        if (item.type !== 'weapon')
            throw new Error('Unarmed Strike feature can only be applied to weapons');
        let formula = `1d${die} + @mod`;
        item.system.damage.base.custom = {
            enabled: true,
            formula,
        };
        const avg_dmg = '{{~~(' + avgDmg(formula, true) + ')}}';
        formula = formulaReplace(formula, true);
        updateDescription(item, { avg_dmg, formula });
    },
    'Unarmored Defense': (draft, item, { ability = 'wis', condition = 'wearing no armor and wielding no shield', } = {}) => {
        draft.data.system.attributes.ac.calc = 'custom';
        draft.data.system.attributes.ac.formula = `@attributes.ac.armor + @attributes.ac.dex + @abilities.${ability}.mod`;
        draft.data.system.attributes.ac._formula = (draft, { armor_bonus, dex_bonus }) => armor_bonus + dex_bonus + draft.mod(ability);
        updateDescription(item, { ability: ABILITIES[ability], condition });
    },
    'Unarmored Movement': (draft, item, speed) => {
        updateDescription(item, { speed });
        const movement = draft.data.system.attributes.movement;
        for (const type of ['walk', 'swim', 'climb', 'burrow', 'fly']) {
            if (movement[type])
                movement[type] += speed;
        }
    },
};
