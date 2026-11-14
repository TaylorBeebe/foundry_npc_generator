import { between, seeder, shuffle, repeatFn } from '../../utils.js';
import { applyCommonerRangedWeapon, applyCommonerWeapon } from './commoner.js';
export const ranger = {
    name: 'ranger',
    tags: ['naturalist'],
    treasure: 1,
    apply: async function (draft) {
        // Abilities
        draft.str += between(0, 2) + ~~((draft.true_cr - 1) / 6);
        draft.dex += between(3, 5) + ~~((draft.true_cr - 1) / 2.5);
        draft.con += between(1, 4) + ~~((draft.true_cr - 1) / 3);
        draft.int += between(0, 4) - 2 + ~~((draft.true_cr - 1) / 6);
        draft.wis += between(0, 4) + ~~((draft.true_cr - 1) / 3);
        draft.cha += between(0, 4) - 2 + ~~((draft.true_cr - 1) / 6);
        // Skills
        draft.skill('prc');
        const skills = shuffle(['acr', 'ath', 'sur', 'nat', 'ste']);
        repeatFn(() => draft.skill(skills.pop()), (draft.true_cr - 1) / 4 + 1, 3);
        // If the NPC is a Commoner
        if (draft.cr === 0) {
            await applyCommonerWeapon(draft);
            if (seeder.rnd() > 0.5)
                await applyCommonerRangedWeapon(draft);
            return;
        }
        // Saves
        if (draft.cr > 1)
            draft.save('str');
        if (draft.cr > 3)
            draft.save('dex');
        // Additional Languages due to Natural Enemy
        const languages_list = shuffle(['abyssal', 'deep', 'dwarvish', 'giant', 'gnoll', 'goblin', 'infernal', 'orc', 'sylvan', 'undercommon']);
        const favored_enemies = 2 + ~~((draft.true_cr - 1) / 4);
        for (let i = 0; i < favored_enemies; i++)
            draft.language(languages_list.pop());
        // Armor and Equipment
        let armor = ['Padded Armor', 'Leather Armor', 'Studded Leather Armor', 'Hide Armor', 'Chain Shirt', 'Scale Mail'];
        if (draft.cr > 1)
            armor = ['Chain Shirt', 'Scale Mail', 'Half Plate Armor'];
        if (draft.mod('dex') > 4)
            armor = ['Studded Leather Armor'];
        await draft.armor(armor);
        // Weapons
        const weaponList = ['Dagger', 'Rapier', 'Scimitar', 'Shortsword'];
        await draft.weapon(draft.pickFavoredWeapon(weaponList));
        // Ranged Weapon
        let rangedList = ['Shortbow'];
        if (draft.cr > 0.125)
            rangedList = ['Shortbow', 'Longbow'];
        const ranged = await draft.weapon(draft.pickFavoredWeapon(rangedList));
        // Multiattack
        // The multiattack is set even with one attack, to trigger multiattack in case the creature has Bite
        const strikes = ~~((draft.true_cr - 1 + 6) / 4);
        draft.multiattack(Array(strikes).fill(ranged));
        // Special Equipment
        // Besides the weapons, none
        // Features
        await draft.feature('Keen Hearing and Sight');
        if (draft.cr > 4)
            await draft.feature('Archery');
        if (draft.cr > 8)
            await draft.feature('Vanish');
        // Spellcasting
        let spellcaster_level = 1;
        if (draft.cr > 0.5)
            spellcaster_level = draft.true_cr - 1 + between(0, 2);
        if (draft.cr > 3)
            spellcaster_level = draft.true_cr - 1 + between(0, 4);
        spellcaster_level = draft.limitCasterLevel(spellcaster_level);
        if (spellcaster_level < 2)
            return;
        await draft.setSpellcaster('ranger', spellcaster_level);
        const spells_primary = {
            1: shuffle(['Cure Wounds', 'Ensnaring Strike', 'Entangle', 'Fog Cloud', 'Hail of Thorns', "Hunter's Mark", 'Searing Smite', 'Zephyr Strike']),
            2: shuffle(['Aid', 'Barkskin', 'Cordon of Arrows', 'Healing Spirit', 'Spike Growth', 'Summon Beast', 'Silence']),
            3: shuffle(["Ashardalon's Stride", 'Conjure Animals', 'Conjure Barrage', 'Elemental Weapon', 'Flame Arrows', 'Lightning Arrow', 'Summon Fey']),
            4: shuffle(['Conjure Woodland Beings', 'Grasping Vine', 'Stoneskin', 'Summon Elemental', 'Guardian of Nature']),
            5: shuffle(['Conjure Volley', 'Steel Wind Strike', 'Swift Quiver', 'Tree Stride', 'Wrath of Nature', 'Commune with Nature', 'Greater Restoration']),
        };
        const spells_utility = {
            1: shuffle([
                'Absorb Elements',
                'Alarm',
                'Animal Friendship',
                'Beast Bond',
                'Detect Magic',
                'Detect Poison and Disease',
                'Goodberry',
                'Jump',
                'Longstrider',
                'Snare',
                'Speak with Animals',
            ]),
            2: shuffle([
                'Animal Messenger',
                'Air Bubble',
                'Beast Sense',
                'Darkvision',
                'Enhance Ability',
                'Find Traps',
                'Gust of Wind',
                'Lesser Restoration',
                'Locate Animals or Plants',
                'Locate Object',
                'Magic Weapon',
                'Pass without Trace',
                'Protection from Poison',
            ]),
            3: shuffle([
                'Daylight',
                'Meld into Stone',
                'Nondetection',
                'Plant Growth',
                'Protection from Energy',
                'Revivify',
                'Speak with Plants',
                'Water Breathing',
                'Water Walk',
                'Wind Wall',
            ]),
            4: shuffle(['Dominate Beast', 'Freedom of Movement', 'Locate Creature']),
            5: spells_primary[5],
        };
        const max_level = draft.spellcasting.spellSlots.indexOf(0);
        const spells_known = ~~((spellcaster_level + 3) / 2);
        const spells_drawn = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        for (let i = 0; i < spells_known; i++) {
            const level = Math.min(Math.max(1, ~~((i + 1) / 2)), max_level);
            spells_drawn[level]++;
        }
        await draft.draftSpellList(spells_primary, spells_utility, spells_drawn);
    },
};
