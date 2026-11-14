import { between, repeatFn, shuffle } from '../../utils.js';
import { applyCommonerWeapon } from './commoner.js';
function poison(weapon, dices, ability_save = 'con', ability_cd = 'int') {
    const save = {
        type: 'save',
        _id: '59uViwapFjq67RHd',
        sort: 0,
        activation: {
            type: 'special',
        },
        description: {
            chatFlavor: '',
        },
        duration: {
            units: 'inst',
            concentration: false,
            override: false,
        },
        effects: [],
        range: {
            override: false,
        },
        target: {
            template: {
                contiguous: false,
                units: 'ft',
                type: '',
            },
            affects: {
                choice: false,
                count: '',
                type: '',
            },
            override: false,
            prompt: true,
        },
        uses: {
            spent: 0,
            recovery: [],
            max: '',
        },
        damage: {
            parts: [
                {
                    number: dices,
                    denomination: 6,
                    bonus: '',
                    types: ['poison'],
                    custom: {
                        enabled: false,
                        formula: '',
                    },
                    scaling: {
                        mode: 'whole',
                        number: null,
                        formula: '',
                    },
                },
            ],
            onSave: 'half',
        },
        save: {
            ability: [ability_save],
            dc: {
                calculation: ability_cd,
                formula: '',
            },
        },
        name: 'Poison',
    };
    weapon.system.activities[save._id] = save;
}
export const assassin = {
    name: 'assassin',
    alignment: ['LN', 'LE', 'N', 'NE'],
    bio: { height_multiplier: 0.95 },
    treasure: 1,
    apply: async function (draft) {
        // Abilities
        draft.str += ~~((draft.true_cr - 1) / 6);
        draft.dex += 1 + ~~((draft.true_cr - 1) / 2);
        draft.con += 2 + ~~((draft.true_cr - 1) / 4);
        draft.int += between(0, 4) + ~~((draft.true_cr - 1) / 4);
        draft.wis += ~~((draft.true_cr - 1) / 6);
        draft.cha += ~~((draft.true_cr - 1) / 5);
        // Skills
        draft.skill('ste');
        const skills = shuffle(['acr', 'ath', 'prc', 'nat', 'dec']);
        repeatFn(() => draft.skill(skills.pop()), (draft.true_cr - 1) / 3 + 1, 4);
        // If the NPC is a Commoner
        if (draft.cr === 0) {
            await applyCommonerWeapon(draft);
            return;
        }
        // Saves
        if (draft.cr > 1)
            draft.save('dex');
        if (draft.cr > 3)
            draft.save('int');
        if (draft.cr > 1)
            draft.resistance('poison');
        // Languages
        draft.language('cant');
        // Armor and Equipment
        let armor = 'Leather Armor';
        if (draft.cr > 1)
            armor = 'Studded Leather Armor';
        await draft.armor(armor);
        // Weapons
        let weaponList = ['Dagger', 'Shortsword', 'Rapier', 'Scimitar', 'Whip'];
        const poison_dices = ~~(draft.cr - 1), poison_damage = poison_dices + 'd6', drow = draft.race.name === 'drow';
        const poison_desc = () => ` and the target must make a DC <b>{{8+prof+mods.int}}</b> Constitution saving throw, taking <b>{{avg_dmg("${poison_damage}")}}</b> ([[/r ${poison_damage}]]) poison damage on a failed save, or half as much damage on a successful one`;
        const drow_desc = ` and the target must succeed on a DC <b>{{8+prof+mods.int}}</b> Constitution saving throw or be poisoned for 1 hour. If the saving throw fails by 5 or more, the target is also unconscious while poisoned in this way. The target wakes up if it takes damage or if another creature takes an action to shake it awake`;
        let special = '';
        if (drow && draft.cr > 0.125)
            special = drow_desc;
        if (draft.cr > 1)
            special = poison_desc();
        const weapon = draft.pickFavoredWeapon(weaponList);
        const weapon_item = (await draft.weapon(weapon, true, special));
        // Ranged Weapon
        let ranged = draft.pickFavoredWeapon([
            'Hand Crossbow',
            'Dart',
            'Blowgun',
            'Light Crossbow',
            'Shortbow',
            'Longbow',
        ]);
        const ranged_item = await draft.weapon(ranged, true, special);
        // Poison
        if (special) {
            poison(weapon_item, poison_dices, 'con', 'int');
            poison(ranged_item, poison_dices, 'con', 'int');
        }
        // Multiattack
        // The multiattack is set even with one attack, to trigger multiattack in case the creature has Bite
        const strikes = ~~((draft.true_cr - 1 + 37) / 20);
        draft.multiattack(Array(strikes).fill(weapon_item));
        // Special Equipment
        // Besides the weapons, none
        // Features
        const sneak_attack = ~~(draft.cr / 4 + 1) * 2;
        if (draft.cr > 0.125)
            await draft.feature('Sneak Attack', sneak_attack);
        if (draft.cr > 2)
            await draft.feature('Assassinate');
        if (draft.cr > 5)
            await draft.feature('Evasion');
    },
};
