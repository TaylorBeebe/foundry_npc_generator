import { between, getItemName, repeatFn, shuffle } from '../../utils.js';
import { replaceUnarmedStrikeDescription } from './commoner.js';
import { removeEvilSpellsIfNotEvil } from '../item/spells.js';
export const sorcerer = {
    name: 'sorcerer',
    tags: ['spellcaster', 'arcanist'],
    treasure: 1,
    apply: async function (draft) {
        // Abilities
        draft.str += between(0, 2) - 2 + ~~((draft.true_cr - 1) / 5);
        draft.dex += between(2, 4) + ~~((draft.true_cr - 1) / 4);
        draft.con += between(0, 4) + ~~((draft.true_cr - 1) / 5);
        draft.int += between(0, 2) + ~~((draft.true_cr - 1) / 6);
        draft.wis += 2 + ~~((draft.true_cr - 1) / 4);
        draft.cha += between(3, 5) + ~~((draft.true_cr - 1) / 3.5);
        // Skills
        const skills = shuffle(['arc', 'dec', 'ins', 'itm', 'per', 'rel']);
        repeatFn(() => draft.skill(skills.pop()), (draft.true_cr - 1) / 3 + 2, 4);
        // If the NPC is a Commoner, Casters don't have weapons
        if (draft.cr === 0) {
            const weapon = await draft.weapon('Unarmed Strike');
            if (getItemName(weapon) === 'Unarmed Strike')
                replaceUnarmedStrikeDescription(weapon);
            return;
        }
        // Saves
        if (draft.cr > 1)
            draft.save('con');
        if (draft.cr > 3)
            draft.save('cha');
        // Armor and Equipment
        // None
        // Weapons
        const weaponList = ['Dagger', 'Quarterstaff', 'Shortsword'];
        const weapon = await draft.weapon(draft.pickFavoredWeapon(weaponList));
        // Ranged
        // None
        // Multiattack
        const strikes = 1;
        draft.multiattack(Array(strikes).fill(weapon));
        // Special Equipment
        // Besides the weapons, none
        // Spellcasting
        let spellcaster_level = Math.max(draft.true_cr - 1 + between(0, 4), 1);
        spellcaster_level = draft.limitCasterLevel(spellcaster_level);
        await draft.setSpellcaster('sorcerer', spellcaster_level);
        // Cantrips
        const cantrips = 4 + +(spellcaster_level > 3) + +(spellcaster_level > 9);
        // Spells
        const spells_primary = {
            0: shuffle([
                'Acid Splash',
                //'Booming Blade',
                'Chill Touch',
                'Create Bonfire',
                'Fire Bolt',
                'Friends',
                'Frostbite',
                //'Green-Flame Blade',
                'Infestation',
                'Light',
                //'Lightning Lure',
                'Mind Sliver',
                'Poison Spray',
                'Ray of Frost',
                'Shocking Grasp',
                'Sword Burst',
                'Thunderclap',
            ]),
            1: shuffle([
                'Burning Hands',
                'Catapult',
                'Chaos Bolt',
                'Chromatic Orb',
                'Color Spray',
                'Earth Tremor',
                'Expeditious Retreat',
                'Fog Cloud',
                'Grease',
                'Ice Knife',
                'Magic Missile',
                'Ray of Sickness',
                'Shield',
                'Silvery Barbs',
                'Sleep',
                "Tasha's Caustic Brew",
                'Thunderwave',
                'Witch Bolt',
            ]),
            2: shuffle([
                "Aganazzar's Scorcher",
                'Blindness/Deafness',
                'Blur',
                'Cloud of Daggers',
                'Crown of Madness',
                "Dragon's Breath",
                'Dust Devil',
                'Earthbind',
                'Flame Blade',
                'Flaming Sphere',
                'Hold Person',
                "Maximilian's Earthen Grasp",
                'Mind Spike',
                'Mirror Image',
                'Misty Step',
                'Phantasmal Force',
                "Rime's Binding Ice",
                'Scorching Ray',
                'Shadow Blade',
                'Shatter',
                "Snilloc's Snowball Swarm",
                'Suggestion',
                "Tasha's Mind Whip",
                'Vortex Warp',
                'Web',
                'Wither and Bloom',
            ]),
            3: shuffle([
                "Ashardalon's Stride",
                'Blink',
                'Counterspell',
                'Daylight',
                'Dispel Magic',
                'Enemies Abound',
                'Erupting Earth',
                'Fear',
                'Fireball',
                'Flame Arrows',
                'Fly',
                'Haste',
                'Hypnotic Pattern',
                'Lightning Bolt',
                "Melf's Minute Meteors",
                'Sleet Storm',
                'Slow',
                'Stinking Cloud',
                'Tidal Wave',
                'Vampiric Touch',
                'Wall of Water',
            ]),
            4: shuffle([
                'Banishment',
                'Blight',
                'Confusion',
                'Greater Invisibility',
                'Ice Storm',
                'Polymorph',
                "Raulothim's Psychic Lance",
                'Sickening Radiance',
                'Storm Sphere',
                'Vitriolic Sphere',
                'Wall of Fire',
                'Watery Sphere',
            ]),
            5: shuffle([
                'Animate Objects',
                "Bigby's Hand",
                'Cloudkill',
                'Cone of Cold',
                'Dominate Person',
                'Enervation',
                'Far Step',
                'Hold Monster',
                'Immolation',
                'Insect Plague',
                'Summon Draconic Spirit',
                'Synaptic Static',
            ]),
            6: shuffle([
                'Chain Lightning',
                'Circle of Death',
                'Disintegrate',
                'Eyebite',
                "Fizban's Platinum Shield",
                'Flesh to Stone',
                'Investiture of Flame',
                'Investiture of Ice',
                'Investiture of Stone',
                'Investiture of Wind',
                'Mass Suggestion',
                'Mental Prison',
                "Otiluke's Freezing Sphere",
                'Sunbeam',
                "Tasha's Otherworldly Guise",
            ]),
            7: shuffle([
                'Crown of Stars',
                'Delayed Blast Fireball',
                'Draconic Transformation',
                'Finger of Death',
                'Fire Storm',
                'Power Word Pain',
                'Prismatic Spray',
                'Reverse Gravity',
                'Whirlwind',
            ]),
            8: shuffle(["Abi-Dalzim's Horrid Wilting", 'Earthquake', 'Incendiary Cloud', 'Power Word Stun', 'Sunburst']),
            9: shuffle([
                'Blade of Disaster',
                'Gate',
                'Mass Polymorph',
                'Meteor Swarm',
                'Power Word Kill',
                'Psychic Scream',
                'Time Stop',
                'Wish',
            ]),
        };
        const spells_utility = {
            0: [
                'Blade Ward',
                'Control Flames',
                'Dancing Lights',
                'Gust',
                'Mage Hand',
                'Mending',
                'Message',
                'Minor Illusion',
                'Mold Earth',
                'Prestidigitation',
                'Shape Water',
                'True Strike',
            ],
            1: shuffle([
                'Absorb Elements',
                'Charm Person',
                'Comprehend Languages',
                'Detect Magic',
                'Disguise Self',
                'Distort Value',
                'False Life',
                'Feather Fall',
                'Jump',
                'Mage Armor',
                'Silent Image',
            ]),
            2: shuffle([
                'Air Bubble',
                'Alter Self',
                'Darkness',
                'Darkvision',
                'Detect Thoughts',
                'Enhance Ability',
                'Enlarge/Reduce',
                'Gust of Wind',
                'Invisibility',
                'Knock',
                'Kinetic Jaunt',
                'Levitate',
                'Magic Weapon',
                "Nathair's Mischief",
                'Pyrotechnics',
                'See Invisibility',
                'Spider Climb',
                'Warding Wind',
            ]),
            3: shuffle([
                'Catnap',
                'Clairvoyance',
                'Gaseous Form',
                'Intellect Fortress',
                'Major Image',
                'Protection from Energy',
                'Thunder Step',
                'Tongues',
                'Water Breathing',
                'Water Walk',
            ]),
            4: shuffle(['Charm Monster', 'Dimension Door', 'Dominate Beast', 'Fire Shield', 'Stoneskin']),
            5: shuffle([
                'Control Winds',
                'Creation',
                'Seeming',
                'Skill Empowerment',
                'Telekinesis',
                'Teleportation Circle',
                'Wall of Light',
                'Wall of Stone',
            ]),
            6: shuffle(['Arcane Gate', 'Globe of Invulnerability', 'Move Earth', 'Scatter', 'True Seeing']),
            7: shuffle(['Dream of the Blue Veil', 'Etherealness', 'Plane Shift', 'Teleport']),
            8: shuffle(['Demiplane', 'Dominate Monster']),
            9: [],
        };
        removeEvilSpellsIfNotEvil(draft, [spells_primary, spells_utility]);
        let max_level = draft.spellcasting.spellSlots.indexOf(0);
        if (max_level === -1)
            max_level = 9;
        const spells_known = Math.min(spellcaster_level + 1, 12) + Math.max(Math.min(~~((spellcaster_level - 11) / 2), 3), 0);
        const spells_drawn = [cantrips, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        for (let i = 0; i < spells_known; i++) {
            const level = (i % max_level) + 1;
            spells_drawn[level]++;
        }
        await draft.draftSpellList(spells_primary, spells_utility, spells_drawn);
        // Features
        // None
    },
};
