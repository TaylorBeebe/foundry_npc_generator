export const bugbear = {
    name: 'bugbear',
    cr: '1/2',
    bio: {
        age: {
            min: 15,
            max: 70,
        },
        hair: ['Dark brown', 'Light brown', 'Red'],
        skin: ['Yellow', 'Light brown', 'Reddish brown'],
        eyes: ['Yellow', 'Orange', 'Red', 'Brown', 'Greenish white'],
        height: {
            average: 7,
            deviation: 0.3,
            minimum: 3,
        },
        weight: {
            average: 250,
            deviation: 7,
            minimum: 80,
        },
    },
    apply: async function (draft) {
        draft.str += 2;
        draft.dex++;
        draft.skill('ste');
        const data = draft.data;
        data.system.attributes.senses.darkvision = 60;
        data.system.details.type.subtype = 'goblinoid';
        data.system.traits.languages.value = ['common', 'goblin'];
        await draft.feature('Brute');
        await draft.feature('Surprise Attack');
    },
};
