import { alignments } from '../npcdraft.js';
export const wizardCantrips = [
    'Acid Splash',
    'Blade Ward',
    'Booming Blade',
    'Chill Touch',
    'Control Flames',
    'Create Bonfire',
    'Dancing Lights',
    'Fire Bolt',
    'Friends',
    'Frostbite',
    'Green-Flame Blade',
    'Gust',
    'Infestation',
    'Light',
    'Lightning Lure',
    'Mage Hand',
    'Mending',
    'Message',
    'Mind Sliver',
    'Minor Illusion',
    'Mold Earth',
    'Poison Spray',
    'Prestidigitation',
    'Ray of Frost',
    'Shape Water',
    'Shocking Grasp',
    'Sword Burst',
    'Thunderclap',
    'Toll the Dead',
    'True Strike',
];
export async function populateWizardSpellbook(draft, spellcaster_level, prepared_list, primary_list, utility_list) {
    const spell_book = [0, 4, 0, 0, 0, 0, 0, 0, 0, 0];
    for (let i = 0; i < spellcaster_level; i++) {
        const level = 1 + ~~(i / 2);
        spell_book[level] += 2;
    }
    const difference = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    for (let i = 1; i < 10; i++)
        difference[i] = spell_book[i] - prepared_list[i];
    const spellList = { ...primary_list, ...utility_list };
    await draft.draftSpellList(spellList, spellList, difference, false);
}
// List of Spells dmg
export const spells = {
    'Acid Splash': { damage: '3.5*cantrip_level', area_mult: 1.5 },
    "Aganazzar's Scorcher": { damage: '4.5*(spell_level+1)', area_mult: 1.5, fail_dmg: 0.5 },
    'Animate Objects': { cost: { action: 1, bonus: 1 }, damage: '13*spell_level', duration: 2 },
    "Ashardalon's Stride": { damage: '3.5*(spell_level-2)', area_mult: 2, fail_dmg: 1 },
    'Antipathy/Sympathy': { cr: 12 },
    'Arms of Hadar': { damage: '3.5+3.5*spell_level', area_mult: 1.5, fail_dmg: 0.5 },
    'Armor of Agathys': { damage: '5*spell_level', cr: 0.5 },
    'Aura of Vitality': { damage: '7', cost: { bonus: 2 }, duration: 2, cr: 2 },
    'Aura of Life': { duration: 2, cr: 5 },
    Banishment: { damage: 'this.true_cr*3*(min(spell_level,6)-3)', cr: 7 },
    Barskin: { cr: 0.25 },
    "Bigby's Hand": { damage: '9*(spell_level-3)', cost: { action: 1, bonus: 1 }, duration: 2 },
    'Arcane Hand': { damage: '9*(spell_level-3)', cost: { action: 1, bonus: 1 }, duration: 2 },
    'Bones of the Earth': { damage: 'this.true_cr*3', area_mult: 4, target_choice: true },
    'Blade Barrier': { damage: '33', area_mult: 2, fail_dmg: 0.5 },
    Blight: { damage: '4.5*(spell_level+4)', fail_dmg: 0.5 },
    'Blade of Disaster': { cost: { bonus: 2 }, damage: '80', duration: 2 },
    'Blindness/Deafness': { damage: 'this.true_cr*2.5*(spell_level-1)' },
    'Branding Smite': { damage: '3.5*spell_level', fail_dmg: 0.5 },
    'Burning Hands': { damage: '7+3.5*spell_level', area_mult: 1.5, fail_dmg: 0.5, cr: 0.25 },
    'Call Lightning': { damage: '5.5*spell_level', cost: { action: 2 }, area_mult: 1.5, fail_dmg: 0.5, duration: 2 },
    'Circle of Death': { damage: '7*spell_level-14', area_mult: 3, fail_dmg: 0.5 },
    Cloudkill: { damage: '4.5*spell_level', area_mult: 2, duration: 1.5 },
    'Chaos Bolt': { damage: '9+3.5*spell_level', area_mult: 1.125, target_choice: true },
    'Chain Lightning': { damage: '45', area_mult: 3, fail_dmg: 0.5, cr: 9, target_choice: true },
    'Chill Touch': { damage: '4.5*cantrip_level' },
    Confusion: { damage: 'this.true_cr*3', area_mult: 1.7, duration: 2 },
    'Color Spray': { damage: '6+2.4*spell_level', fail_dmg: 1, cr: 0.25 }, // Damage is added because it has offensive power
    'Cone of Cold': { damage: '13.5+4.5*spell_level', area_mult: 2.5, fail_dmg: 0.5 },
    'Conjure Animals': { damage: '15.5*~~((spell_level-1)/2)', duration: 2 },
    'Conjure Celestial': { damage: '22+5*~~((spell_level-5)/2)', duration: 2 },
    'Conjure Fey': { damage: '6.5*spell_level', duration: 2 },
    'Conjure Minor Elementals': { damage: '24*~~((spell_level-2)/2)', duration: 2 },
    'Conjure Woodland Beings': { damage: '20*~~((spell_level-2)/2)', duration: 2 },
    'Conjure Barrage': { damage: '13.5', area_mult: 2.5, fail_dmg: 0.5 },
    'Cordon of Arrows': { damage: '7+7*spell_level', cr: 0.5 },
    'Cloud of Daggers': { damage: '5*spell_level', fail_dmg: 1, cr: 0.5 },
    'Crown of Madness': { damage: 'this.true_cr', duration: 2, cr: 0.25 },
    'Crown of Stars': { cost: { bonus: 3 }, damage: '26', duration: 3 },
    "Crusader's Mantle": { damage: '2.5*cantrip_level', area_mult: 2, duration: 2 },
    'Danse Macabre': { damage: '9*(spell_level*2-5)', cost: { action: 1, bonus: 1 }, duration: 2 },
    Dawn: { damage: '22', area_mult: 2.5, duration: 2, fail_dmg: 0.5 },
    'Delayed Blast Fireball': { damage: '17.5+3.5*spell_level', area_mult: 2, fail_dmg: 0.5, cr: 4 },
    Disintegrate: { damage: '12+9.5*spell_level' },
    'Dissonant Whispers': { damage: '7+3.5*spell_level+3+2.5*spell_level', fail_dmg: 0.3, cr: 1 },
    'Divine Favor': { damage: '2.5*cantrip_level', duration: 2 },
    'Divine Word': { damage: '25', area_mult: 3, target_choice: true },
    'Dominate Person': { damage: 'this.true_cr * 8', fail_dmg: -0.4 },
    'Dominate Monster': { damage: 'this.true_cr * 8', fail_dmg: -0.4 },
    'Dust Devil': { damage: '4.5*(spell_level-1)', area_mult: 1.5, duration: 2, fail_dmg: 0.5 },
    'Draconic Transformation': { damage: '27', area_mult: 2, fail_dmg: 0.5, cost: { bonus: 2 }, duration: 2 },
    "Dragon's Breath": { damage: '7+3.5*(spell_level-1)', area_mult: 1.5, fail_dmg: 0.5, cost: { bonus: 2 }, duration: 2 },
    'Earth Tremor': { damage: '3.5*spell_level', area_mult: 1.75 },
    'Eldritch Blast': { damage: '5.5*cantrip_level' },
    'Elemental Weapon': { damage: '(2.5*cantrip_level*~~((spell_level-1)/2)+9.5*cantrip_level)/2', fail_dmg: 0.1 },
    'Enemies Abound': { damage: 'this.true_cr*5', cr: 1 },
    Enervation: { damage: '4.5*(spell_level-1)*1.5', cost: { action: 2 }, fail_dmg: 0.3, duration: 2 },
    'Erupting Earth': { damage: '6.5*spell_level', area_mult: 2, fail_dmg: 0.5 },
    Entangle: { damage: 'this.true_cr*3', area_mult: 2 },
    "Evard's Black Tentacles": { damage: '16+this.true_cr*2', area_mult: 2, duration: 2 },
    'Black Tentacles': { damage: '16+this.true_cr*2', area_mult: 2, duration: 2 },
    Eyebite: { damage: '20', cost: { action: 2 }, duration: 2 },
    'Fast Friends': { damage: 'this.true_cr*5', fail_dmg: -0.5 },
    Fear: { damage: 'this.true_cr*4', area_mult: 2, cr: 1 },
    'Fire Bolt': { damage: '5.5*cantrip_level' },
    'Fire Shield': { damage: '18', duration: 2 },
    'Fire Storm': { damage: '38.5', area_mult: 3, fail_dmg: 0.5, target_choice: true },
    'Finger of Death': { damage: '61.5', fail_dmg: 0.5 },
    'Flame Strike': { damage: '10.5+3.5*spell_level', area_mult: 1.5, fail_dmg: 0.5 },
    'Flaming Sphere': { damage: '3.5*spell_level', area_mult: 1.5, fail_dmg: 0.5, duration: 2 },
    'Flesh to Stone': { damage: 'this.true_cr * 10' },
    Forcecage: { damage: 'this.true_cr*8', fail_dmg: 1, cr: 15 },
    Frostbite: { damage: '4.5*cantrip_level' }, // Enhanced damage due to the disadvantage effect
    'Ensnaring Strike': { damage: '3.5*spell_level*2', cr: 0.25 },
    Fireball: { damage: '17.5+3.5*spell_level', area_mult: 2, fail_dmg: 0.5, cr: 4 },
    'Flame Arrows': { damage: 'cantrip_level*3.5*2' },
    'Flame Blade': { cost: { action: 2, bonus: 1 }, damage: '3.5*~~(spell_level/2 + 2)', duration: 2 },
    Gate: { cr: 15 },
    'Giant Insect': { damage: '42.5', duration: 2 },
    'Guardian of Faith': { damage: '60', fail_dmg: 0.5 },
    'Guiding Bolt': { damage: '10.5+3.5*spell_level' },
    Grease: { damage: '(this.true_cr-1)+1' },
    Harm: { damage: '49', fail_dmg: 0.5 },
    Haste: { damage: '5+this.true_cr', duration: 2 },
    'Hail of Thorns': { damage: '5.5*spell_level', area_mult: 1.5 },
    'Healing Spirit': { damage: '5', duration: 2, cr: 2 },
    'Healing Word': { damage: '2.5*spell_level+mod', cr: 0.5 },
    'Heat Metal': { cost: { action: 1, bonus: 2 }, damage: '4.5*spell_level', duration: 2, fail_dmg: 1, cr: 1 },
    'Hellish Rebuke': { damage: '5.5+5.5*spell_level', cost: { reaction: 1 } },
    Hex: { damage: '3.5*cantrip_level', duration: 2, cr: 0.5 }, // Cantrip level is used here as an alias for the number of attacks, due to Eldritch Blast
    "Hunter's Mark": { damage: '3.5*cantrip_level', duration: 2, cr: 0.5 },
    'Hypnotic Pattern': { damage: 'this.true_cr*3', area_mult: 2, cr: 2 },
    'Hold Person': { damage: 'this.true_cr*4*(min(spell_level,4)-1)', cr: 0.5 },
    'Hold Monster': { damage: 'this.true_cr*4*(min(spell_level,8)-5)', cr: 0.5 },
    'Hunger of Hadar': { damage: '7', duration: 2, area_mult: 2, fail_dmg: 0.5 },
    'Ice Storm': { damage: '14+4.5*(spell_level-2)', area_mult: 2, fail_dmg: 0.5 },
    'Illusory Dragon': { damage: '45', duration: 2, area_mult: 2, fail_dmg: 0.5 },
    Immolation: { damage: '24.5', duration: 2, fail_dmg: 0.5 },
    'Incite Greed': { damage: 'this.true_cr*4', area_mult: 2, cr: 2 },
    'Inflict Wounds': { damage: '11+5.5*spell_level' },
    'Investiture of Flame': { damage: '11+18', area_mult: 1.25, duration: 2, fail_dmg: 0.35 },
    'Investiture of Ice': { damage: '14', area_mult: 1.25, duration: 2, fail_dmg: 0.5 },
    'Investiture of Stone': { damage: '20', duration: 2 },
    'Investiture of Wind': { damage: '20', duration: 2 },
    'Incendiary Cloud': { damage: '45', duration: 1.5, area_mult: 2, fail_dmg: 0.5, cr: 13 },
    'Lightning Arrow': { damage: '4.5+4.5*spell_level', area_mult: 1.5, fail_dmg: 0.5 },
    'Lightning Bolt': { damage: '17.5+3.5*spell_level', area_mult: 2, fail_dmg: 0.5, cr: 4 },
    'Maddening Darkness': { damage: '45', duration: 2, area_mult: 2, fail_dmg: 0.5 },
    'Magic Missile': { damage: '(7+3.5*spell_level)*0.9', fail_dmg: 1, cr: 0.5 },
    'Magic Jar': { cr: 10 },
    Maelstrom: { damage: '21', area_mult: 2, duration: 2 },
    'Mass Healing Word': { damage: '2.5*(spell_level-2)+mod', area_mult: 4, cr: 3 },
    'Mass Suggestion': { damage: 'this.true_cr * 6', area_mult: 3 },
    "Maximilian's Earthen Grasp": { damage: '7+this.true_cr*2', cost: { action: 2 }, duration: 2 },
    Maze: { damage: 'this.true_cr*10', fail_dmg: 1 },
    "Melf's Acid Arrow": { damage: '5+5*spell_level', fail_dmg: 0.3 },
    'Acid Arrow': { damage: '5+5*spell_level', fail_dmg: 0.3 },
    'Magic Stone': { damage: '3.5+mod', cost: { action: 3, bonus: 1 }, duration: 3 },
    'Mass Heal': { damage: '500', cr: 17 },
    "Melf's Minute Meteors": { damage: '14', area_mult: 1.5, cost: { action: 1, bonus: 1 }, duration: 2, fail_dmg: 0.5 },
    'Mental Prison': { damage: '82.5+this.true_cr*5', fail_dmg: 0.2 },
    'Meteor Swarm': { damage: '140', fail_dmg: 0.5, area_mult: 3, cr: 17 },
    'Mind Spike': { damage: '4.5+4.5*spell_level', fail_dmg: 0.5 },
    'Mirror Image': { cr: 0.5 },
    'Modify Memory': { damage: 'this.true_cr * 5' },
    Moonbeam: { damage: '5.5*spell_level', area_mult: 1.5, fail_dmg: 0.5, duration: 2 },
    "Mordenkainen's Sword": { damage: '16.5', cost: { action: 1, bonus: 1 }, duration: 2 },
    'Negative Energy Flood': { damage: '32.5', fail_dmg: 0.5 },
    'Arcane Sword': { damage: '16.5', cost: { action: 1, bonus: 1 }, duration: 2 },
    "Otiluke's Freezing Sphere": { damage: '3.5*(spell_level+4)', area_mult: 2.5, fail_dmg: 0.5 },
    'Freezing Sphere': { damage: '3.5*(spell_level+4)', area_mult: 2.5, fail_dmg: 0.5 },
    "Otto's Irresistible Dance": { damage: 'this.true_cr*4', duration: 2, fail_dmg: 1 },
    'Irresistible Dance': { damage: 'this.true_cr*4', duration: 2 },
    'Phantasmal Force': { damage: '3.5', duration: 2 },
    'Phantasmal Killer': { damage: '5.5*spell_level', duration: 2, cr: 2 },
    'Power Word Kill': { damage: '100', cr: 15, fail_dmg: 1 },
    'Power Word Stun': { damage: '80', cr: 12, fail_dmg: 1 },
    'Power Word Pain': { damage: '60', cr: 10, fail_dmg: 1 },
    'Poison Spray': { damage: '6.5*cantrip_level' },
    Polymorph: { cr: 3 },
    'Primal Savagery': { damage: '5.5*cantrip_level' },
    'Prismatic Spray': { damage: '40', area_mult: 2, fail_dmg: 0.5 },
    'Produce Flame': { damage: '4.5*cantrip_level' },
    'Psychic Scream': { damage: '60', area_mult: 4, fail_dmg: 0.4, cr: 15 },
    Pyrotechnics: { damage: 'this.true_cr', area_mult: 1.5 },
    'Ray of Enfeeblement': { damage: 'this.true_cr*2' },
    'Ray of Frost': { damage: '4.5*cantrip_level' },
    'Reverse Gravity': { damage: '35', area_mult: 2.5, fail_dmg: 1 },
    "Raulothim's Psychic Lance": { damage: '7+3.5*spell_level+10', fail_dmg: 0.3 },
    'Psychic Lance': { damage: '7+3.5*spell_level+10', fail_dmg: 0.3 },
    "Rime's Binding Ice": { damage: '4.5+4.5*spell_level+this.true_cr', area_mult: 2, fail_dmg: 0.4 },
    'Sacred Flame': { damage: '4.5*cantrip_level' },
    'Scorching Ray': { damage: '7+7*spell_level' },
    'Searing Smite': { damage: '3.5+3.5*spell_level', fail_dmg: 0.5, cr: 0.25 },
    'Sickening Radiance': { damage: '22+this.true_cr', area_mult: 2.5, duration: 1.5 },
    'Sleet Storm': { damage: 'this.true_cr', area_mult: 3, duration: 2 },
    Slow: { damage: 'this.true_cr*3', area_mult: 3, target_choice: true },
    'Shadow Blade': { damage: "4.5+4.5*~~((spell_level+1)/2)+this.mod('dex')", cost: { action: 2, bonus: 1 }, duration: 2 },
    'Shadow of Moil': { damage: '9', duration: 2 },
    'Shield of Faith': { cr: 0.5 },
    Shillelagh: { damage: '4.5+mod' },
    'Shocking Grasp': { damage: '4.5*cantrip_level' },
    Shatter: { damage: '4.5+4.5*spell_level', area_mult: 2, fail_dmg: 0.5, cr: 2 },
    Sleep: { damage: '7+3.5*spell_level', fail_dmg: 1, cr: 0.5 }, // Damage is added because it has offensive power
    'Spike Growth': { damage: '10', area_mult: 2, fail_dmg: 1, cr: 1 },
    'Spirit Guardians': { damage: '4.5*spell_level', area_mult: 2, duration: 2, fail_dmg: 0.5 },
    'Spirit Shroud': { damage: '((spell_level-2)*4.5)*cantrip_level', duration: 2 },
    'Spiritual Weapon': { damage: '4.5*~~(spell_level/2)+mod', cost: { bonus: 2 }, duration: 2 },
    'Staggering Smite': { damage: '25', fail_dmg: 0.5, cr: 2 },
    'Steel Wind Strike': { damage: '33', area_mult: 3, target_choice: true },
    'Stinking Cloud': { damage: 'this.true_cr*3', area_mult: 2, cr: 2 },
    'Storm Sphere': { damage: '3.5*spell_level', area_mult: 2, cost: { action: 1, bonus: 2 }, duration: 2 },
    "Snilloc's Snowball Swarm": { damage: '3.5+3.5*spell_level', area_mult: 1.5, fail_dmg: 0.5 },
    Suggestion: { damage: 'this.true_cr*2', cr: 0.5, fail_dmg: -0.5 },
    'Summon Aberration': { damage: '(8.5+spell_level)*~~(spell_level/2)', duration: 2 },
    'Summon Beast': { damage: '(8.5+spell_level)*~~(spell_level/2)', duration: 2, cr: 1 },
    'Summon Construct': { damage: '(10+spell_level)*~~(spell_level/2)', duration: 2 },
    'Summon Draconic Spirit': { damage: '(7.5+spell_level)*~~(spell_level/2)', duration: 2 },
    'Summon Fey': { damage: '(10+spell_level)*~~(spell_level/2)', duration: 2 },
    'Summon Elemental': { damage: '(9.5+spell_level)*~~(spell_level/2)', duration: 2 },
    'Summon Fiend': { damage: '(10+spell_level)*~~(spell_level/2)', duration: 2 },
    'Summon Lesser Demons': { damage: '21*(1+~~((spell_level-4)/2))', duration: 2 },
    'Summon Greater Demon': { damage: '(10+spell_level)*~~(spell_level/2)', duration: 2 },
    'Summon Shadowspawn': { damage: '(9.5+spell_level)*~~(spell_level/2)', duration: 2 },
    'Summon Undead': { damage: '(8.5+spell_level)*~~(spell_level/2)', duration: 2 },
    Sunbeam: { cost: { action: 2 }, damage: '35', area_mult: 1.7, fail_dmg: 0.4, duration: 2 },
    Sunburst: { damage: '54', area_mult: 2.5, fail_dmg: 0.4 },
    'Synaptic Static': { damage: '35', area_mult: 2, fail_dmg: 0.5 },
    "Tasha's Mind Whip": { damage: '15*min(spell_level-1,3)', fail_dmg: 0.3 },
    Telekinesis: { damage: '10.5', duration: 2 },
    'Thorn Whip': { damage: '3.5*cantrip_level' },
    Thunderclap: { damage: '3.5*cantrip_level', area_mult: 1.2 },
    'Thunderous Smite': { damage: '7', fail_dmg: 0.5, cr: 0.25 },
    'Thunder Step': { damage: '5.5*spell_level', area_mult: 1.5, fail_dmg: 0.5 },
    Thunderwave: { damage: '4.5+4.5*spell_level', area_mult: 1.5, fail_dmg: 0.5, cr: 1 },
    'Tidal Wave': { damage: '18', area_mult: 2, fail_dmg: 0.5 },
    'Toll the Dead': { damage: '5.5*cantrip_level' },
    Tsunami: { damage: '52.5+(this.true_cr-1)*3', area_mult: 2 },
    'Transmute Rock': { damage: 'this.true_cr * 3 + 9', area_mult: 2.5, duration: 2 },
    'Vampiric Touch': { damage: '3.5*spell_level*1.5', duration: 2 },
    'Vicious Mockery': { damage: '3.5*cantrip_level' }, // Enhanced damage due to the disadvantage effect
    'Vitriolic Sphere': { damage: '17.5+5*spell_level', area_mult: 2, fail_dmg: 0.3 },
    'Wall of Fire': { damage: '4.5+4.5*spell_level', area_mult: 2, fail_dmg: 1 },
    'Watery Sphere': { damage: 'this.true_cr*3', area_mult: 1.5 },
    Web: { damage: 'this.true_cr*3', area_mult: 1.7 },
    Weird: { damage: '42', area_mult: 3, duration: 1.5, target_choice: true },
    'Wither and Bloom': { damage: '5+(5+4.5+mod)*(spell_level-1)', fail_dmg: 0.7, target_choice: true },
    Wish: { damage: '500', cr: 17 },
    'Word of Radiance': { damage: '3.5*cantrip_level', area_mult: 1.5 },
    Whirlwind: { damage: '50', duration: 2, fail_dmg: 0.4 },
    'Wrathful Smite': { damage: '7', fail_dmg: 0.5 }, // Enhanced damage due to frightened condition
    'Zephyr Strike': { damage: '4.5+5.5', fail_dmg: 0.5 },
};
export const precast_spells = {
    Aid: (draft, level) => (draft.traits.hp_bonus += 10 * (level - 1)),
    'Armor of Agathys': (draft, level) => {
        draft.data.system.attributes.hp.temp += 5 * level;
    },
    Barkskin: (draft) => {
        if (draft.getArmorClass() < 16) {
            draft.data.system.attributes.ac.calc = 'flat';
            draft.data.system.attributes.ac.flat = 16;
            return true;
        }
        return false;
    },
    'Crown of Stars': (draft) => { },
    'Death Ward': (draft) => (draft.traits.hp_bonus += 7 * ((draft.cr + 5) / 6)),
    'False Life': (draft, level) => (draft.data.system.attributes.hp.temp += 2 + 5 * level),
    Foresight: (draft) => {
        draft.traits.ac_bonus += 4;
        draft.traits.atk_bonus += 4;
    },
    'Mage Armor': (draft) => {
        if (draft.getArmorClass() < 13 + draft.mod('dex')) {
            draft.temporary.ac.calc = 'mage';
            return true;
        }
        return false;
    },
    'Mind Blank': () => { },
    Regenerate: (draft) => (draft.traits.hp_bonus += 7 * ((draft.cr + 5) / 6)),
    Stoneskin: (draft) => draft.resistance('physical', true),
};
// Spell Traits only apply to the spells used in the first 3 rounds, so long spell lists dont get multiple traits
export const spell_traits = {};
const evil_spells = ['Animate Dead', 'Circle of Death', 'Create Undead', 'Summon Undead', 'Finger of Death', 'Magic Jar'];
export function removeEvilSpellsIfNotEvil(draft, spellLists) {
    const evil_alignments = [alignments.LE, alignments.NE, alignments.CE];
    if (evil_alignments.includes(draft.data.system.details.alignment))
        return;
    spellLists.forEach((spellList) => {
        Object.values(spellList).forEach((spellLevel) => {
            evil_spells.forEach((spell) => {
                const idx = spellLevel.indexOf(spell);
                if (idx === -1)
                    return;
                spellLevel.splice(idx, 1);
            });
        });
    });
}
