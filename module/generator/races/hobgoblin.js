import { jobsWithTag } from '../jobs.js';
export const hobgoblin = {
    name: 'hobgoblin',
    cr: '1/2',
    bio: {
        hair: ['Dark brown', 'Light brown', 'Red', 'Dark gray', 'Orange'],
        skin: ['Orange', 'Light brown', 'Reddish brown'],
        eyes: ['Yellow', 'Orange', 'Red', 'Brown', 'Greenish white'],
        height: {
            average: 5.5,
            deviation: 0.2,
            minimum: 2,
        },
        weight: {
            average: 60,
            deviation: 3,
            minimum: 20,
        },
    },
    apply: async function (draft) {
        const data = draft.data;
        data.system.attributes.senses.darkvision = 60;
        data.system.details.type.subtype = 'goblinoid';
        data.system.traits.languages.value = ['common', 'goblin'];
        if (jobsWithTag('spellcaster').includes(draft.job.name))
            await draft.feature('Army Arcana');
        else {
            const dices = ~~(draft.cr / 3 + 2);
            await draft.feature('Martial Advantage', dices);
        }
    },
};
