import { menu as names } from '../../names.js';
import { pick } from '../../utils.js';
export const dwarf = {
    name: 'dwarf',
    tags: ['underground'],
    languages: [names.All.Fantasy.ForgottenRealms.Dwarf, names.All.Fantasy.Generic.Dwarf],
    favoredWeapons: ['Battleaxe', 'Handaxe', 'Light Hammer', 'Warhammer'],
    bio: {
        age: {
            min: 50,
            max: 500,
        },
        hair: ['Bald', 'Black', 'Brown', 'Gray', 'Red', 'White'],
        skin: ['Pale', 'Light Brown', 'Tanned', 'Goldish brown', 'White', 'Icy blue'],
        eyes: ['Brown', 'Hazel', 'Green', 'Silvery blue'],
        height: {
            average: 4.5,
            deviation: 0.2,
        },
        weight: {
            average: 120,
            deviation: 6,
        },
    },
    apply: async function (draft) {
        const rnd = pick([0, 2]); // Increase either Str or Wisdom by 2
        draft.str += rnd;
        draft.wis += 2 - rnd;
        draft.con += 2;
        const data = draft.data;
        data.system.attributes.movement.walk = 25;
        data.system.attributes.senses.darkvision = 60;
        data.system.details.type.subtype = 'dwarf';
        data.system.traits.languages.value = ['common', 'dwarvish'];
        await draft.feature('Dwarven Resilience');
    },
};
