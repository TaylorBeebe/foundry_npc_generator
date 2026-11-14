import { ABREV, DRAFT_RETRIES, MODULE } from '../settings.js';
import { logger, pick, between, seeder, ordinalNumber, numberSign, multipleFilter, numberExtense, findItem, shuffle, elementFromList, updatePacks, getItemName, getItemDescription, parseCR, } from '../utils.js';
import { findNPCArt } from '../art.js';
import { traitsDraft } from './traits.js';
import { getActionType, getActivity, getAttackDamage, getSaveDamage, isClassSpellcasting, SpellPreparation, updateDescription, } from './item/item5e.js';
import { races } from './races.js';
import { jobs } from './jobs.js';
import { featureApply } from './item/features.js';
import { avgDmg, baseItems, formulaReplace, NonHeavyWeapons, weapons, } from './item/weapons.js';
import { TOKENIZER, tokenize } from '../../compatibility/tokenizer.js';
import { precast_spells, spells } from './item/spells.js';
import { ArmorStrenghtReplacement } from './item/armors.js';
import { setActiveEffects } from './item/effects.js';
const featureActivations = {
    Multiattack: 'action',
    Reckless: 'special',
    'Reckless Attack': 'special',
    Protection: 'reaction',
    Parry: 'reaction',
    'Second Wind': 'bonus',
    'Cunning Action': 'bonus',
    'Nimble Escape': 'bonus',
    'Uncanny Dodge': 'reaction',
    'Shield Bash': 'action',
    Taunt: 'bonus',
    'Lay on Hands': 'action',
    'Leadership (Recharges after a Short or Long Rest)': 'action',
    'Enlarge (Recharges after a Short or Long Rest)': 'action',
    'Invisibility (Recharges after a Short or Long Rest)': 'action',
    'Change Shape': 'action',
};
export var alignments;
(function (alignments) {
    alignments["LG"] = "Lawful Good";
    alignments["LN"] = "Lawful Neutral";
    alignments["LE"] = "Lawful Evil";
    alignments["NG"] = "Neutral Good";
    alignments["N"] = "Neutral";
    alignments["NE"] = "Neutral Evil";
    alignments["CG"] = "Chaotic Good";
    alignments["CN"] = "Chaotic Neutral";
    alignments["CE"] = "Chaotic Evil";
    //U = 'Unaligned',
})(alignments || (alignments = {}));
export const SKILLS = [
    'acr',
    'ani',
    'arc',
    'ath',
    'dec',
    'his',
    'ins',
    'itm',
    'inv',
    'med',
    'nat',
    'prc',
    'prf',
    'per',
    'rel',
    'slt',
    'ste',
    'sur',
];
export const ABILITIES = {
    str: 'Strenght',
    dex: 'Dexterity',
    con: 'Constitution',
    int: 'Intelligence',
    wis: 'Wisdom',
    cha: 'Charisma',
};
const XP_TABLE = [
    10, 58, 135, 308, 655, 1100, 1809, 2995, 4656, 5949, 7394, 10427, 12456, 15708, 19564, 22500, 27348, 30912, 34692,
    41267, 51659, 56991, 62583, 80920,
];
const CR_CONVERSION = [0, 0.125, 0.25, 0.5, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
/**
 * Base Class for NPC Drafting
 */
export class NPCDraft {
    /**
     * Creates an Actor
     * @returns Actor
     */
    static async create(data, options) {
        ui.notifications.notify('Building a NPC, please wait...');
        updatePacks();
        try {
            let draft;
            let nextData = data;
            for (let i = 0; i < DRAFT_RETRIES; i++) {
                draft = await new NPCDraft(nextData, options).prepare();
                if (draft.validate()) {
                    logger.debug('Draft Difficulty: ' + i);
                    return await draft.createActor();
                }
                logger.debug('Draft off parameters, creating new Draft. ' + draft.print());
                nextData = { ...data, seed: Math.floor(Math.random() * 1000000) };
            }
            const actor = await draft.createActor();
            logger.warn('This draft is off parameter. ' + draft.print());
            ui.notifications.warn('The NPC created is out of normal parameters, please check. Consider increasing its CR or try another race.');
            return actor;
        }
        catch (e) {
            ui.notifications.error('Something weird happened and NPC failed to build.');
            throw e;
        }
    }
    /**
     * Fits the character alignment in accordance to its race and job
     */
    static getAlignment(race, job, tags = new Set()) {
        const aligns = Object.keys(alignments);
        const alignMap = {
            good: ['LG', 'NG', 'CG'],
            neutral: ['LN', 'N', 'CN'],
            evil: ['LE', 'NE', 'CE'],
            lawful: ['LG', 'LN', 'LE'],
            chaotic: ['CG', 'CN', 'CE'],
        };
        const set = new Set();
        const filters = [job.alignment, race.alignment];
        tags.forEach((tag) => {
            if (tag in alignMap)
                filters.push(alignMap[tag]);
        });
        const choices = multipleFilter(set.size ? Array.from(set) : aligns, filters);
        return alignments[pick(choices)];
    }
    data = {
        type: 'npc',
        folder: '',
        name: '',
        img: 'icons/svg/mystery-man.svg',
        prototypeToken: {
            name: '',
            texture: {
                src: 'icons/svg/mystery-man.svg',
            },
            sight: {
                range: 0,
                visionMode: 'darkvision',
            },
            detectionModes: [],
        },
        flags: {
            npcgen: {
                name1: '',
                name2: '',
                name3: '',
                portrait: '',
                token: '',
                job: 'berserker',
                race: 'human',
                cr: '1/8',
                alignment: '',
                seed: ~~(seeder.rnd() * 1000000),
                biography: {
                    physical: {
                        age: '',
                        hair: '',
                        skin: '',
                        eyes: '',
                        sex: '',
                        height: '',
                        weight: '',
                    },
                    clothing: [],
                    personality: [],
                    flaws: [],
                    ideals: [],
                    bonds: [],
                    plot: [],
                },
            },
        },
        system: {
            abilities: {
                str: { value: 10, proficient: 0 },
                dex: { value: 10, proficient: 0 },
                con: { value: 10, proficient: 0 },
                int: { value: 10, proficient: 0 },
                wis: { value: 10, proficient: 0 },
                cha: { value: 10, proficient: 0 },
            },
            attributes: {
                movement: { burrow: 0, climb: 0, walk: 30, swim: 0, fly: 0, hover: false, units: 'ft' },
                ac: {
                    calc: 'default',
                    flat: 10,
                    formula: '',
                    _formula: (draft, options) => 0,
                },
                hp: { value: 0, max: 0, formula: '', temp: 0 },
                senses: { darkvision: 0, blindsight: 0, tremorsense: 0, truesight: 0, special: '', units: 'ft' },
                spellcasting: 'int',
                prof: 2,
            },
            skills: {
                acr: { value: 0, ability: 'dex' }, // acrobatics
                ani: { value: 0, ability: 'wis' }, // animal handling
                arc: { value: 0, ability: 'int' }, // arcana
                ath: { value: 0, ability: 'str' }, // athletics
                dec: { value: 0, ability: 'cha' }, // deception
                his: { value: 0, ability: 'int' }, // history
                ins: { value: 0, ability: 'wis' }, // insight
                itm: { value: 0, ability: 'cha' }, // investigation
                inv: { value: 0, ability: 'int' }, // intimidation
                med: { value: 0, ability: 'wis' }, // medicine
                nat: { value: 0, ability: 'int' }, // nature
                prc: { value: 0, ability: 'wis' }, // persuasion
                prf: { value: 0, ability: 'cha' }, // perception
                per: { value: 0, ability: 'cha' }, // performance
                rel: { value: 0, ability: 'int' }, // religion
                slt: { value: 0, ability: 'dex' }, // sleight of hand
                ste: { value: 0, ability: 'dex' }, // stealth
                sur: { value: 0, ability: 'wis' }, // survival
            },
            traits: {
                size: 'med',
                languages: { value: [], custom: '' },
                dr: { value: [] },
                di: { value: [] },
                dv: { value: [] },
            },
            details: {
                type: { value: 'humanoid', subtype: '' },
                alignment: '',
                cr: 0.125,
                source: ABREV,
                spellLevel: 0,
                biography: { value: '' },
                age: '',
                bond: '',
                eyes: '',
                flaw: '',
                gender: '',
                hair: '',
                height: '',
                ideal: '',
                skin: '',
                trait: '',
                weight: '',
            },
            resources: {
                legact: {
                    value: 0,
                    max: 0,
                },
                legres: {
                    value: 0,
                    max: 0,
                },
                lair: {
                    value: false,
                    initiative: 0,
                },
            },
            spells: {
                spell1: {
                    value: 0,
                    override: null,
                    max: 0,
                },
                spell2: {
                    value: 0,
                    override: null,
                    max: 0,
                },
                spell3: {
                    value: 0,
                    override: null,
                    max: 0,
                },
                spell4: {
                    value: 0,
                    override: null,
                    max: 0,
                },
                spell5: {
                    value: 0,
                    override: null,
                    max: 0,
                },
                spell6: {
                    value: 0,
                    override: null,
                    max: 0,
                },
                spell7: {
                    value: 0,
                    override: null,
                    max: 0,
                },
                spell8: {
                    value: 0,
                    override: null,
                    max: 0,
                },
                spell9: {
                    value: 0,
                    override: null,
                    max: 0,
                },
                pact: {
                    value: 0,
                    override: null,
                    max: 0,
                    level: 0,
                },
            },
            currency: {
                pp: 0,
                gp: 0,
                ep: 0,
                sp: 0,
                cp: 0,
            },
        },
        effects: [],
    };
    items = [];
    multiattacks = {
        desc: '{{name}} makes {{attacks}} weapon attacks.',
        attacks: [],
    };
    innateSpells = {
        ability: 'cha',
        comment: '',
        spells: [],
    };
    spellcasting = {
        class: '',
        level: 0,
        cantrip_level: 1,
        prepared: false,
        comment: '',
        special: '',
        spells: [],
        spellSlots: [0, 0, 0, 0, 0, 0, 0, 0, 0],
    };
    specialEquipment = '';
    temporary = {
        ac: { calc: null, flat: 10, formula: '', _formula: (draft, options) => 0 },
        dr: { value: [] },
        di: { value: [] },
        dv: { value: [] },
    };
    race;
    job;
    cr;
    true_cr;
    hit_dice;
    offensive_power;
    target_hp;
    seed;
    actor;
    traits = {
        ac_bonus: 0,
        hp_bonus: 0,
        max_hp_con_bonus: 0,
        atk_bonus: 0,
        global_atk_bonus: 0,
        atk_bonus_weapon: 0,
        global_atk_bonus_weapon_ranged: 0,
        global_atk_bonus_weapon_melee: 0,
        dpr_bonus_melee_attack: 0,
        dpr_bonus_ranged_attack: 0,
        dpr_bonus_attack_round: 0,
        dpr_bonus_ranged_round: 0,
        dpr_bonus_melee_round: 0,
        extra_dice_melee: 0,
        shield: false,
        ranged: false,
        spell_evo_area_bonus: 0,
        spell_slots: [0, 0, 0, 0, 0, 0, 0, 0, 0],
        actions: {
            action: 3,
            bonus: 3,
            reaction: 3,
            lair: 3,
            legendary: 9,
        },
    };
    errors = 0;
    constructor(data = {}, options) {
        const config = this.data.flags.npcgen;
        foundry.utils.mergeObject(config, data);
        if (options?.folder)
            this.data.folder = options.folder;
        this.data.name = [config.name1, config.name2, config.name3].filter(Boolean).join(' ');
        this.race = races[config.race];
        this.job = jobs[config.job];
        this.cr = this.data.system.details.cr = parseCR(config.cr);
        this.true_cr = this.getTrueCR();
        if (this.true_cr < 0)
            throw new RangeError(`Unsupported challenge rating: ${config.cr}`);
        this.hpLevel = config.hpLevel ?? game.settings.get(MODULE, 'hp-level') ?? 'low';
        this.data.system.attributes.prof = Math.ceil(Math.max(2, (this.cr + 4) / 4));
        const token = this.data.prototypeToken;
        const setting = (key) => game.settings.get(MODULE, key);
        const title = (value) => value.replace(/\b\p{L}/gu, (letter) => letter.toUpperCase());
        const sex = config.biography?.physical?.sex?.trim().toUpperCase().charAt(0) ?? '';
        if (config.generic)
            this.data.name = ['A', title(config.race), sex, title(config.job)].filter(Boolean).join(' ');
        const tokenMode = config.tokenNameMode ?? setting('token-name-mode');
        token.name = config.generic ? title(config.job) : tokenMode === 'full' ? this.data.name
            : tokenMode === 'custom' ? (config.customTokenName ?? setting('custom-token-name'))?.trim() || config.name1
            : config.name1;
        token.disposition = Number(config.disposition ?? setting('token-disposition') ?? 0);
        token.actorLink = !config.generic && (config.actorLink ?? setting('named-token-link') ?? true);
        token.appendNumber = Boolean(config.generic);
        token.lockRotation = config.lockRotation ?? setting('token-lock-rotation') ?? false;
        const scale = Number(config.tokenScale ?? setting('token-scale') ?? 1);
        token.texture.scaleX = token.texture.scaleY = Number.isFinite(scale) && scale > 0 ? scale : 1;
        this.artFiles = options?.artFiles;
        this.data.img = config.portrait || this.data.img;
        this.data.prototypeToken.texture.src = config.token || this.data.img;
        seeder.seed(config.seed);
        this.seed = config.seed;
        this.data.system.details.biography.value = `<section class="secret"><p>Race: ${config.race}<br>Job: ${config.job}<br>CR: ${this.cr}<br>Seed: ${config.seed}</p></section>`;
        if (!config.alignment)
            config.alignment = this.getAlignment();
        this.data.system.details.alignment = config.alignment;
    }
    async prepare() {
        this.randomizeAbilities();
        await this.applyRace();
        await this.applyJob();
        this.learnLanguages();
        this.applyVision();
        await this.prepareInnateSpellcasting();
        await this.prepareSpellcasting();
        await this.prepareSpecialEquipment();
        await this.prepareMultiattack();
        this.generateTreasure();
        const traits = this.getTraits();
        this.updateWeaponsDamage(traits);
        this.setOffensePower(traits);
        this.setHP(traits);
        this.updateItemsDescription(traits);
        this.writeBio();
        return this;
    }
    get str() {
        return this.data.system.abilities.str.value;
    }
    get dex() {
        return this.data.system.abilities.dex.value;
    }
    get con() {
        return this.data.system.abilities.con.value;
    }
    get int() {
        return this.data.system.abilities.int.value;
    }
    get wis() {
        return this.data.system.abilities.wis.value;
    }
    get cha() {
        return this.data.system.abilities.cha.value;
    }
    set str(value) {
        this.data.system.abilities.str.value = value;
    }
    set dex(value) {
        this.data.system.abilities.dex.value = value;
    }
    set con(value) {
        this.data.system.abilities.con.value = value;
    }
    set int(value) {
        this.data.system.abilities.int.value = value;
    }
    set wis(value) {
        this.data.system.abilities.wis.value = value;
    }
    set cha(value) {
        this.data.system.abilities.cha.value = value;
    }
    get prof() {
        return this.data.system.attributes.prof;
    }
    getTrueCR() {
        return CR_CONVERSION.indexOf(this.cr);
    }
    /**
     * Returns the estimated Armor Class of the actor
     * @returns Calculated AC
     */
    getArmorClass() {
        const ac = this.temporary.ac.calc ? this.temporary.ac : this.data.system.attributes.ac;
        if (['draconic', 'mage'].includes(ac.calc))
            return 13 + this.mod('dex');
        if (ac.calc === 'flat')
            return ac.flat;
        const equipments = this.items.filter((item) => item.type === 'equipment');
        const shield = equipments.find((item) => item.system.type.value === 'shield');
        const shield_bonus = shield ? shield.system.armor.value : 0;
        const armor = equipments.find((item) => ['light', 'medium', 'heavy'].includes(item.system.type.value));
        const armor_bonus = armor ? armor.system.armor.value : 10;
        const dex_bonus = armor?.system.type.value === 'heavy' ? 0 : Math.min(this.mod('dex'), armor?.system.armor.dex ?? 20);
        if (ac.calc === 'custom')
            return ac._formula(this, { dex_bonus, shield_bonus, armor_bonus });
        return armor_bonus + shield_bonus + dex_bonus;
    }
    /**
     * Fits the character alignment in accordance to its race and job
     */
    getAlignment() {
        const aligns = Object.keys(alignments);
        return alignments[pick(multipleFilter(aligns, [this.job.alignment, this.race.alignment]))];
    }
    learnLanguages() {
        const languages = [
            'aarakocra',
            'abyssal',
            'aquan',
            'auran',
            'celestial',
            'common',
            'deep',
            'draconic',
            'dwarvish',
            'elvish',
            'giant',
            'gith',
            'gnoll',
            'gnomish',
            'goblin',
            'halfling',
            'ignan',
            'infernal',
            'orc',
            'primordial',
            'sylvan',
            'terran',
            'undercommon',
        ];
        for (let i = this.int; i > 13; i -= 2)
            this.language(pick(languages));
    }
    /**
     * Randomize all attributes to either odd or even numbers
     */
    randomizeAbilities() {
        this.str += pick([0, 1]);
        this.dex += pick([0, 1]);
        this.con += pick([0, 1]);
        this.int += pick([0, 1]);
        this.wis += pick([0, 1]);
        this.cha += pick([0, 1]);
    }
    /**
     * Apply the character race
     */
    async applyRace() {
        await this.race.apply(this);
    }
    /**
     * Apply the character job
     */
    async applyJob() {
        await this.job.apply(this);
    }
    /**
     * Apply the target vision to the token
     */
    applyVision() {
        const senses = this.data.system.attributes.senses;
        const devilSight = this.items.find((item) => getItemName(item) === "Devil's Sight");
        this.data.prototypeToken.sight.range = Math.max(devilSight ? senses.darkvision : 0, senses.blindsight, senses.truesight);
        if (devilSight || senses.truesight)
            this.data.prototypeToken.sight.visionMode = 'basic';
    }
    /**
     * Inserts an multiattack to the Actor Draft
     * @param items Items composing the multiattack, in order
     */
    multiattack(items) {
        const attacks = items.filter(Boolean);
        if (attacks.length)
            this.multiattacks.attacks.push(attacks);
    }
    /**
     * Gives the character an specific elemental resistance
     * @param element
     */
    resistance(element, temporary = false) {
        if (temporary) {
            if (!this.temporary.dr.value.includes(element))
                this.temporary.dr.value.push(element);
        }
        else {
            if (!this.data.system.traits.dr.value.includes(element))
                this.data.system.traits.dr.value.push(element);
        }
    }
    /**
     * Gives the character an specific elemental immunity
     * @param element
     */
    immunity(element, temporary = false) {
        if (temporary) {
            if (!this.temporary.di.value.includes(element))
                this.temporary.di.value.push(element);
        }
        else {
            if (!this.data.system.traits.di.value.includes(element))
                this.data.system.traits.di.value.push(element);
        }
    }
    language(language) {
        if (!this.data.system.traits.languages.value.includes(language))
            this.data.system.traits.languages.value.push(language);
    }
    /**
     * Adds an innate spell to the Draft
     * @param name Innate spell to be added
     * @param uses Uses per day
     * @param comment Comment in quotas, after spell name
     */
    async innate(name, uses = { max: 0, period: '' }, comment = '') {
        const item = (await this._insertItem('spells', name));
        if (item) {
            const activityDC = getActivity(item, 'save')?.save?.dc;
            if (activityDC)
                activityDC.calculation = this.innateSpells.ability;
            item.system.method = uses.max ? 'innate' : 'atwill';
            if (uses.max)
                item.system.uses = { max: uses.max, spent: 0, recovery: [] };
            if (uses.period)
                item.system.uses.recovery.push({ period: uses.period, type: 'recoverAll', formula: '' });
            this.innateSpells.spells.push([item, false, comment]);
        }
        return item;
    }
    async spell(name, prepared = true, comment = '') {
        const item = (await this._insertItem('spells', name));
        if (!item)
            return item;
        const pact_magic = this.spellcasting.class === 'warlock';
        if (pact_magic && item.system.level)
            item.system.method = 'pact';
        let beforeCombat = false;
        if (prepared) {
            item.system.prepared = SpellPreparation.true;
            if (item.system.level) {
                let spell_level = item.system.level;
                const pact_magic = this.spellcasting.class === 'warlock';
                if (pact_magic)
                    spell_level = this.data.system.spells.pact.level;
                if (name in precast_spells)
                    beforeCombat = precast_spells[name](this, spell_level) ?? true;
                if (beforeCombat) {
                    if (pact_magic)
                        this.data.system.spells.pact.value = Math.max(0, this.data.system.spells.pact.value - 1);
                    else {
                        this.spellcasting.spellSlots[spell_level - 1] = Math.max(0, this.spellcasting.spellSlots[spell_level - 1] - 1);
                        this.data.system.spells[('spell' + spell_level)]
                            .value = this.spellcasting.spellSlots[spell_level - 1];
                    }
                }
            }
            this.spellcasting.spells.push([item, beforeCombat, comment]);
        }
        setActiveEffects(item.effects, beforeCombat);
        return item;
    }
    /**
     * Draw spells for the given spell lists
     * @param spells_primary Primary Spell List
     * @param spells_utility Utility Spell List - Spells wich do not affect combat
     * @param spells_drawn An array with the number of spells to draw at each spell level
     * @param draw_primary Wether the first spell of each level should be a primary or utility spell
     */
    async draftSpellList(spells_primary, spells_utility, spells_drawn, prepared = true) {
        for (let level = 0; level < spells_drawn.length; level++) {
            const slot = spells_drawn[level];
            let spellLevel = level;
            for (let i = 0; i < slot; i++) {
                const primary = 1 - (i % 2);
                let spell;
                let k = 0;
                while (!spell || this.cr < (spells[spell]?.cr ?? 0) || !findItem(spell, 'spells')) {
                    spell = (primary ? spells_primary[spellLevel] : spells_utility[spellLevel])?.pop();
                    if (!spell) {
                        const mixed_list = [...spells_primary[spellLevel], ...spells_utility[spellLevel]];
                        spells_primary[spellLevel] = mixed_list;
                        spells_utility[spellLevel] = mixed_list;
                        if (mixed_list.length === 0)
                            spellLevel--;
                    }
                    k++;
                    if (k++ > 100) {
                        throw new Error(`Failed to draft spells from ${this.race} / ${this.job} (#${this.seed})`);
                    }
                }
                await this.spell(spell, prepared);
            }
        }
    }
    /**
     * Creates and prepares the innate spellcasting feature
     */
    async prepareInnateSpellcasting() {
        if (!this.innateSpells.spells.length)
            return;
        const feat = (await this.feature('Innate Spellcasting'));
        if (!feat)
            return;
        const map = this.innateSpells.spells.map(([spell, beforeCombat, comment]) => [
            `${spell.system.uses.max ?? 0}/${spell.system.uses.recovery?.[0]?.period ?? ''}`,
            spell.name + (beforeCombat ? '*' : comment ? ` (${comment})` : ''),
        ]);
        const byType = {};
        for (const [use] of map)
            byType[use] = [];
        for (const [use, spell] of map)
            byType[use].push(spell);
        let desc = '<ul>';
        if ('0/' in byType) {
            desc += `<li>At will: ${byType['0/'].join(', ')}</li>`;
            delete byType['0/'];
        }
        Object.entries(byType).forEach(([use, spell]) => (desc += `<li>${use} each: ${spell.join(', ')}</li>`));
        desc += '</ul>';
        if (this.innateSpells.spells.find(([spell, beforeCombat]) => beforeCombat))
            desc += '<br>* The {{job}} casts these spells on itself before combat.';
        feat.system.description.value += desc;
        if (this.innateSpells.comment)
            feat.name += ` (${this.innateSpells.comment})`;
    }
    /**
     * Creates and prepares the spellcasting feature
     */
    async prepareSpellcasting() {
        if (!this.spellcasting.spells.length)
            return;
        const pactMagic = this.spellcasting.class === 'warlock', prepares = 'It has the following {{caster_class}} spells prepared', knows = 'It knows the following {{caster_class}} spells', special = this.spellcasting.special + (this.spellcasting.prepared ? prepares : knows);
        const feat = (await this.feature('Spellcasting', undefined, {
            special,
        }));
        if (!feat)
            return;
        const map = this.spellcasting.spells.map(([spell, beforeCombat, comment]) => [
            spell.system.level === 0
                ? 'cantrip'
                : spell.system.method === 'atwill'
                    ? 'atwill'
                    : '' + spell.system.level,
            spell.name + (beforeCombat ? '*' : comment ? ` (${comment})` : ''),
        ]);
        const byType = {};
        for (const [level] of map)
            byType[level] = [];
        for (const [level, spell] of map)
            byType[level].push(spell);
        let desc = '<ul>';
        if ('atwill' in byType) {
            desc += `<li>Spells (at will): ${byType['0/'].join(', ')}</li>`;
            delete byType['atwill'];
        }
        if ('cantrip' in byType) {
            desc += `<li>Cantrips (at will): ${byType['cantrip'].join(', ')}</li>`;
            delete byType['cantrip'];
        }
        if (pactMagic && Object.keys(byType).length) {
            const slots = this.getPactSpellcasting();
            const levels = Object.keys(byType).sort((a, b) => +a - +b);
            const lowestLevel = levels[0];
            const highestLevel = levels[levels.length - 1];
            const singleLevel = levels.length === 1;
            const spells = Object.values(byType).flat();
            if (singleLevel)
                desc += `<li>${ordinalNumber(+lowestLevel)} level (${slots.max} ${ordinalNumber(slots.level)}-level slots): ${spells.join(', ')}</li>`;
            else
                desc += `<li>${ordinalNumber(+lowestLevel)}-${ordinalNumber(+highestLevel)} level (${slots.max} ${ordinalNumber(slots.level)}-level slots): ${spells.join(', ')}</li>`;
        }
        else {
            const slots = this.getSpellcasting();
            Object.entries(byType).forEach(([level, spell]) => (desc += `<li>${ordinalNumber(+level)} level (${slots[+level - 1]} slots): ${spell.join(', ')}</li>`));
        }
        desc += '</ul>';
        if (this.spellcasting.spells.find(([spell, beforeCombat]) => beforeCombat))
            desc += '<br>* The {{job}} casts these spells on itself before combat.';
        feat.system.description.value += desc;
        if (this.spellcasting.comment)
            feat.name += ` (${this.spellcasting.comment})`;
    }
    /**
     * Creates and prepares the Special Equipment feature
     */
    async prepareSpecialEquipment() {
        if (!this.specialEquipment)
            return;
        const item = (await this.feature('Special Equipment'));
        if (item)
            item.system.description.value = this.specialEquipment;
    }
    /**
     * Creates and prepares the Multiattack feature
     */
    async prepareMultiattack() {
        if (!this.multiattacks.attacks.length)
            return;
        const bite = this.items.find((item) => getItemName(item) === 'Bite');
        if (bite && this.multiattacks.attacks[0].length === 1) {
            const attack = this.multiattacks.attacks[0][0];
            const weapon = attack.system.type.baseItem;
            this.multiattacks.attacks[0].push(bite);
            this.multiattacks.desc = `The {{race}} makes two melee attacks: one with its bite and one with its ${weapon}.`;
        }
        if (this.multiattacks.attacks[0].length < 2)
            return;
        const item = (await this.feature('Multiattack'));
        if (!item)
            return;
        item.system.description.value = this.multiattacks.desc;
        updateDescription(item, { attacks: numberExtense(this.multiattacks.attacks[0].length) });
    }
    /**
     * Sets a skill to a proficiency bonus
     * @param skill Skill to change
     * @param prof Proficiency multiplier
     */
    skill(skill, prof = 1) {
        this.data.system.skills[skill].value = prof;
    }
    /**
     * Gives save proficiency to an ability
     * @param ability lity Ability
     * @param prof
     */
    save(ability, prof = 1) {
        this.data.system.abilities[ability].proficient = prof;
    }
    /**
     * Return list of actions with their type, damage and frequency within 3 rounds
     * @param traits Character traits
     * @returns [damage: number, frequency: number, type: string]
     */
    getActions(traits = this.getTraits()) {
        const spells = this.spellcasting.spells.map(([spell]) => spell).filter((spell) => spell.system.level > 0 && isClassSpellcasting(spell));
        return this.multiattacks.attacks
            .concat(this.items.filter((item) => !spells.includes(item)).map((item) => [item]))
            .map((item) => this.evaluateDmg(item, traits))
            .filter((dmg) => dmg.damage);
    }
    /**
     * Returns the cantrip power level
     * @returns Cantrip Level
     */
    cantripLevel() {
        const casterLevel = Math.max(this.spellcasting.level, this.cr, 1);
        return ~~((casterLevel + 1) / 6) + 1;
    }
    /**
     * Evaluates what ability an item gets its CD or bonus from
     * @param item Item to be evaluated
     */
    getItemAbility(item) {
        const activity = getActivity(item, 'attack') ?? getActivity(item);
        if (!activity)
            return 'flat';
        if (activity.type === 'attack') {
            if (activity.attack.flat)
                return 'flat';
            const ability = activity.attack.ability;
            if (ability in this.data.system.abilities && !item.system.properties?.includes('fin'))
                return ability;
            const melee = activity.attack.type.value !== 'ranged';
            if (melee) {
                let ability = 'str';
                const str = this.mod('str'), dex = this.mod('dex');
                const finesse = item.system.properties.includes('fin');
                if (finesse && dex > str)
                    ability = 'dex';
                return ability;
            }
            return 'dex';
        }
        if (activity.save?.dc) {
            const dc = activity.save.dc;
            if (dc.calculation === 'spellcasting')
                return this.data.system.attributes.spellcasting;
            if (dc.calculation === '')
                return 'flat';
            return dc.calculation;
        }
        return 'flat';
    }
    getItemMaxUse(item, traits = this.getTraits()) {
        if ('recharge' in item.system && item.system.recharge.value)
            return (7 - item.system.recharge.value) / 3 + +item.system.recharge.charged;
        if (item.type === 'spell') {
            if (item.system.level === 0)
                return 3;
            if (item.system.method === 'atwill')
                return 3;
            if (isClassSpellcasting(item)) {
                return Math.max(0, ...traits.spell_slots);
            }
        }
        return Number(item.system.uses?.max) || 3;
    }
    getItemCost(item) {
        const activation = getActivity(item)?.activation ?? item.system.activation;
        return { [activation?.type || 'action']: 1 };
    }
    evaluateDmg(items, traits = this.getTraits()) {
        function processDamage(formula, bonus = 0) {
            return `(${formula})*(1+0.1*${bonus})`;
        }
        function processDamageParts(parts) {
            return parts
                .filter(([, type]) => !['', 'healing', 'temphp'].includes(type))
                .map(([formula]) => formula)
                .join('+');
        }
        const getScalingMod = (item) => {
            const saveActivity = getActivity(item);
            const save = saveActivity?.save;
            if (!save)
                return 10 + this.prof;
            try {
                if (save.dc.calculation === '')
                    return +save.dc.formula - 8 - this.prof;
                if (save.dc.calculation === 'spellcasting')
                    return this.mod(this.data.system.attributes.spellcasting);
                return this.mod(save.dc.calculation);
            }
            catch {
                return 10 + this.prof;
            }
        };
        const item = { level: 0 }, prof = this.prof, cantrip_level = this.spellcasting.cantrip_level;
        let cost = {};
        if (items.length > 1) {
            cost['action'] = 1;
        }
        else {
            const activity = getActivity(items[0]) ?? {
                activation: { type: 'action', value: 1 },
            };
            if (activity.activation)
                cost[activity.activation.type] = activity.activation.value ?? 1;
            else
                cost['action'] = 1;
        }
        let damage = 0, weapon_attacks = 0, melee_attacks = 0, ranged_attacks = 0, frequency = Math.min(...items.map((item) => this.getItemMaxUse(item, traits)));
        items.forEach((item) => {
            const ability = this.getItemAbility(item), mod = ability === 'flat' && item.type !== 'weapon'
                ? +(getActivity(item)?.save?.dc.formula ?? '10') - 8 - this.prof
                : this.mod(ability);
            let fail_dmg = 0, damage_formula = '0', bonus = this.prof + mod, area_mult = 1;
            if (item.type === 'weapon') {
                const item_damage = item.name in weapons ? weapons[item.name] : getAttackDamage(item);
                if (item_damage.versatile && !traits.shield)
                    item_damage.parts[0][0] = item_damage.versatile;
                const attackBonus = getActivity(item, 'attack')?.attack.bonus || '0';
                bonus += traits.atk_bonus + traits.atk_bonus_weapon + (Number(attackBonus) || 0) +
                    (Number(item.system.magicalBonus) || 0) + traits.global_atk_bonus;
                damage_formula = processDamageParts(item_damage.parts) || '0';
                const actionType = getActionType(item);
                if (actionType === 'mwak') {
                    if (!melee_attacks)
                        damage_formula += '+' + traits.dpr_bonus_melee_round;
                    damage_formula += '+' + traits.dpr_bonus_melee_attack;
                    bonus += traits.global_atk_bonus_weapon_melee;
                    melee_attacks++;
                }
                if (actionType === 'rwak') {
                    if (!ranged_attacks)
                        damage_formula += '+' + traits.dpr_bonus_ranged_round;
                    damage_formula += '+' + traits.dpr_bonus_ranged_attack;
                    bonus += traits.global_atk_bonus_weapon_ranged;
                    ranged_attacks++;
                }
                if (!weapon_attacks)
                    damage_formula += '+' + traits.dpr_bonus_attack_round;
                weapon_attacks++;
                // Extra Damage in case a save is triggered on weapon hit
                const save_damage = getSaveDamage(item);
                if (save_damage) {
                    const mod_diff = getScalingMod(item) - mod;
                    const bonus = mod_diff + fail_dmg * 10 - 5;
                    const extraDamage = processDamageParts(save_damage.damage);
                    if (extraDamage)
                        damage_formula += '+' + processDamage(extraDamage, bonus);
                }
            }
            else {
                if (item.type === 'spell') {
                    if (getItemName(item) in spells) {
                        if (item.system.level === 0 || !isClassSpellcasting(item)) {
                            const res = this.evaluateSpellDmg(item, item.system.level, traits);
                            if (items.length === 1) {
                                delete res.cost.slot;
                                for (const key in res.cost) {
                                    res.cost[key];
                                }
                                cost = res.cost;
                            }
                            damage += res.damage;
                            return;
                        }
                    }
                }
                else {
                    const item_damage = getSaveDamage(item);
                    if (item_damage) {
                        damage_formula = processDamageParts(item_damage.damage) || '0';
                        fail_dmg = +Boolean(/half as much damage/.exec(getItemDescription(item))) * 0.5;
                        const targetType = getActivity(item)?.target.template.type;
                        if (targetType && ['line', 'cone', 'radius', 'sphere'].includes(targetType))
                            area_mult = 2;
                    }
                }
                bonus += 10 * fail_dmg;
            }
            damage_formula = processDamage(damage_formula, bonus - 3);
            damage_formula = damage_formula
                .replaceAll(/d[0-9]+/g, (str) => '*' + (Number(str.slice(1)) + 1) / 2)
                .replaceAll('@', '')
                .replaceAll(/\[.+?\]/g, '');
            damage += eval(damage_formula) * area_mult;
        });
        const name = items.length > 1 ? 'Multiattack' : items[0].name;
        logger.debug(`Offensive Power (${name}): ${damage} (${JSON.stringify(cost)}) * ${frequency}`);
        return { damage, cost, max: frequency, items };
    }
    evaluateSpellDmg(item, spell_level, traits = this.getTraits()) {
        if (item.system.level > spell_level)
            return { damage: 0, cost: {}, max: 0, items: [] };
        const cantrip = item.system.level === 0;
        const innate = !isClassSpellcasting(item);
        const itemName = getItemName(item);
        const cost = {
            action: 0,
            bonus: 0,
            reaction: 0,
        };
        if (!innate && !cantrip)
            cost.slot = spell_level;
        //const original_spell_level = item.system.level;
        //spell_level = original_spell_level;
        const spell = spells[itemName];
        if (!spell)
            return { damage: 0, cost: {}, max: 0, items: [] };
        foundry.utils.mergeObject(cost, spell.cost ?? this.getItemCost(item));
        const duration = spell.duration ?? 1;
        const damage_formula = spell.damage ?? '0'; //'5+8*original_spell_level'
        const fail_dmg = spell.fail_dmg ?? 0;
        let area_mult = spell.area_mult ?? 1;
        if (!spell.target_choice && item.system.school === 'evo' && area_mult > 1.5)
            area_mult = ((area_mult + traits.spell_evo_area_bonus) / (4 + traits.spell_evo_area_bonus)) * 4;
        const abilityScaling = innate ? this.innateSpells.ability : this.data.system.attributes.spellcasting;
        const mod = abilityScaling === 'flat' ? 0 : this.mod(abilityScaling);
        const bonus = this.prof + mod - 3;
        const cantrip_level = this.spellcasting.cantrip_level;
        const max = Math.max, min = Math.min;
        const counterspell_fx = 0.1;
        const counterspell_dmg_reduction = ((this.true_cr - 1) / 10) * counterspell_fx * (1 + 0.1 * (spell_level - 5));
        // The existing offense scale treats a 50% chance as a weight of 1.
        const successWeight = Math.clamp(1 + 0.1 * bonus, 0, 2);
        const saveWeight = successWeight + (2 - successWeight) * fail_dmg;
        const damage = eval(damage_formula) * saveWeight * duration * area_mult * (1 - counterspell_dmg_reduction);
        const totalCost = cost.action + cost.bonus + cost.reaction;
        const avgDmg = damage / totalCost;
        if (cost.action)
            cost.action /= totalCost;
        if (cost.bonus)
            cost.bonus /= totalCost;
        if (cost.reaction)
            cost.reaction /= totalCost;
        if (!cost.action)
            delete cost.action;
        if (!cost.bonus)
            delete cost.bonus;
        if (!cost.reaction)
            delete cost.reaction;
        const uses = innate || cantrip ? this.getItemMaxUse(item, traits) : 1;
        logger.debug(`Offensive Power (${itemName}): ${damage} (${JSON.stringify(cost)}) * ${totalCost}`);
        return {
            damage: avgDmg,
            cost,
            max: totalCost * uses,
            items: [item],
        };
    }
    async item(name, description_update = {}) {
        const itemExist = this.items.find((item) => getItemName(item) === name);
        if (itemExist)
            return itemExist;
        const item = await this._insertItem('items', name, description_update);
        if (!item)
            return;
        if ('equipped' in item.system)
            item.system.equipped = true;
        if ('proficient' in item.system)
            item.system.proficient = true;
        return item;
    }
    async armor(armors) {
        if (typeof armors === 'string')
            armors = [armors];
        let item;
        let heavyName;
        if (armors.length > 1)
            shuffle(armors);
        for (const name of armors) {
            const candidate = await this.item(name);
            if (!candidate)
                continue;
            const minimum = candidate.system.strength ?? 0;
            if (this.str >= minimum || ['dwarf', 'duergar'].includes(this.race.name)) {
                item = candidate;
                break;
            }
            heavyName = name;
            this.removeItem(name);
        }
        if (!item && ArmorStrenghtReplacement[heavyName])
            item = await this.item(pick(ArmorStrenghtReplacement[heavyName]));
        const dex_mod = this.mod('dex');
        if (item &&
            (item.system.armor.value ?? 0) > 2 &&
            (item.system.armor.value ?? 0) + Math.min(dex_mod, item.system.armor.dex ?? 20) < 12 + dex_mod) {
            this.removeItem(getItemName(item));
            item = (await this.item('Studded Leather Armor'));
        }
        return item;
    }
    async weapon(name, update_description = true, special = '') {
        const item = (await this.item(name));
        if (!item)
            return;
        if (update_description)
            this.updateWeaponDescription(item, special);
        if (this.data.system.traits.size === 'sm' && item.system.properties.includes('hvy'))
            logger.error(`Small creature equipping a heavy weapon: ${this.race.name} / ${name} (${item.system.type.baseItem})`);
        return item;
    }
    pickFavoredWeapon(list) {
        return pick(multipleFilter(list, [
            this.race.favoredWeapons,
            this.data.system.traits.size === 'sm' ? NonHeavyWeapons : undefined,
        ]));
    }
    async feature(name, options, description_update = {}) {
        const featExist = this.items.find((item) => getItemName(item) === name);
        if (featExist)
            return featExist;
        const feat = (await this._insertItem('features', name, description_update));
        if (!feat)
            return;
        featureApply[name]?.(this, feat, options);
        const activationType = featureActivations[name] ?? feat.system.activation?.type;
        const activeTypes = ['action', 'bonus', 'reaction', 'special', 'legendary', 'lair'];
        if (feat.type === 'feat' && activeTypes.includes(activationType) &&
            !Object.keys(feat.system.activities ?? {}).length &&
            (game.settings.get(MODULE, 'feature-activities') ?? true)) {
            const id = foundry.utils.randomID();
            feat.system.activities = {
                [id]: { _id: id, type: 'utility', name: feat.name, activation: {
                    type: activationType, value: feat.system.activation?.value ?? 1, override: true,
                } },
            };
        }
        return feat;
    }
    removeItem(name) {
        return this.items.findSplice((item) => getItemName(item) === name);
    }
    removeFeature(name) {
        return this.removeItem(name);
    }
    updateWeaponDescription(item, special = '') {
        if (item.type !== 'weapon' || !getActivity(item, 'attack'))
            return;
        const damage = getAttackDamage(item);
        if (!damage.parts.length)
            return;
        const versatile = Boolean(damage.versatile), thrown = item.system.properties.includes('thr'), shield = this.items.find((item) => item.type === 'equipment' && item.system.type.value === 'shield'), twohanded = item.system.properties.includes('two') || (versatile && !shield), ranged = getActionType(item) === 'rwak', type = twohanded ? 'Two-handed' : 'One-handed', name = item.system.type.baseItem in baseItems
            ? baseItems[item.system.type.baseItem]
            : item.system.type.baseItem?.toLowerCase() ?? item.name, ability = this.getItemAbility(item);
        const descriptions = {
            mwak: `<p><i>Melee Weapon Attack (<b>${type}</b>):</i> [[/r 1d20 + {{atk_bonus}}]] (<b>{{signed_atk_bonus}}</b>) to hit, reach {{reach}} ft., one target.`,
            thrown: `<p><i>Melee (<b>${type}</b>) or Ranged Weapon Attack:</i> [[/r 1d20 + {{atk_bonus}}]] (<b>{{signed_atk_bonus}}</b>) to hit, reach {{reach}}, or range {{item.system.range.value}}/{{item.system.range.long}} ft., one target.`,
            rwak: `<p><i>Ranged Weapon Attack:</i> [[/r 1d20 + {{atk_bonus}}]] (<b>{{signed_atk_bonus}}</b>) to hit, range {{item.system.range.value}}/{{item.system.range.long}} ft., one target.`,
            hit: (formula, special) => {
                const regex = /[0-9]+/;
                const calcHit = (part, melee = false) => {
                    const dmg = part[0].replaceAll(/\[.+?\]/g, '');
                    const physical = ['piercing', 'bludgeoning', 'slashing'].includes(part[1]);
                    const avg_dmg = avgDmg(dmg, physical && melee), formula = formulaReplace(dmg, physical && melee);
                    parts.push(`<b>{{~~(${avg_dmg})}}</b> ([[/r ${formula}]]) ${part[1]} damage`);
                };
                let desc = `<i>Hit:</i> `, parts = [];
                formula.parts.forEach((part) => calcHit(part, !ranged && !(versatile && thrown && twohanded)));
                desc += parts.join(' plus ') + special;
                if (versatile && thrown && twohanded && formula.versatile) {
                    parts = [];
                    formula.parts[0][0] = formula.versatile;
                    formula.parts.forEach((part) => calcHit(part, true));
                    desc += ', or ' + parts.join(' plus ') + special + ' if used with two hands to make a melee attack';
                }
                if (this.race.name === 'duergar' && ability === 'str') {
                    parts = [];
                    formula.parts.forEach((part) => calcHit([part[0].replace(regex, (str) => '' + +str * 2), part[1]]), true);
                    desc += ', or ' + parts.join(' plus ') + special + ' while enlarged';
                }
                return (desc += '.</p>');
            },
        };
        let desc = '<section class="secret">';
        if (ranged)
            desc += descriptions.rwak;
        else if (thrown)
            desc += descriptions.thrown;
        else
            desc += descriptions.mwak;
        if (twohanded && !thrown && damage.versatile)
            damage.parts[0][0] = damage.versatile;
        desc += ' ' + descriptions.hit(damage, special) + `</section><p>{{name}} attacks with its ${name}.</p>`;
        return (item.system.description.value = desc);
    }
    limitCasterLevel(level) {
        const capped = game.settings.get(MODULE, 'caster-cap') ?? true;
        // CR 2 → 5, CR 6 → 9, CR 12 → 18. Interpolate between anchors.
        const ceiling = this.cr <= 6 ? Math.floor(this.cr + 3) : Math.floor(9 + (this.cr - 6) * 1.5);
        return Math.max(1, Math.min(level, capped ? ceiling : 20, 20));
    }
    async setSpellcaster(caster, level) {
        this.spellcasting.class = caster;
        this.spellcasting.level = level;
        const classes = {
            bard: { progression: 1, ability: 'cha' },
            cleric: { progression: 1, ability: 'wis', prepared: true },
            druid: { progression: 1, ability: 'wis', prepared: true },
            paladin: { progression: 0.5, ability: 'cha', prepared: true },
            ranger: { progression: 0.5, ability: 'wis' },
            sorcerer: { progression: 1, ability: 'cha' },
            warlock: {
                progression: 1,
                ability: 'cha',
                special: 'It regains its expended spell slots when it finishes a short or long rest. ',
            },
            wizard: { progression: 1, ability: 'int', prepared: true },
        };
        this.data.system.details.spellLevel = ~~(level * classes[caster].progression + 0.5);
        this.data.system.attributes.spellcasting = classes[caster].ability;
        this.spellcasting.prepared = classes[caster].prepared ?? false;
        this.spellcasting.special = classes[caster].special ?? '';
        this.spellcasting.cantrip_level = this.cantripLevel();
        const slots = (this.spellcasting.spellSlots = this.getSpellcasting());
        slots.forEach((slot, idx) => (this.data.system.spells[('spell' + (idx + 1))] = {
            value: slots[idx],
            override: null,
            max: slots[idx],
        }));
        if (caster === 'warlock') {
            for (const spell of Object.values(this.data.system.spells))
                spell.override = 0;
            const pact = this.getPactSpellcasting();
            this.data.system.spells.pact = { value: pact.max, override: pact.max, max: pact.max, level: pact.level };
        }
    }
    /**
     * Gets the spellcasting slots
     * @returns Spell slots
     */
    getSpellcasting() {
        const spellcaster = this.data.system.details.spellLevel;
        const maxLevel = ~~Math.min((spellcaster + 1) / 2, 5);
        return [
            maxLevel > 0 ? Math.min(spellcaster + 1, 4) : 0,
            maxLevel > 1 ? Math.min(spellcaster - 1, 3) : 0,
            maxLevel > 2 ? Math.min(spellcaster - 3, 3) : 0,
            maxLevel > 3 ? Math.min(spellcaster - 6, 3) : 0,
            +(spellcaster > 8) + +(spellcaster > 9) + +(spellcaster > 17),
            +(spellcaster > 10) + +(spellcaster > 18),
            +(spellcaster > 12) + +(spellcaster > 19),
            +(spellcaster > 14),
            +(spellcaster > 16),
        ];
    }
    /**
     * Gets the pact level
     * @returns Pact magic level and uses
     */
    getPactSpellcasting() {
        const pactLevel = this.spellcasting.level * +(this.spellcasting.class === 'warlock');
        const max = pactLevel === 1 ? 1 : pactLevel < 11 ? 2 : ~~((pactLevel + 1) / 6) + 1;
        const level = ~~Math.min((pactLevel + 1) / 2, 5);
        return { max, level, value: max };
    }
    async _insertItem(database, name, description_update) {
        const data = await this._loadItemData(database, name);
        if (!data)
            return;
        if (description_update)
            updateDescription(data, description_update);
        this.items.push(data);
        return data;
    }
    async _loadItemData(database, name) {
        const data = findItem(name, database);
        if (!data) {
            logger.warn(`${name} not found in the ${database} database`);
            this.errors++;
            return;
        }
        return game.items.fromCompendium((await data.pack.getDocument(data.id)));
    }
    /**
     * Get an ability modifier
     * @param ability Ability to get the modifier
     * @returns Ability modifier
     */
    mod(ability) {
        return Math.floor(((this.data.system.abilities[ability]?.value ?? 10) - 10) / 2);
    }
    getBestSpellSlots(slots, n = 3) {
        slots = [...slots];
        const best_spell_slots = new Array(n);
        for (let i = 0; i < n; i++) {
            const best = slots.findLastIndex((v) => v > 0);
            best_spell_slots[i] = best + 1;
            if (best >= 0)
                slots[best]--;
        }
        return best_spell_slots;
    }
    /**
     * Calculates the character offensive power per round
     */
    setOffensePower(traits = this.getTraits()) {
        let damage = 0;
        const rounds = { ...traits.actions };
        const spells = this.spellcasting.spells.map(([spell]) => spell).filter((spell) => spell.system.level > 0 && isClassSpellcasting(spell));
        const actionList = this.getActions(traits).sort((a, b) => b.damage - a.damage);
        const best_spell_slots = this.getBestSpellSlots(traits.spell_slots);
        const actionValue = actionList.find((action) => action.cost.action === 1 && !action.cost.bonus && action.max === 3)?.damage ??
            0;
        const bonusValue = actionList.find((action) => action.cost.bonus === 1 && !action.cost.action && action.max === 3)?.damage ??
            0;
        let spellsActionList, integratedActionList;
        let spell_used = 0;
        loop1: for (const [idx, slot] of best_spell_slots.entries()) {
            spellsActionList = spells
                .map((spell) => this.evaluateSpellDmg(spell, slot, traits))
                .filter((data) => data.damage);
            integratedActionList = [...spellsActionList, ...actionList].sort((a, b) => {
                const damageA = a.damage +
                    bonusValue * +(a.cost.action === 1 && !a.cost.bonus) +
                    actionValue * +(a.cost.bonus === 1 && !a.cost.action);
                const damageB = b.damage +
                    bonusValue * +(b.cost.action === 1 && !b.cost.bonus) +
                    actionValue * +(b.cost.bonus === 1 && !b.cost.action);
                return damageB - damageA;
            });
            for (const action of integratedActionList) {
                if (!action.max)
                    continue;
                if (spell_used === 3 && 'slot' in action.cost && action.cost.slot !== 0)
                    continue;
                const iter = Object.keys(action.cost).filter((t) => t in rounds);
                for (const type of iter) {
                    const remainder = Math.min(rounds[type], action.max * (action.cost[type] ?? 0));
                    if (remainder) {
                        damage += action.damage * remainder;
                        rounds[type] -= remainder;
                        logger.debug(`Action: ${action.items[0].name} (${action.damage}) * (${remainder})`);
                    }
                }
                if (rounds.action + rounds.bonus + rounds.reaction + rounds.lair + rounds.legendary === 0)
                    break loop1;
                if ('slot' in action.cost) {
                    if (idx !== 2)
                        break;
                    if (action.cost.slot !== 0)
                        spell_used++;
                }
                if ('slot' in action.cost && idx !== 2)
                    break;
            }
        }
        return (this.offensive_power = damage / 3);
    }
    /**
     * Generates the HP and Hit Die formula
     */
    setHP(traits = this.getTraits()) {
        const sizeDice = { tiny: 4, sm: 6, med: 8, lg: 10, huge: 12, grg: 20 };
        const die = sizeDice[this.data.system.traits.size] ?? 8;
        const con = this.mod('con');
        const averageDie = Math.max(1, (die + 1) / 2 + con);
        const offense = this.offensive_power;
        const temp = this.data.system.attributes.hp.temp;
        const jobScale = this.job.tags?.includes('martial') ? 1.08 : this.spellcasting.level ? 0.85 : 1;
        let target = this.hpLevel === 'standard' ? 12 + 20 * this.cr : 10 + 5.5 * this.cr;
        if (this.hpLevel === 'original') {
            const ac = this.getArmorClass() + traits.ac_bonus;
            const acFactor = Math.max(0.1, 1 + 0.1 * (ac - 12));
            target = XP_TABLE[this.true_cr] / Math.max(1, offense) / acFactor / this.getResistanceMultiplier();
            target = (target - temp - traits.hp_bonus) / (1 + traits.max_hp_con_bonus / averageDie);
        } else if (this.hpLevel === 'low') {
            target *= jobScale;
        }
        const multiplier = Number(game.settings.get(MODULE, 'hp-multiplier') ?? 1);
        const hp_target = target * (Number.isFinite(multiplier) && multiplier > 0 ? multiplier : 1);
        const maxDice = Math.floor(6 + 2 * this.cr);
        const hit_dice = Math.min(maxDice, Math.max(this.cr > 0 ? 2 : 1, Math.round(hp_target / averageDie)));
        const hp_new = Math.max(1, Math.floor(hit_dice * ((die + 1) / 2 + con)));
        const conTotal = con * hit_dice;
        this.data.system.attributes.hp = {
            formula: `${hit_dice}d${die} ${conTotal < 0 ? "-" : "+"} ${Math.abs(conTotal)}`,
            value: hp_new,
            max: hp_new,
            temp,
        };
        this.hit_dice = hit_dice;
        this.target_hp = hp_target;
        logger.debug(`${this.data.name} / ${this.cr} / ${this.race.name} / ${this.job.name} / Offensive Power: ${offense} / Hit points: ${hp_new}`);
    }
    validate() {
        function fail(message) {
            logger.debug(message);
            fails++;
        }
        const spellcaster = this.spellcasting.level, hit_dice = this.hit_dice, hp = this.data.system.attributes.hp.max, offense = this.offensive_power, target_hp = this.target_hp;
        let fails = 0;
        if (this.errors)
            fail(`Found ${this.errors} items wich couldnt be added to the Draft`);
        if (hit_dice < 1)
            fail(`Zero or negative Hit Dice`);
        if (this.cr > 0 && hit_dice < 2)
            fail(`Hit Dice generated are too low! Target HP: ${target_hp}`);
        if (this.hpLevel === 'original' && hit_dice < this.cr)
            fail(`Hit Dice (${hit_dice}) generated are too low in relation to the creature CR: ${this.cr}`);
        if (this.hpLevel === 'original' && hit_dice < spellcaster)
            fail(`Hit Dice (${hit_dice}) generated are below the spellcaster level! ${spellcaster}`);
        if (hit_dice > 6 + this.cr * 2)
            fail(`Hit Dice (${hit_dice}) generated are too high in relation to the creature CR: ${this.cr}`);
        if (this.hpLevel === 'original' && hp / offense > 5 && hit_dice > 3)
            fail(`Draft has too much HP ${hp} in relation to its offensive power ${offense} (${hp / offense})`);
        if (this.hpLevel === 'original' && hp / offense < 0.3)
            fail(`Draft has very low HP ${hp} in relation to its offensive power ${offense} (${hp / offense})`);
        return !fails;
    }
    /**
     * Get the character traits, based on their items and other characteristics
     */
    getTraits() {
        const traits = foundry.utils.mergeObject({}, this.traits);
        traits.actions = { ...this.traits.actions };
        traits.spell_slots = [...this.traits.spell_slots];
        const fly = this.data.system.attributes.movement.fly > 0;
        if (this.spellcasting.class === 'warlock')
            traits.spell_slots[this.data.system.spells.pact.level - 1] = this.data.system.spells.pact.value;
        else
            traits.spell_slots = [...this.spellcasting.spellSlots];
        this.items.forEach((item) => {
            if (item.type === 'equipment' && item.system.type.value === 'shield')
                traits.shield = true;
            if (['rwak', 'rsak'].includes(getActionType(item)))
                traits.ranged = true;
            traitsDraft[getItemName(item)]?.(traits, this, item);
        });
        if (fly && traits.ranged)
            traits.ac_bonus += Math.max(0, 2 - this.cr / 5);
        return traits;
    }
    getResistanceMultiplier() {
        function sumTable(arr) {
            if (!arr.length)
                return 0;
            return [...new Set(arr)].map((res) => resistance_table[res] ?? 0).reduce((a, b) => a + b);
        }
        const resistance_table = {
            physical: 0.5,
            fire: 0.07,
            bludgeoning: 0.065,
            radiant: 0.06,
            necrotic: 0.055,
            psychic: 0.055,
            cold: 0.04,
            force: 0.035,
            piercing: 0.025,
            lightning: 0.025,
            thunder: 0.025,
            acid: 0.02,
            poison: 0.015,
            slashing: 0.01,
        };
        resistance_table.physical *= Math.max(0, 10 - (this.true_cr - 1)) / 10;
        let multiplier = 1;
        multiplier += sumTable([...this.data.system.traits.di.value, ...this.temporary.di.value]) * 1.5;
        multiplier += sumTable([...this.data.system.traits.dr.value, ...this.temporary.dr.value]);
        const atenuant = (this.true_cr + 2) / 5;
        multiplier = (multiplier - 1) / atenuant + 1;
        multiplier /= 1 + sumTable([...this.data.system.traits.dv.value, ...this.temporary.dv.value]);
        return multiplier;
    }
    /**
     * Generates treasure for the NPC, applying the treasure multiplier
     */
    generateTreasure() {
        const left = (divider) => ~~(treasure / divider);
        const base = 100;
        const rnd = seeder.rnd() * 1.5 + 0.5;
        let treasure = ~~(((this.true_cr - 1) ** 2 * 100 + base) * (this.job.treasure ?? 1) * rnd) +
            (this.job.treasure_extra ?? 0);
        const pp = between(left(2000), left(1000));
        treasure -= pp * 1000;
        const ep = between(0, left(1000)); // Electrum coins are rarer
        treasure -= ep * 500;
        const gp = between(left(400), left(100));
        treasure -= gp * 100;
        const sp = between(left(20), left(10));
        treasure -= sp * 10;
        const cp = between(0, Math.min(treasure, 200));
        this.data.system.currency = { pp, gp, ep, sp, cp };
    }
    /**
     * Update all weapon damage in relation to character traits
     */
    updateWeaponsDamage(traits = this.getTraits()) {
        if (traits.extra_dice_melee) {
            this.items.forEach((item) => {
                const attack = getActivity(item, 'attack');
                if (item.type === 'weapon' && attack && attack.attack?.type.value !== 'ranged') {
                    const regex = /[0-9]+/;
                    function addExtraDiceMelee(DamageFormula) {
                        const dices = regex.exec(DamageFormula)?.[0];
                        if (dices)
                            return DamageFormula.replace(regex, '' + (+dices + traits.extra_dice_melee));
                        return DamageFormula;
                    }
                    if (item.system.damage.base.custom.enabled) {
                        item.system.damage.base.custom.formula = addExtraDiceMelee(item.system.damage.base.custom.formula);
                    }
                    else {
                        item.system.damage.base.number += traits.extra_dice_melee;
                    }
                    if (item.system.damage.versatile) {
                        if (item.system.damage.versatile.custom.enabled) {
                            item.system.damage.versatile.custom.formula = addExtraDiceMelee(item.system.damage.versatile.custom.formula);
                        }
                        else {
                            item.system.damage.versatile.number += traits.extra_dice_melee;
                        }
                    }
                }
            });
        }
    }
    /**
     * Update all items descriptions
     */
    updateItemsDescription(traits = this.getTraits()) {
        const name = this.data.flags.npcgen.name1 || this.data.name, full_name = this.data.name, race = this.race.name, creature = race, job = this.job.name, hit_dice = this.hit_dice, prof = this.data.system.attributes.prof, caster_level = this.spellcasting.level, caster_class = this.spellcasting.class, caster_ability = ABILITIES[this.data.system.attributes.spellcasting], caster_attack = prof + this.mod(this.data.system.attributes.spellcasting), caster_spelldc = 8 + caster_attack, innate_ability = ABILITIES[this.innateSpells.ability], innate_attack = prof + this.mod(this.innateSpells.ability), innate_spelldc = 8 + innate_attack, extra_dice_melee = traits.extra_dice_melee, mods = {
            str: this.mod('str'),
            dex: this.mod('dex'),
            con: this.mod('con'),
            int: this.mod('int'),
            wis: this.mod('wis'),
            cha: this.mod('cha'),
        };
        const pattern = /{{ *([^}]+) *}}/g;
        for (const item of this.items) {
            const desc = item.system.description.value;
            const ability = this.getItemAbility(item);
            const mod = ability === 'flat' ? 0 : this.mod(ability);
            const save = getActivity(item, 'save');
            const save_dc = ability === 'flat' ? +(save?.save?.dc.formula ?? '10') : 8 + prof + mod;
            let atk_bonus = prof + mod + traits.global_atk_bonus;
            const attack = getActivity(item, 'attack');
            if (attack && item.type === 'weapon') {
                atk_bonus += traits.atk_bonus + traits.atk_bonus_weapon +
                    (Number(attack.attack.bonus) || 0) + (Number(item.system.magicalBonus) || 0);
                if (attack.attack.type.value === 'ranged')
                    atk_bonus += traits.global_atk_bonus_weapon_ranged;
                else
                    atk_bonus += traits.global_atk_bonus_weapon_melee;
            }
            const signed_atk_bonus = numberSign(atk_bonus);
            const reach = item.type === 'weapon' ? (item.system.properties.includes('rch') ? 10 : 5) : 0;
            const avg_dmg = (formula) => ~~eval(formula
                .replaceAll('@', '')
                .replaceAll(/d[0-9]+/g, (str) => '*' + (Number(str.slice(1)) + 1) / 2)
                .replaceAll(/\[.+?\]/g, ''));
            let matches = [];
            let arrMatches = null;
            while ((arrMatches = pattern.exec(desc))) {
                const [match, command] = arrMatches;
                try {
                    matches.push([match, eval(command)]);
                }
                catch {
                    logger.debug(`Unknown command ${command} found in item **${getItemName(item)}** from **${item._stats.compendiumSource}**`);
                }
            }
            for (const match of matches) {
                item.system.description.value = item.system.description.value.replace(match[0], match[1]);
            }
        }
    }
    /**
     * Creates an actor based on the Draft
     */
    async createActor() {
        const config = this.data.flags.npcgen;
        const { portrait, token } = await findNPCArt(config, this.artFiles);
        this.data.img = portrait || this.data.img;
        this.data.prototypeToken.texture.src = token || this.data.img;
        config.portrait = this.data.img;
        config.token = this.data.prototypeToken.texture.src;
        // The custom AC callback is only used while drafting.
        const { _formula, ...ac } = this.data.system.attributes.ac;
        this.data.system.attributes.ac = ac;
        const actor = (await Actor.create(this.data));
        await actor.createEmbeddedDocuments('Item', this.items);
        const tokenEqualPortrait = actor.img === actor.prototypeToken.texture.src;
        if (tokenEqualPortrait &&
            actor.img !== 'icons/svg/mystery-man.svg' &&
            TOKENIZER() &&
            game.settings.get(MODULE, 'tokenizer'))
            await tokenize(actor);
        logger.log(`NPC Generated. ${actor.name} (#${seeder.SEED})`);
        ui.notifications.notify(`NPC Created! ${actor.name} (#${seeder.SEED})`);
        return (this.actor = actor);
    }
    print() {
        return `${this.race.name} / ${this.job.name} / ${this.cr} / ${this.seed}`;
    }
    writeBio() {
        if (!game.settings.get(MODULE, 'print-bio'))
            return;
        const createLi = (name, value) => `<li>${name}: ${value}</li>`;
        const biography = this.data.flags.npcgen.biography;
        const bioValue = `<h2>Appearance</h2>
                            <ul>
                                ${createLi('Age', biography.physical.age)}
                                ${createLi('Hair', biography.physical.hair)}
                                ${createLi('Skin', biography.physical.skin)}
                                ${createLi('Eyes', biography.physical.eyes)}
                                ${createLi('Sex', biography.physical.sex)}
                                ${createLi('Height', biography.physical.height)}
                                ${createLi('Weight', biography.physical.weight)}
                            </ul>
                            <h2>Personality</h2>
                            <ul>
                                ${elementFromList(biography.personality, 'li')}
                            </ul>
                            <h2>Plot Hook</h2>
                            ${elementFromList(biography.plot)}
                            ${this.data.system.details.biography.value}`
            .trim()
            .replace(/>\s+</g, '><');
        const details = this.data.system.details;
        details.biography.value = bioValue;
        details.bond = elementFromList(biography.bonds, 'li');
        details.flaw = elementFromList(biography.flaws, 'li');
        details.ideal = elementFromList(biography.ideals, 'li');
    }
}
