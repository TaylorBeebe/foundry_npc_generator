import { pick } from '../../utils.js';
import { getActivity, updateDescription } from '../item/item5e.js';
export const dragonborn = {
    name: 'dragonborn',
    cr: '1/4',
    bio: {
        hair: [''],
        skin: ['Scarlet', 'Gold', 'Rust', 'Ocher', 'Bronze', 'Brown scales'],
        eyes: ['Red', 'Gold'],
        height: {
            average: 6.5,
            deviation: 0.1,
            minimum: 4,
        },
        weight: {
            average: 230,
            deviation: 7,
            minimum: 80,
        },
    },
    apply: async function (draft) {
        draft.str += 2;
        draft.cha++;
        const data = draft.data;
        data.system.details.type.subtype = 'dragonborn';
        data.system.traits.languages.value = ['common', 'draconic'];
        // Ancestral Traits
        const ancestries = [
            { ancestry: 'black', type: 'acid', template: 'line', save: 'dex' },
            { ancestry: 'blue', type: 'lightning', template: 'line', save: 'dex' },
            { ancestry: 'brass', type: 'fire', template: 'line', save: 'dex' },
            { ancestry: 'bronze', type: 'lightning', template: 'line', save: 'dex' },
            { ancestry: 'copper', type: 'acid', template: 'line', save: 'dex' },
            { ancestry: 'gold', type: 'fire', template: 'cone', save: 'dex' },
            { ancestry: 'green', type: 'poison', template: 'cone', save: 'con' },
            { ancestry: 'red', type: 'fire', template: 'cone', save: 'dex' },
            { ancestry: 'silver', type: 'cold', template: 'cone', save: 'con' },
            { ancestry: 'white', type: 'cold', template: 'cone', save: 'con' },
        ];
        const ancestral = pick(Object.values(ancestries)), breath_dice = ~~(Math.max(draft.true_cr - 1, 0) / 5) + 2;
        draft.resistance(ancestral.type);
        const dragonBreathDescription = `{{name}} can use its action to exhale a {{breath}} of {{type}} (but can't do this again until finishing a short or long rest); each creature in the {{template}} must make a DC {{save_dc}} Dexterity saving throw, taking {{~~({{breath_dice}}*3.5)}} [[/r {{breath_dice}}d6]] {{type}} damage on a failed save, or half as much damage on a successful one.`;
        const updates = {
            breath: ancestral.template === 'line' ? '5-foot-wide, 30-foot line' : '15ft cone',
            type: ancestral.type,
            template: ancestral.template,
            breath_dice: String(breath_dice),
        };
        const breath_weapon = (await draft.feature(`Breath Weapon - ${ancestral.ancestry.titleCase()}`));
        if (!breath_weapon)
            return;
        breath_weapon.system.description.value = dragonBreathDescription;
        updateDescription(breath_weapon, updates);
        const activity = getActivity(breath_weapon, 'save');
        const dmg = activity?.damage?.parts[0];
        if (!dmg)
            return;
        dmg.number = breath_dice;
        dmg.denomination = 6;
        dmg.custom = { enabled: false, formula: '' };
    },
};
