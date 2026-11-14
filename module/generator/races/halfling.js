import { findItem, pick, seeder } from '../../utils.js';
import { SKILLS } from '../npcdraft.js';
export const halfling = {
    name: 'halfling',
    bio: {
        age: {
            min: 20,
            max: 150,
        },
        hair: ['Auburn', 'Black', 'Brown', 'Gray'],
        eyes: ['Black', 'Brown', 'Hazel'],
        height: {
            average: 3.2,
            deviation: 0.15,
            minimum: 1,
        },
        weight: {
            average: 40,
            deviation: 2,
            minimum: 10,
        },
    },
    apply: async function (draft) {
        const rnd = pick([0, 1]);
        draft.con += rnd;
        draft.cha += 1 - rnd;
        draft.dex += 2;
        draft.skill(pick(SKILLS));
        const data = draft.data;
        data.system.attributes.movement.walk = 25;
        data.system.traits.size = 'sm';
        data.system.details.type.subtype = 'halfling';
        data.system.traits.languages.value = ['common', 'halfling'];
        await draft.feature('Halfling Nimbleness');
        if (seeder.rnd() > 0.5)
            await draft.feature('Brave');
        if (seeder.rnd() > 0.5)
            await draft.feature('Lucky');
        const random = seeder.rnd();
        if (random > 0.8 && findItem('Stout Resilience', 'features'))
            await draft.feature('Stout Resilience');
        else if (random > 0.4 && findItem('Silent Speech', 'features'))
            await draft.feature('Silent Speech');
        else
            await draft.feature('Naturally Stealthy');
    },
};
