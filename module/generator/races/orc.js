export const orc = {
    name: 'orc',
    tags: ['underground'],
    cr: '1/4',
    bio: {
        age: {
            min: 12,
            max: 50,
        },
        skin: ['Pale', 'Gray', 'Dark gray', 'Greenish gray', 'Reddish gray'],
        eyes: ['Black'],
        height: {
            average: 6.2,
            deviation: 0.4,
            minimum: 3.5,
        },
        weight: {
            average: 250,
            deviation: 6,
            minimum: 50,
        },
    },
    apply: async function (draft) {
        draft.str += 2;
        draft.int -= 2;
        const data = draft.data;
        data.system.attributes.senses.darkvision = 60;
        data.system.details.type.subtype = 'orc';
        data.system.traits.languages.value = ['common', 'orc'];
        await draft.feature('Aggressive');
    },
};
