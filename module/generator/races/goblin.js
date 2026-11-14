export const goblin = {
    name: 'goblin',
    bio: {
        age: {
            min: 8,
            max: 60,
        },
        hair: ['Dark brown', 'Light brown', 'Red'],
        skin: ['Yellow', 'Light brown', 'Reddish brown'],
        eyes: ['Yellow', 'Orange', 'Red', 'Brown', 'Greenish white'],
        height: {
            average: 4,
            deviation: 0.15,
            minimum: 2,
        },
        weight: {
            average: 60,
            deviation: 3,
            minimum: 20,
        },
    },
    apply: async function (draft) {
        draft.str -= 2;
        draft.dex += 2;
        const data = draft.data;
        data.system.attributes.senses.darkvision = 60;
        data.system.traits.size = 'sm';
        data.system.details.type.subtype = 'goblinoid';
        data.system.traits.languages.value = ['common', 'goblin'];
        await draft.feature('Nimble Escape');
    },
};
