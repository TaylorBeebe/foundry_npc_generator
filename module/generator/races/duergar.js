import { menu as names } from '../../names.js';
import { pick } from '../../utils.js';
export const duergar = {
    name: 'duergar',
    tags: ['underground'],
    languages: [names.All.Fantasy.ForgottenRealms.Duergar, names.All.Fantasy.Generic.Duergar],
    favoredWeapons: ['Battleaxe', 'War Pick', 'Light Hammer', 'Warhammer'],
    bio: {
        age: {
            min: 50,
            max: 500,
        },
        hair: ['Bald'],
        skin: ['Ash gray'],
        eyes: ['Black'],
        height: {
            average: 4,
            deviation: 0.2,
        },
        weight: {
            average: 100,
            deviation: 4,
        },
    },
    apply: async function (draft) {
        const rnd = pick([0, 2]); // Increase either Str or Wisdom by 2
        draft.str += rnd;
        draft.wis += 2 - rnd;
        draft.con += 2;
        const data = draft.data;
        data.system.attributes.movement.walk = 25;
        data.system.attributes.senses.darkvision = 120;
        data.system.details.type.subtype = 'dwarf';
        data.system.traits.languages.value = ['undercommon', 'dwarvish'];
        await draft.feature('Duergar Resilience');
        await draft.feature('Sunlight Sensitivity');
        await draft.feature('Enlarge (Recharges after a Short or Long Rest)');
        await draft.feature('Invisibility (Recharges after a Short or Long Rest)');
    },
};
