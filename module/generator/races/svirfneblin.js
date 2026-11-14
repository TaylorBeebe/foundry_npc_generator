export const svirfneblin = {
    name: 'svirfneblin',
    tags: ['underground'],
    bio: {
        age: {
            min: 25,
            max: 250,
        },
        hair: ['Bald', 'Gray'],
        skin: ['Woody brown', 'Brownish gray', 'Rocky gray'],
        eyes: ['Gray', 'Black'],
        height: {
            average: 3.2,
            deviation: 0.1,
            minimum: 1.4,
        },
        weight: {
            average: 43,
            deviation: 2,
            minimum: 15,
        },
    },
    apply: async function (draft) {
        draft.str++;
        draft.dex += 2;
        draft.skill('ste');
        const data = draft.data;
        data.system.attributes.senses.darkvision = 120;
        data.system.attributes.movement.walk = 20;
        data.system.traits.size = 'sm';
        data.system.details.type.subtype = 'gnome';
        data.system.traits.languages.value = ['undercommon', 'gnomish', 'terran'];
        await draft.feature('Gnome Cunning');
        await draft.feature('Stone Camouflage');
        draft.innateSpells.ability = 'int';
        await draft.innate('Nondetection');
        await draft.innate('Blindness/Deafness', { max: 1, period: 'day' });
        await draft.innate('Blur', { max: 1, period: 'day' });
        await draft.innate('Disguise Self', { max: 1, period: 'day' });
    },
};
