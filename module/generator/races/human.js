import { pick } from '../../utils.js';
import { SKILLS } from '../npcdraft.js';
export const human = {
    name: 'human',
    apply: async function (draft) {
        draft.skill(pick(SKILLS));
        const data = draft.data;
        data.system.details.type.subtype = 'human';
        data.system.traits.languages.value = ['common'];
    },
};
