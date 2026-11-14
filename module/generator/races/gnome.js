import { pick, seeder } from '../../utils.js';
export const gnome = {
    name: 'gnome',
    tags: ['underground'],
    alignment: ['LG', 'NG', 'CG', 'LN', 'N', 'CN'],
    bio: {
        age: {
            min: 40,
            max: 500,
        },
        hair: ['Gliterring opaque blue', 'Gliterring opaque black'],
        skin: ['Pale', 'Ruddy tan', 'Woody brown', 'Rocky gray'],
        height: {
            average: 3.5,
            deviation: 0.2,
            minimum: 1.5,
        },
        weight: {
            average: 43,
            deviation: 2,
            minimum: 15,
        },
    },
    apply: async function (draft) {
        const rnd = pick([0, 2]);
        draft.dex += rnd;
        draft.con += 2 - rnd;
        draft.int += 2;
        const data = draft.data;
        data.system.attributes.senses.darkvision = 60;
        data.system.attributes.movement.walk = 25;
        data.system.traits.size = 'sm';
        data.system.details.type.subtype = 'gnome';
        data.system.traits.languages.value = ['common', 'gnomish'];
        await draft.feature('Gnome Cunning');
        if (seeder.rnd() > 0.5)
            await draft.innate('Minor Illusion');
    },
};
