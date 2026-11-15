// Offline check of the generator's offence and hit point maths. No Foundry needed.
//
//   node tools/hp-check.mjs                      (this module, HP level "low")
//   node tools/hp-check.mjs --hp=standard        (or original)
//   node tools/hp-check.mjs --module=<path to another copy of the module, e.g. the unmodified original>
//   node tools/hp-check.mjs --seeds=40 --verbose
//   node tools/hp-check.mjs --matrix --seeds=2
//
// Items and spells come from tools/fixtures/dnd5e-6.0.6-srd.json, converted from the dnd5e 6.0.6
// pack sources (dnd5e.items, dnd5e.equipment24, dnd5e.spells, dnd5e.spells24). Features from the
// module's own compendium are mocked as plain text features, because that pack is a LevelDB.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const args = Object.fromEntries(process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? true];
}));
const moduleDir = path.resolve(args.module ?? path.join(here, '..'));
const SEEDS = +(args.seeds ?? 25);
const HP_LEVEL = args.hp ?? 'low';
const VERBOSE = !!args.verbose;
const crashReasons = new Map();
const missingNames = new Set();

// ---------------------------------------------------------------- Foundry mocks
function mergeObject(original, other = {}) {
    for (const [k, v] of Object.entries(other)) {
        if (v && typeof v === 'object' && !Array.isArray(v) && original[k] && typeof original[k] === 'object' && !Array.isArray(original[k]))
            mergeObject(original[k], v);
        else original[k] = v;
    }
    return original;
}
class MersenneTwister {
    SEED = 1;
    #s = 1;
    seed(s) {
        this.SEED = s;
        this.#s = s >>> 0;
    }
    rnd() {
        // mulberry32: not Foundry's twister, so seeds do not reproduce in-world NPCs, only the statistics.
        let t = (this.#s += 0x6d2b79f5);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
}
const settings = {
    'print-bio': false,
    'minimum-cr': true,
    'pack-feature': '',
    'pack-item': '',
    'pack-spell': '',
    tokenizer: false,
    'hp-level': HP_LEVEL,
    'hp-multiplier': +(args.mult ?? 1),
    'caster-cap': args.nocap ? false : true,
    'prefer-2024': args.no2024 ? false : true,
};
const quiet = () => {};
if (!VERBOSE) {
    console.debug = quiet;
    console.warn = (...args) => {
        const message = args.at(-1);
        if (typeof message === 'string' && message.includes(' not found in the '))
            missingNames.add(message);
    };
    console.error = quiet;
}
const log = console.log.bind(console);
if (!VERBOSE) console.log = (...a) => (typeof a[0] === 'string' && a[0].startsWith('%c') ? undefined : log(...a));

globalThis.window = globalThis;
globalThis.Audio = class {};
globalThis.Hooks = { on: quiet, once: quiet };
globalThis.ui = { notifications: { notify: quiet, warn: quiet, error: quiet, info: quiet } };
globalThis.foundry = {
    utils: { mergeObject, randomID: (n = 16) => Array.from({ length: n }, () => 'abcdefghijklmnopqrstuvwxyz0123456789'[~~(Math.random() * 36)]).join('') },
    dice: { MersenneTwister },
};
Math.clamp ??= (v, a, b) => Math.min(Math.max(v, a), b);
Array.prototype.findSplice ??= function (fn) {
    const i = this.findIndex(fn);
    return i === -1 ? null : this.splice(i, 1)[0];
};
String.prototype.titleCase ??= function () {
    return this.replace(/\b\w/g, (c) => c.toUpperCase());
};

// ---------------------------------------------------------------- packs
const srd = JSON.parse(fs.readFileSync(path.join(here, 'fixtures', 'dnd5e-6.0.6-srd.json'), 'utf8'));
function withDefaults(doc, source = 'fixture') {
    const d = structuredClone(doc);
    d._stats = { compendiumSource: source };
    d.effects ??= [];
    d.flags ??= {};
    const s = d.system;
    s.description ??= { value: '' };
    s.activities ??= {};
    s.uses ??= { max: '', spent: 0, recovery: [] };
    s.uses.recovery ??= [];
    s.properties ??= [];
    for (const a of Object.values(s.activities)) {
        a.activation ??= { type: 'action', value: 1 };
        a.target ??= {};
        a.target.template ??= {};
    }
    if (d.type === 'spell') {
        s.method ??= 'spell';
        s.prepared ??= 0;
    }
    return d;
}
function makePack(id, docs) {
    const byId = new Map(docs.map((d) => [d._id, d]));
    return { collection: id, index: docs.map((d) => ({ _id: d._id, name: d.name, flags: {} })), getDocument: async (_id) => withDefaults(byId.get(_id), id) };
}
// Feature names are whatever the job and race files ask for.
function featureDoc(name) {
    const base = { _id: 'f' + name.replace(/\W/g, '').slice(0, 15), name, type: 'feat', flags: {}, effects: [{ changes: [{ value: '' }], disabled: false }] };
    const system = { description: { value: '' }, activities: {}, uses: { max: '', spent: 0, recovery: [] }, properties: [], type: {} };
    if (['Bite', 'Unarmed Strike', 'Claws', 'Claw'].includes(name)) {
        base.type = 'weapon';
        system.type = { value: 'natural', baseItem: '' };
        system.damage = { base: { number: 1, denomination: 4, bonus: '', types: ['bludgeoning'], custom: { enabled: false, formula: '' } } };
        system.activities = { a: { type: 'attack', activation: { type: 'action', value: 1 }, attack: { bonus: '', type: { value: 'melee', classification: 'weapon' } }, damage: { includeBase: true, parts: [] }, target: { template: {} } } };
    }
    if (name === "Archer's Eye") system.activities = { a: { type: 'utility', activation: { type: 'bonus', value: 1 }, roll: {}, target: { template: {} } } };
    if (['Martial Advantage', 'Sneak Attack'].includes(name))
        system.activities = { a: { type: 'damage', activation: { type: 'special' }, damage: { parts: [{ number: 1, denomination: 6, types: [], custom: { enabled: false } }] }, target: { template: {} } } };
    if (name === 'Song of Rest') system.activities = { a: { type: 'heal', activation: { type: 'special' }, healing: {}, target: { template: {} } } };
    if (name.startsWith('Breath Weapon - ')) {
        system.activities = { a: {
            type: 'save', activation: { type: 'action', value: 1 },
            target: { template: { type: 'cone' } },
            save: { dc: { calculation: 'con' } },
            damage: { parts: [{ number: 2, denomination: 6, types: ['fire'], custom: { enabled: false } }] },
        } };
    }
    return { ...base, system };
}
const featureNames = new Set(['Spellcasting', 'Innate Spellcasting', 'Multiattack', 'Special Equipment']);
for (const dir of ['module/generator/jobs', 'module/generator/races', 'module/generator']) {
    for (const f of fs.readdirSync(path.join(moduleDir, dir))) {
        if (!f.endsWith('.js')) continue;
        const src = fs.readFileSync(path.join(moduleDir, dir, f), 'utf8');
        for (const m of src.matchAll(/feature\(\s*(?:'((?:[^'\\]|\\.)+)'|"((?:[^"\\]|\\.)+)")/g)) featureNames.add((m[1] ?? m[2]).replace(/\\'/g, "'"));
    }
}
for (const color of ['Black', 'Blue', 'Brass', 'Bronze', 'Copper', 'Gold', 'Green', 'Red', 'Silver', 'White'])
    featureNames.add('Breath Weapon - ' + color);
const packs = new Map([
    ['dnd5e.items', makePack('dnd5e.items', srd.items)],
    ['dnd5e.equipment24', makePack('dnd5e.equipment24', srd.equipment24)],
    ['dnd5e.spells', makePack('dnd5e.spells', srd.spells)],
    ['dnd5e.spells24', makePack('dnd5e.spells24', srd.spells24)],
    ['npcgen.features', makePack('npcgen.features', [...featureNames].map(featureDoc))],
]);
globalThis.game = {
    settings: { get: (_m, key) => settings[key], register: quiet },
    packs,
    items: { fromCompendium: (d) => d },
    folders: { filter: () => [], get: quiet },
    user: { isGM: true },
    i18n: { lang: 'en', localize: (s) => s },
    modules: { get: quiet },
};

// ---------------------------------------------------------------- run
const imp = (p) => import(pathToFileURL(path.join(moduleDir, p)).href);
const utils = await imp('module/utils.js');
const { NPCDraft } = await imp('module/generator/npcdraft.js');
utils.searchPacks();
utils.updatePacks();

if (args.mcp) {
    const { registerMcpQuery } = await imp('module/mcp.js');
    const query = 'npc-generator-dnd5e-eldore.generateNPC';
    globalThis.CONFIG = { queries: {} };
    registerMcpQuery();
    assert.equal(CONFIG.queries[query], undefined);
    game.modules = new Map([['foundry-mcp-bridge', { active: true }]]);
    game.system = { id: 'dnd5e' };
    game.user.hasPermission = (permission) => permission === 'ACTOR_CREATE';
    game.folders.get = (id) => id === 'npc-folder' ? { id, type: 'Actor' } : undefined;
    registerMcpQuery();
    const generate = CONFIG.queries[query];
    const config = { firstName: 'Avery', race: 'human', job: 'guard', cr: '1/2', hpLevel: 'low', folderId: 'npc-folder' };
    await assert.rejects(generate(config), /write operations/);
    settings.allowWriteOperations = true;
    game.user.isGM = false;
    await assert.rejects(generate(config), /requires a Foundry GM/);
    game.user.isGM = true;
    await assert.rejects(generate(config, 'remote-user'), /MCP Bridge/);
    await assert.rejects(generate({ ...config, race: 'drow', cr: 21 }), /CR must be/);
    await assert.rejects(generate({ ...config, job: '__proto__' }), /Unknown job/);
    let saved;
    globalThis.Actor = {
        async create(data) {
            saved = structuredClone(data);
            return { ...data, id: 'actor-id', uuid: 'Actor.actor-id', async createEmbeddedDocuments() {} };
        },
    };
    const result = await generate(config);
    assert.equal(result.id, 'actor-id');
    assert.equal(result.uuid, 'Actor.actor-id');
    assert.equal(result.name, 'Avery');
    assert.equal(result.cr, 0.5);
    assert.equal(result.hp, saved.system.attributes.hp.max);
    assert.equal(saved.folder, 'npc-folder');
    assert.equal(saved.flags.npcgen.hpLevel, 'low');
    log('MCP checks passed.');
    process.exit(0);
}

if (args.bio) {
    const { gen_table } = await imp('module/bio.js');
    const gate = Promise.withResolvers();
    let loads = 0;
    globalThis.fetch = async (url) => {
        const table = url.match(/tables\/(.+)\/base\.csv$/)?.[1];
        if (table === 'delayed') {
            loads++;
            await gate.promise;
            return new Response('One trait,1');
        }
        if (table === 'filtered')
            return new Response('Requires tag,1,rare\nExcluded,1,,common\nDisabled,0');
        if (table === 'cycle')
            return new Response('A loop [cycle.base],1');
        if (table === 'empty')
            return new Response('');
        return new Response(null, { status: 404 });
    };
    const tags = new Set(['common']);
    const first = gen_table('delayed', 2, 2, tags);
    const second = gen_table('delayed', 1, 1, tags);
    gate.resolve();
    assert.deepEqual(await Promise.all([first, second]), [['One trait'], ['One trait']]);
    assert.equal(loads, 1);
    for (const table of ['filtered', 'missing', 'empty'])
        assert.deepEqual(await gen_table(table, 1, 1, tags), []);
    assert.deepEqual(await gen_table('cycle', 1, 1, tags), ['A loop ']);
    log('Biography checks passed.');
    process.exit(0);
}

if (args.dialog) {
    const { checkDialog } = await import('./dialog-check.mjs');
    const template = fs.readFileSync(path.join(moduleDir, 'templates/menu.html'), 'utf8');
    await checkDialog({ imp, template, settings, seeder: utils.seeder });
    log('Dialog checks passed.');
    process.exit(0);
}

const median = (a) => {
    const s = [...a].sort((x, y) => x - y);
    return s.length ? s[~~(s.length / 2)] : NaN;
};
async function sample(race, job, cr, n = SEEDS) {
    const rows = [];
    let crashed = 0;
    for (let seed = 1; seed <= n; seed++) {
        try {
            const d = await new NPCDraft({ name1: 'Test', name2: 'Npc', race, job, cr: '' + cr, seed: seed * 7919, hpLevel: HP_LEVEL }).prepare();
            const hp = d.data.system.attributes.hp;
            rows.push({
                hp: hp.max,
                formula: hp.formula,
                offense: d.offensive_power,
                hd: d.hit_dice,
                con: d.mod('con'),
                ac: d.getArmorClass(),
                casterLevel: d.spellcasting.level,
                maxSlot: d.spellcasting.spellSlots.findLastIndex((s) => s > 0) + 1,
                spells: d.items.filter((i) => i.type === 'spell').length,
                valid: d.validate(),
                missing: d.errors,
            });
        } catch (e) {
            crashed++;
            const reason = e.message + ' (' + (e.stack.split('\n').find((line) => line.includes('module/generator/'))?.trim().split('/module/generator/').at(-1) ?? '') + ')';
            crashReasons.set(reason, (crashReasons.get(reason) ?? 0) + 1);
            if (VERBOSE) log(`crash ${race}/${job}/${cr}:`, e);
        }
    }
    return { rows, crashed };
}
function line(label, { rows, crashed }) {
    if (!rows.length) return log(`${label.padEnd(30)} all ${crashed} drafts crashed (run with --verbose)`);
    const hp = rows.map((r) => r.hp);
    const off = rows.map((r) => r.offense);
    const ex = rows[0];
    const caster = ex.casterLevel ? `  caster L${median(rows.map((r) => r.casterLevel))} slot ${median(rows.map((r) => r.maxSlot))} spells ${median(rows.map((r) => r.spells))}` : '';
    log(
        `${label.padEnd(30)} HP med ${String(median(hp)).padStart(3)}  [${Math.min(...hp)}-${Math.max(...hp)}]` +
            `  offense med ${median(off).toFixed(1).padStart(5)}  maxHD ${Math.max(...rows.map((r) => r.hd))}` +
            `  e.g. ${ex.formula} (Con ${ex.con >= 0 ? '+' : ''}${ex.con})${caster}${crashed ? `  CRASHED ${crashed}` : ''}`
    );
}

log(`Module: ${moduleDir}`);
log(`HP level: ${HP_LEVEL}   seeds per row: ${SEEDS}\n`);
log('--- Examples from the world');
for (const [race, job, cr] of [
    ['drow', 'fighter', 3],
    ['bullywug', 'berserker', 1],
    ['hobgoblin', 'evoker', 5],
    ['human', 'priest', 2],
    ['human', 'berserker', 5],
    ['half-orc', 'berserker', 5],
    ['human', 'noble', 1],
])
    line(`${race} ${job} CR ${cr}`, await sample(race, job, cr));

const jobsMod = await imp('module/generator/jobs.js');
log('\n--- Every job, human, by CR (median HP)');
const crs = [0.125, 0.5, 1, 2, 3, 5, 7, 10];
log('job'.padEnd(14) + crs.map((c) => `CR${c}`.padStart(9)).join(''));
let worst = 0;
let rejected = 0;
let tested = 0;
let missingDrafts = 0;
for (const job of Object.keys(jobsMod.jobs)) {
    let out = job.padEnd(14);
    for (const cr of crs) {
        const { rows, crashed } = await sample('human', job, cr, Math.min(SEEDS, 15));
        const hp = rows.map((r) => r.hp);
        tested += rows.length + crashed;
        missingDrafts += rows.filter((row) => row.missing).length;
        rejected += rows.filter((row) => !row.valid).length;
        const over = rows.filter((r) => r.hd > 6 + 2 * cr).length;
        worst = Math.max(worst, ...rows.map((r) => r.hd - (6 + 2 * cr)));
        out += (rows.length ? `${median(hp)}${over ? '!' : ''}${crashed ? '?' : ''}` : 'crash').padStart(9);
    }
    log(out);
}
log('\n"!" marks a cell where at least one draft exceeded 6 + 2 x CR hit dice. "?" marks crashed drafts.');
log(worst > 0 ? `Largest overshoot of the hit dice cap: ${worst} dice.` : 'No draft exceeded the hit dice cap.');

if (args.matrix) {
    const { races } = await imp('module/generator/races.js');
    const matrixCRs = [0, 0.125, 0.25, 0.5, ...Array.from({ length: 20 }, (_, i) => i + 1)];
    let cases = 0, crashes = 0, rejected = 0, over = 0;
    for (const race of Object.values(races)) {
        for (const job of Object.keys(jobsMod.jobs)) {
            for (const cr of matrixCRs) {
                const [numerator, denominator = 1] = String(race.cr ?? 0).split('/');
                if (cr < Number(numerator) / Number(denominator))
                    continue;
                const { rows, crashed } = await sample(race.name, job, cr);
                cases += rows.length + crashed;
                crashes += crashed;
                rejected += rows.filter((row) => !row.valid).length;
                over += rows.filter((row) => row.hd > 6 + 2 * cr).length;
            }
        }
    }
    log('Race/job/CR matrix:', { cases, crashes, rejected, over });
    if (args.verify) {
        assert.ok(cases > 0);
        assert.equal(crashes, 0);
        assert.equal(over, 0);
        if (HP_LEVEL !== 'original') assert.equal(rejected, 0);
    }
}
log('Human grid:', { tested, rejected, missingDrafts });
for (const [reason, count] of crashReasons)
    log('Crashes:', count, reason);
if (missingNames.size)
    log('Missing requests:', [...missingNames].sort().join(', '));

if (args.smoke) {
    const { getAttackDamage } = await imp('module/generator/item/item5e.js');
    const { findNPCArt } = await imp('module/art.js');
    assert.equal(utils.parseCR('1/8'), 0.125);
    assert.ok(Number.isNaN(utils.parseCR('1/0')));
    assert.ok(Number.isNaN(utils.parseCR('1+1')));
    assert.equal(utils.findItem('Longsword', 'items').pack.collection, 'dnd5e.equipment24');
    assert.equal(utils.findItem('Rapier +1', 'items').pack.collection, 'dnd5e.items');
    assert.equal(utils.findItem('Fireball', 'spells').pack.collection, 'dnd5e.spells24');
    assert.equal(utils.findItem('Branding Smite', 'spells').pack.collection, 'dnd5e.spells');
    for (const [name, database, pack] of [['Longsword', 'items', 'dnd5e.items'], ['Fireball', 'spells', 'dnd5e.spells']]) {
        settings[database === 'items' ? 'pack-item' : 'pack-spell'] = 'missing.pack, ' + pack;
        utils.updatePacks();
        assert.equal(utils.findItem(name, database).pack.collection, pack);
    }
    delete settings['pack-item'];
    delete settings['pack-spell'];
    utils.updatePacks();

    const raw = srd.equipment24.find((item) => item.name === 'Longsword');
    const sword = withDefaults(raw);
    sword.system.damage.base.bonus = '2';
    sword.system.magicalBonus = 1;
    assert.equal(getAttackDamage(sword).parts[0][0], '1d8 + 2 + @mod + 1');
    sword.system.damage.base.custom = { enabled: true, formula: '1d4 + @mod' };
    assert.equal(getAttackDamage(sword).parts[0][0], '1d4 + @mod + 1');
    assert.equal(getAttackDamage(withDefaults(srd.items.find((item) => item.name === 'Net'))).parts.length, 0);

    const config = { name1: 'Luna', name2: 'Stone', job: 'fighter', race: 'dwarf', cr: '3', seed: 7919, biography: { physical: { sex: 'Female' } } };
    const draft = await new NPCDraft(config).prepare();
    const zeroCon = await new NPCDraft({ ...config, race: 'human', job: 'priest', cr: 2 }).prepare();
    assert.equal(zeroCon.mod('con'), 0);
    assert.match(zeroCon.data.system.attributes.hp.formula, /^\d+d\d+$/);
    const parry = await draft.feature('Parry');
    assert.equal(Object.values(parry.system.activities)[0].type, 'utility');
    assert.equal(Object.values(parry.system.activities)[0].activation.type, 'reaction');
    const archer = await draft.feature("Archer's Eye", 6);
    assert.deepEqual(Object.keys(archer.system.activities), ['a']);
    assert.equal(new NPCDraft({ ...config, cr: 2 }).limitCasterLevel(20), 5);
    assert.equal(new NPCDraft({ ...config, cr: 6 }).limitCasterLevel(20), 9);
    assert.equal(new NPCDraft({ ...config, cr: 12 }).limitCasterLevel(20), 18);

    const token = new NPCDraft({ ...config, generic: true, disposition: -1, lockRotation: true, tokenScale: 1.2 });
    assert.equal(token.data.name, 'A Dwarf F Fighter');
    assert.equal(token.data.prototypeToken.name, 'Fighter');
    assert.equal(token.data.prototypeToken.actorLink, false);
    assert.equal(token.data.prototypeToken.appendNumber, true);
    assert.equal(token.data.prototypeToken.disposition, -1);
    assert.equal(token.data.prototypeToken.texture.scaleX, 1.2);
    assert.equal(token.data.prototypeToken.lockRotation, true);
    assert.equal(new NPCDraft(config).data.prototypeToken.actorLink, true);
    assert.equal(new NPCDraft({ ...config, tokenNameMode: 'full' }).data.prototypeToken.name, 'Luna Stone');
    assert.equal(new NPCDraft({ ...config, tokenNameMode: 'custom', customTokenName: 'Captain' }).data.prototypeToken.name, 'Captain');

    settings['portrait-directory'] = 'portraits';
    settings['token-directory'] = 'tokens';
    globalThis.ForgeVTT = { usingTheForge: true };
    globalThis.FilePicker = {
        browse: async (source, target, options) => {
            assert.equal(source, 'forgevtt');
            assert.equal(options.recursive, true);
            return { files: target === 'portraits'
                ? ['https://cdn.example/LUNA-Stone_Portrait.WEBP']
                : ['tokens/dwarf-fighter,-male.webp', 'tokens/luna-dwarf-fighter-6,-female.webp', 'tokens/fighter.webp'] };
        },
    };
    const art = await findNPCArt(config);
    assert.equal(art.portrait, 'https://cdn.example/LUNA-Stone_Portrait.WEBP');
    assert.equal(art.token, 'tokens/luna-dwarf-fighter-6,-female.webp');
    const library = [
        'NPCs/Bromgram%20Madhold/Orc%20Brute%2C%20female.png',
        'NPCs/Bromgram%20Madhold/Bromgram%20Madhold_portrait2.webp',
        'NPCs/Bromgram%20Madhold/Bromgram%20Madhold_portrait.png',
        'NPCs/Bromgram%20Madhold/Bromgram%20Madhold_portrait.webp',
        'NPCs/Alais Starnar/AlaisStarnar.png',
        'NPCs/Alais Starnar/Elf Wizard, female.png',
        'NPCs/Élise Larue/Élise Larue_portrait.webp',
        'NPCs/Élise Larue/Gold Dragonborn Barbarian, female.png',
        'NPCs/Luna-Dwarf-Bard-6,-male.webp',
        'NPCs/Luna Dwarf Bard 6, male_portrait2.webp',
        'NPCs/portrait_history/Luna Dwarf Bard 6, male.webp',
        'NPCs/Dwarf Fighter, male.webp',
    ];
    const artFiles = new Map([['portraits', library], ['tokens', library]]);
    const match = (name1, name2, race, job, sex) => findNPCArt({
        name1, name2, race, job, biography: { physical: { sex } },
    }, artFiles);
    const bromgram = await match('Bromgram', 'Madhold', 'orc', 'warrior', 'Female');
    assert.deepEqual(bromgram, { portrait: library[3], token: library[0] });
    assert.deepEqual(await match('Alais', 'Starnar', 'elf', 'evoker', 'Female'), {
        portrait: library[4], token: library[5],
    });
    assert.deepEqual(await match('E\u0301lise', 'Larue', 'dragonborn', 'berserker', 'Female'), {
        portrait: library[6], token: library[7],
    });
    assert.equal((await findNPCArt({
        generic: true, race: 'dwarf', job: 'bard', biography: { physical: { sex: 'Male' } },
    }, artFiles)).token, library[8]);
    let savedActor;
    globalThis.Actor = {
        async create(data) {
            savedActor = structuredClone(data);
            return { ...data, async createEmbeddedDocuments() {} };
        },
    };
    let attempts = 0;
    const validate = NPCDraft.prototype.validate;
    NPCDraft.prototype.validate = () => { attempts++; return false; };
    settings['hp-multiplier'] = 50;
    try {
        await NPCDraft.create({ ...config, hpLevel: 'original' });
        assert.equal(attempts, 20);
        assert.equal(Number(savedActor.system.attributes.hp.formula.split('d')[0]), 12);
        assert.equal(savedActor.img, art.portrait);
        assert.equal(savedActor.prototypeToken.texture.src, art.token);
    } finally {
        NPCDraft.prototype.validate = validate;
    }
    log('Smoke checks passed, including actor creation after all 20 attempts were rejected.');
}

if (args.verify) {
    assert.ok(tested > 0);
    assert.equal(crashReasons.size, 0, JSON.stringify([...crashReasons]));
    assert.equal(worst, 0, 'Hit-dice cap exceeded');
    assert.equal(missingDrafts, 0);
    if (HP_LEVEL !== 'original') assert.equal(rejected, 0);
}
