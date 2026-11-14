export const halfOrc = {
    name: 'half-orc',
    cr: '1/2',
    bio: {
        age: {
            min: 14,
            max: 75,
        },
        height: {
            average: 6,
            deviation: 0.4,
            minimum: 3.5,
        },
        weight: {
            average: 200,
            deviation: 6,
            minimum: 40,
        },
    },
    apply: async function (draft) {
        draft.str += 2;
        draft.con++;
        draft.skill('itm');
        const data = draft.data;
        data.system.attributes.senses.darkvision = 60;
        data.system.details.type.subtype = 'half-orc';
        data.system.traits.languages.value = ['common', 'orc'];
        await draft.feature('Relentless Endurance');
        await draft.feature('Savage Attacks');
    },
};
