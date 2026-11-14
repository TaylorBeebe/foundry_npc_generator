import { between, pick, repeatFn, shuffle } from '../../utils.js';
import { applyCommonerWeapon } from './commoner.js';
import { removeEvilSpellsIfNotEvil } from '../item/spells.js';
export const bard = {
    name: 'bard',
    tags: ['spellcaster', 'musician', 'singer', 'charismatic', 'scholar'],
    treasure: 1.5,
    apply: async function (draft) {
        // Abilities
        draft.str += ~~((draft.true_cr - 1) / 5);
        draft.dex += between(0, 4) + ~~((draft.true_cr - 1) / 4);
        draft.con += between(0, 2) + ~~((draft.true_cr - 1) / 5);
        draft.int += ~~((draft.true_cr - 1) / 4);
        draft.wis += 2 + ~~((draft.true_cr - 1) / 4);
        draft.cha += 2 + ~~((draft.true_cr - 1) / 2);
        // Skills
        draft.skill('prf');
        const skills = shuffle(['acr', 'ani', 'arc', 'dec', 'his', 'ins', 'per', 'prc', 'slt']);
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
            draft.save('cha');
        // Armor and Equipment
        let armor = ['Padded Armor', 'Leather Armor', 'Studded Leather Armor', 'Chain Shirt'];
        if (draft.cr > 0.5)
            armor = ['Studded Leather Armor', 'Chain Shirt'];
        await draft.armor(pick(armor));
        // Weapons
        let weaponList = ['Dagger', 'Shortsword'];
        const weaponList_superior = ['Dagger', 'Rapier', 'Shortsword', 'Longsword'];
        if (draft.cr > 0.25)
            weaponList = weaponList_superior;
        const weapon = await draft.weapon(draft.pickFavoredWeapon(weaponList));
        // Ranged
        const ranged = ['Shortbow', 'Longbow', 'Light Crossbow', 'Heavy Crossbow', 'Hand Crossbow'];
        await draft.weapon(draft.pickFavoredWeapon(ranged));
        // Multiattack
        const strikes = ~~((draft.true_cr - 1 + 9) / 6);
        draft.multiattack(Array(strikes).fill(weapon));
        // Special Equipment
        // Besides the weapons, none
        // Spellcasting
        let spellcaster_level = 1;
        if (draft.cr > 1)
            spellcaster_level = draft.true_cr - 1 + between(0, 2);
        if (draft.cr > 3)
            spellcaster_level = draft.true_cr - 1 + between(0, 4);
        spellcaster_level = draft.limitCasterLevel(spellcaster_level);
        await draft.setSpellcaster('bard', spellcaster_level);
        // Cantrips
        await draft.spell('Vicious Mockery');
        const cantrips = 1 + +(spellcaster_level > 3) + +(spellcaster_level > 9);
        // Spells
        const spells_primary = {
            0: [],
            1: shuffle([
                'Thunderwave',
                'Sleep',
                'Hideous Laughter',
                'Cure Wounds',
                'Healing Word',
                'Dissonant Whispers',
                'Earth Tremor',
                'Faerie Fire',
                'Silvery Barbs',
                'Earth Tremor',
            ]),
            2: shuffle([
                'Shatter',
                'Heat Metal',
                'Hold Person',
                'Invisibility',
                'Mirror Image',
                'Phantasmal Force',
                'Suggestion',
                'Cloud of Daggers',
                'Crown of Madness',
                'Blindness/Deafness',
                'Silence',
                'Pyrotechnics',
            ]),
            3: shuffle([
                'Bestow Curse',
                'Dispel Magic',
                'Enemies Abound',
                'Fast Friends',
                'Fear',
                'Hypnotic Pattern',
                'Major Image',
                'Mass Healing Word',
                'Motivational Speech',
                'Slow',
                'Stinking Cloud',
            ]),
            4: shuffle([
                'Compulsion',
                'Confusion',
                'Dimension Door',
                'Greater Invisibility',
                'Phantasmal Killer',
                'Polymorph',
                "Raulothim's Psychic Lance",
                'Psychic Lance',
            ]),
            5: shuffle([
                'Animate Objects',
                'Dominate Person',
                'Hold Monster',
                'Mass Cure Wounds',
                'Mislead',
                'Modify Memory',
                'Seeming',
                'Skill Empowerment',
                'Synaptic Static',
            ]),
            6: shuffle(['Eyebite', 'Mass Suggestion', 'Irresistible Dance']),
            7: shuffle([
                'Forcecage',
                "Mordenkainen's Sword",
                'Arcane Sword',
                'Prismatic Spray',
                'Regenerate',
                'Symbol',
                'Teleport',
            ]),
            8: shuffle(['Dominate Monster', 'Feeblemind', 'Power Word Stun']),
            9: shuffle(['Mass Polymorph', 'Power Word Kill', 'Psychic Scream', 'True Polymorph']),
        };
        const spells_utility = {
            0: shuffle([
                'Blade Ward',
                'Dancing Lights',
                'Friends',
                'Light',
                'Mage Hand',
                'Mending',
                'Message',
                'Minor Illusion',
                'Prestidigitation',
                'Thunderclap',
                'True Strike',
            ]),
            1: shuffle([
                'Animal Friendship',
                'Bane',
                'Charm Person',
                'Color Spray',
                'Command',
                'Comprehend Languages',
                'Detect Magic',
                'Disguise Self',
                'Distort Value',
                'Feather Fall',
                'Heroism',
                'Identify',
                'Illusory Script',
                'Longstrider',
                'Speak with Animals',
                'Unseen Servant',
            ]),
            2: shuffle([
                'Aid',
                'Animal Messenger',
                'Borrowed Knowledge',
                'Calm Emotions',
                'Detect Thoughts',
                'Enhance Ability',
                'Enlarge/Reduce',
                'Enthrall',
                'Gift of Gab',
                'Kinetic Jaunt',
                'Knock',
                'Lesser Restoration',
                'Locate Animals or Plants',
                'Locate Object',
                'Magic Mouth',
                "Nathair's Mischief",
                'See Invisibility',
                'Skywrite',
                'Warding Wind',
                'Zone of Truth',
            ]),
            3: shuffle([
                'Catnap',
                'Clairvoyance',
                'Feign Death',
                'Glyph of Warding',
                'Intellect Fortress',
                'Tiny Hut',
                'Nondetection',
                'Plant Growth',
                'Sending',
                'Speak with Dead',
                'Speak with Plants',
                'Tongues',
            ]),
            4: shuffle(['Charm Monster', 'Freedom of Movement', 'Hallucinatory Terrain', 'Locate Creature']),
            5: shuffle([
                'Awaken',
                'Dream',
                'Geas',
                'Greater Restoration',
                'Legend Lore',
                'Planar Binding',
                'Raise Dead',
                "Rary's Telepathic Bond",
                'Scrying',
                'Teleportation Circle',
            ]),
            6: shuffle(['Find the Path', 'Guards and Wards', "Heroes' Feast", 'Programmed Illusion', 'True Seeing']),
            7: shuffle([
                'Dream of the Blue Veil',
                'Etherealness',
                'Mirage Arcane',
                "Mordenkainen's Magnificent Mansion",
                'Project Image',
                'Resurrection',
            ]),
            8: shuffle(['Antipathy/Sympathy', 'Glibness', 'Mind Blank']),
            9: shuffle(['Foresight', 'Power Word Heal', 'Prismatic Wall']),
        };
        removeEvilSpellsIfNotEvil(draft, [spells_primary, spells_utility]);
        let max_level = draft.spellcasting.spellSlots.indexOf(0);
        if (max_level === -1)
            max_level = 9;
        const spells_known = spellcaster_level + 3; // A pretty good approximation, there is no need to get it perfect
        const spells_drawn = [cantrips, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        for (let i = 0; i < spells_known; i++) {
            const level = Math.min(Math.max(1, ~~((i - 1) / 2)), max_level);
            spells_drawn[level]++;
        }
        await draft.draftSpellList(spells_primary, spells_utility, spells_drawn);
        // Features
        if (spellcaster_level > 1) {
            const die = 6 + 2 * ~~((spellcaster_level - 1) / 4);
            await draft.feature('Song of Rest', die);
        }
        if (draft.cr > 1)
            await draft.feature('Taunt');
    },
};
