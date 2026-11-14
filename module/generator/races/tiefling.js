import { findItem, pick_weights, seeder } from '../../utils.js';
export const tiefling = {
    name: 'tiefling',
    alignment: ['LN', 'LE', 'N', 'NE', 'CN', 'CE'],
    cr: '1/2',
    bio: {
        age: {
            max: 90,
        },
        hair: ['Red', 'Brown', 'Black', 'Dark blue', 'Purple'],
        skin: ['Pale', 'Reddish pale', 'Fair', 'Tanned', 'Red', 'Reddish Yellow', 'Medium', 'Light brown', 'Reddish brown'],
        eyes: ['Black', 'Gold', 'Red', 'Silver', 'White (solid color, with no sclera or pupil)'],
        height: {
            deviation: 0.15,
        },
        weight: {
            average: 140,
            deviation: 2,
            minimum: 30,
        },
    },
    apply: async function (draft) {
        draft.int++;
        draft.cha += 2;
        const data = draft.data;
        data.system.attributes.senses.darkvision = 60;
        data.system.details.type.subtype = 'tiefling';
        data.system.traits.languages.value = ['common', 'infernal'];
        draft.resistance('fire');
        if (seeder.rnd() > 0.9)
            draft.data.system.attributes.movement.fly = 30;
        // Ancestral Traits
        const ancestries = {
            asmodeus: ['Thaumaturgy', 'Hellish Rebuke', 'Darkness'],
            baalzebul: ['Thaumaturgy', 'Ray of Sickness', 'Crown of Madness'],
            dispater: ['Thaumaturgy', 'Disguise Self', 'Detect Thoughts'],
            fierna: ['Friends', 'Charm Person', 'Suggestion'],
            glasya: ['Minor Illusion', 'Disguise Self', 'Invisibility'],
            levistus: ['Ray of Frost', 'Armor of Agathys', 'Darkness'],
            mammon: ['Mage Hand', 'Floating Disk', 'Arcane Lock'],
            mephistopheles: ['Mage Hand', 'Burning Hands', 'Flame Blade'],
            zariel: ['Thaumaturgy', 'Searing Smite', 'Branding Smite'],
        };
        const spells = pick_weights(Object.values(ancestries), [12, 3, 2, 2, 2, 2, 2, 5, 2]);
        if (spells[0] === 'Friends' && !findItem('Friends', 'spells'))
            await draft.innate('Thaumaturgy');
        else
            await draft.innate(spells[0]);
        await draft.innate(spells[1], { max: 1, period: 'day' });
        await draft.innate(spells[2], { max: 1, period: 'day' });
    },
};
