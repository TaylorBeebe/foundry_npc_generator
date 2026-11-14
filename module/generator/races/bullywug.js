export const bullywug = {
    name: 'bullywug',
    cr: '1/4',
    favoredWeapons: ['Blowgun', 'Dart', 'Spear'],
    bio: {
        age: {
            min: 15,
            max: 65,
        },
        hair: ['Dark brown', 'Light brown', 'Red'],
        skin: ['Green', 'Green with yellow spots', 'Gray and yellow', 'Gray'],
        eyes: ['Yellow', 'Orange', 'Greenish white', 'Black'],
        height: {
            deviation: 0.6,
        },
        weight: {
            average: 150,
            deviation: 7,
            minimum: 70,
        },
    },
    apply: async function (draft) {
        draft.int -= 2;
        draft.cha -= 2;
        draft.skill('ste');
        const data = draft.data;
        data.system.details.type.subtype = 'bullywug';
        data.system.attributes.movement.walk = 20;
        data.system.attributes.movement.swim = 40;
        data.system.traits.languages.custom = 'Bullywug';
        await draft.feature('Amphibious');
        await draft.feature('Speak with Frogs and Toads');
        await draft.feature('Swamp Camouflage');
        await draft.feature('Standing Leap');
        await draft.feature('Bite', ['1d4 + @mod', 'bludgeoning']);
    },
};
