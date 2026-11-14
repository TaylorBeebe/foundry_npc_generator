import { menu as names } from '../../names.js';
import { findItem, pick, seeder } from '../../utils.js';
import { spells, wizardCantrips } from '../item/spells.js';
export const elf = {
    name: 'elf',
    languages: [names.All.Fantasy.ForgottenRealms.Elven, names.All.Fantasy.Generic.Elven],
    favoredWeapons: ['Longbow', 'Longsword', 'Shortbow', 'Shortsword'],
    bio: {
        age: {
            min: 90,
            max: 750,
        },
        hair: ['Black', 'Blonde', 'Light brown', 'Dark brown', 'Gray', 'Red', 'Green', 'Blue'],
        skin: ['Pale', 'Fair', 'Tanned', 'Medium', 'Light brown', 'Copper', 'Bronze', 'Bluish-white'],
        eyes: ['Blue', 'Brown', 'Gray', 'Green', 'Hazel', 'Gold', 'Silver'],
        height: {
            average: 5.8,
            deviation: 0.2,
        },
        weight: {
            average: 120,
            deviation: 2,
        },
    },
    apply: async function (draft) {
        const rnd = pick([0, 1]); // Increase either Int or Wisdom by 1
        draft.int += rnd;
        draft.wis += 1 - rnd;
        draft.dex += 2;
        draft.skill('prc');
        const data = draft.data;
        data.system.attributes.senses.darkvision = 60;
        data.system.details.type.subtype = 'elf';
        data.system.traits.languages.value = ['common', 'elvish'];
        await draft.feature('Fey Ancestry');
        const random = seeder.rnd();
        if (random > 0.9)
            await draft.feature('Mask of the Wild');
        else if (random > 0.8) {
            draft.innateSpells.ability = 'int';
            let cantrip = pick(wizardCantrips);
            while (draft.cr < (spells[cantrip]?.cr ?? 0) || !findItem(cantrip, 'spells'))
                cantrip = pick(wizardCantrips);
            await draft.innate(cantrip);
        }
    },
};
