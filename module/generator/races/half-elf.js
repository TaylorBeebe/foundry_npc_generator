import { pick } from '../../utils.js';
import { SKILLS } from '../npcdraft.js';
export const halfElf = {
    name: 'half-elf',
    bio: {
        age: {
            max: 220,
        },
    },
    apply: async function (draft) {
        draft.dex++;
        draft.int++;
        draft.cha += 2;
        draft.skill(pick(SKILLS));
        draft.skill(pick(SKILLS));
        const data = draft.data;
        data.system.attributes.senses.darkvision = 60;
        data.system.details.type.subtype = 'elf';
        data.system.traits.languages.value = ['common', 'elvish'];
        await draft.feature('Fey Ancestry');
    },
};
