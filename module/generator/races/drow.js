import { menu as names } from '../../names.js';
export const drow = {
    name: 'drow',
    tags: ['underground'],
    alignment: ['LN', 'LE', 'N', 'NE', 'CN', 'CE'],
    languages: [names.All.Fantasy.ForgottenRealms.Drow, names.All.Fantasy.Generic.Elven],
    favoredWeapons: ['Shortsword', 'Hand Crossbow', 'Rapier'],
    bio: {
        age: {
            min: 100,
            max: 750,
        },
        hair: ['White', 'Gray'],
        skin: ['Black', 'Dark blue', 'Gray'],
        eyes: ['Red', 'Lavender', 'Blue', 'Purple', 'Amber'],
        height: {
            average: 5.2,
            deviation: 0.2,
        },
        weight: {
            average: 100,
            deviation: 4,
        },
    },
    apply: async function (draft) {
        draft.dex += 2;
        draft.cha++;
        draft.skill('prc');
        const data = draft.data;
        data.system.attributes.senses.darkvision = 120;
        data.system.details.type.subtype = 'elf';
        data.system.traits.languages.value = ['undercommon', 'elvish'];
        await draft.feature('Fey Ancestry');
        await draft.feature('Sunlight Sensitivity');
        await draft.innate('Dancing Lights');
        await draft.innate('Darkness', { max: 1, period: 'day' });
        await draft.innate('Faerie Fire', { max: 1, period: 'day' });
    },
};
