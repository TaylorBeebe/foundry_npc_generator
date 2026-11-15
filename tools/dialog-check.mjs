import assert from 'node:assert/strict';

function mockForm(template, formData) {
    const fields = new Map();
    const events = new Map();
    const generation = formData.object.generation;
    const selections = [...template.matchAll(/<(input|select)\b([^>]*?)\bname="([^"]+)"([^>]*)>/g)];
    for (const [, tag, before, name, after] of selections) {
        const attributes = before + after;
        if (name === 'folder' && !formData.object.hasFolders)
            continue;
        const selected = tag === 'select' && template.match(new RegExp('name="' + name + '"[^>]*>\\s*\\{\\{\\s*selectOptions(?:NoEscape)? [\\w.]+ selected=([\\w.]+)'));
        const checked = attributes.match(/\{\{checked (\w+)\}\}/)?.[1];
        const value = attributes.match(/\bvalue="\{\{([^}]+)\}\}"/)?.[1];
        const read = (key) => key.split('.').reduce((object, field) => object?.[field], formData.object);
        fields.set(name, {
            value: String((selected ? (generation[selected[1]] ?? read(selected[1])) : value ? (generation[value] ?? read(value)) : '') ?? ''),
            checked: Boolean(generation[checked]),
        });
    }
    const selectors = new Map();
    function find(selector) {
        if (selectors.has(selector))
            return selectors.get(selector);
        const field = selector.match(/^(?:fieldset input|input)?\[name="?([\w]+)"?\]$/)?.[1];
        const lock = selector.match(/^:checkbox\[for=(\w+)\]$/)?.[1];
        const elements = field && fields.has(field) ? [fields.get(field)] : lock ? [{ checked: Boolean(formData.object.locks[lock]) }] : [];
        const selection = Object.assign(elements, {
            on(event, handler) { events.set(selector + ':' + event, handler); return this; },
            prop(key, value) { this[key] = value; return this; },
            hasClass() { return false; },
            toggle(visible) { this.visible = visible; return this; },
            get() { return [...elements]; },
        });
        selectors.set(selector, selection);
        return selection;
    }
    return {
        find, fields,
        async submit() {
            assert.match(template, /<button\b[^>]*\bid="create"/);
            const create = events.get('#create:click');
            assert.equal(typeof create, 'function');
            await create();
            assert.notEqual(find('#create').disabled, true);
        },
        change() { events.get('[name=generic], [name=tokenNameMode]:change')(); },
    };
}

export async function checkDialog({ imp, template, settings, seeder }) {
    globalThis.FormApplication = class {
        position = {};
        filepickers = [];
        render() { this.rendered = true; }
    };
    globalThis.Handlebars = { registerHelper() {} };
    globalThis.FilePicker = class {};
    foundry.utils.deepClone = structuredClone;
    const warnings = [];
    ui.notifications.warn = (message) => warnings.push(message);
    ui.notifications.error = (message) => assert.fail(message);
    const actors = [];
    globalThis.Actor = {
        async create(data) {
            const actor = structuredClone(data);
            actors.push(actor);
            return { ...actor, async createEmbeddedDocuments() {} };
        },
    };

    Object.assign(settings, {
        'autogen-bio': true,
        'hp-level': 'low',
        'token-disposition': 0,
        'named-token-link': true,
        'token-name-mode': 'first',
        'custom-token-name': '',
        'generic-npc': false,
        'generic-quantity': 1,
        'generic-random-race': false,
        'generic-random-sex': false,
        'token-lock-rotation': false,
    });
    game.folders.filter = () => [{ id: 'test-folder', type: 'Actor', displayed: true }];
    const { NPCGenerator, app: buildApp } = await imp('module/menu.js');
    const { jobs, references: jobOptions } = await imp('module/generator/jobs.js');
    const { races, references: raceOptions } = await imp('module/generator/races.js');

    const callbacks = new Map();
    Hooks.on = Hooks.once = (event, callback) => callbacks.set(event, callback);
    ui.actors = { render() {} };
    game.release = { generation: 14 };
    let canCreate = false;
    game.user.hasPermission = (permission) => canCreate && permission === 'ACTOR_CREATE';
    await imp('main.js');
    const entries = [];
    // Foundry collects the menu before ready and retains those entries after it.
    callbacks.get('getActorContextOptions')(null, entries);
    callbacks.get('getActorDirectoryEntryContext')(null, entries);
    assert.deepEqual(entries, []);
    canCreate = true;
    callbacks.get('getActorContextOptions')(null, entries);
    callbacks.get('getActorDirectoryEntryContext')(null, entries);
    assert.equal(entries.length, 1);
    assert.equal(entries[0].label, 'Build NPC');
    assert.equal(typeof entries[0].onClick, 'function');
    assert.equal('name' in entries[0], false);

    game.release.generation = 13;
    const legacy = [];
    callbacks.get('getActorDirectoryEntryContext')(null, legacy);
    callbacks.get('getActorContextOptions')(null, legacy);
    assert.equal(legacy.length, 1);
    assert.equal(legacy[0].name, 'Build NPC');
    game.release.generation = 14;
    await callbacks.get('ready')();

    const existing = {
        name: 'Mira Thorn',
        flags: { npcgen: { name1: 'Mira', name2: 'Thorn', race: 'dragonborn', job: 'ranger', seed: 144426 } },
        system: { details: { cr: 3, type: {} } },
        prototypeToken: { texture: {} },
    };
    game.actors = new Map([['existing', existing]]);
    await entries[0].onClick({}, { dataset: { entryId: 'missing' } });
    assert.equal(buildApp.rendered, undefined);
    for (const click of [
        () => entries[0].onClick({}, { dataset: { entryId: 'existing', documentId: 'missing' } }),
        () => legacy[0].callback([{ dataset: { documentId: 'existing' } }]),
    ]) {
        await click();
        assert.equal(buildApp.rendered, true);
        const form = mockForm(template, await buildApp.getData());
        assert.equal(form.fields.get('name1').value, 'Mira');
        assert.equal(form.fields.get('name2').value, 'Thorn');
        assert.equal(raceOptions[form.fields.get('races').value], races.dragonborn);
        assert.equal(jobOptions[form.fields.get('jobs').value], jobs.ranger);
        assert.equal(buildApp.object.cr, '3');
        assert.equal(form.fields.get('seed').value, '144426');
        assert.equal(actors.length, 0);
    }
    existing.flags.npcgen.seed = 0;
    await entries[0].onClick({}, { dataset: { entryId: 'existing' } });
    assert.equal(mockForm(template, await buildApp.getData()).fields.get('seed').value, '0');

    async function openDialog(cr, race, job) {
        const app = new NPCGenerator();
        Object.assign(app.object, { cr, race, job });
        const data = await app.getData();
        const form = mockForm(template, data);
        app.element = form;
        app._renderNPCGenerator(app, form, data);
        form.fields.get('seed').value = '7919';
        form.fields.get('folder').value = 'test-folder';
        return form;
    }

    const named = await openDialog('3', races.human, jobs.warrior);
    assert.equal(named.fields.get('hpLevel').value, 'low');
    assert.equal(named.fields.get('tokenNameMode').value, 'first');
    Object.entries({ hpLevel: 'standard', name1: 'Luna', name2: 'Stone', tokenNameMode: 'custom',
        customTokenName: 'Captain', disposition: '1', sex: 'Female' }).forEach(([name, value]) => {
        named.fields.get(name).value = value;
    });
    named.fields.get('lockRotation').checked = true;
    named.change();
    assert.equal(named.find('[data-custom-token]').visible, true);
    await named.submit();

    assert.equal(actors.length, 1);
    const [actor] = actors;
    assert.equal(actor.name, 'Luna Stone');
    assert.equal(actor.folder, 'test-folder');
    assert.equal(actor.flags.npcgen.hpLevel, 'standard');
    assert.equal(actor.flags.npcgen.seed, 7919);
    assert.ok(actor.system.attributes.hp.max >= 60);
    assert.equal(actor.prototypeToken.name, 'Captain');
    assert.equal(actor.prototypeToken.actorLink, true);
    assert.equal(actor.prototypeToken.disposition, 1);
    assert.equal(actor.prototypeToken.lockRotation, true);

    const batch = await openDialog('1/8', races.human, jobs.commoner);
    batch.fields.get('generic').checked = true;
    batch.fields.get('quantity').value = '2.5';
    batch.change();
    assert.equal(batch.find('[data-generic]').visible, true);
    assert.equal(batch.find('[data-named]').visible, false);
    await batch.submit();
    assert.equal(actors.length, 1);
    assert.deepEqual(warnings.splice(0), ['Enter a positive whole number for quantity.']);

    batch.fields.get('quantity').value = '12';
    batch.fields.get('randomRace').checked = true;
    batch.fields.get('randomSex').checked = true;
    batch.fields.get('sex').value = 'Female';
    seeder.seed(7919);
    await batch.submit();
    const copies = actors.slice(1);
    assert.equal(copies.length, 12);
    assert.equal(new Set(copies.map((copy) => copy.flags.npcgen.race)).size > 1, true);
    assert.deepEqual([...new Set(copies.map((copy) => copy.flags.npcgen.biography.physical.sex))].sort(), ['Female', 'Male']);
    for (const copy of copies) {
        const flags = copy.flags.npcgen;
        const minimum = races[flags.race].cr ?? '0';
        const [numerator, denominator = '1'] = String(minimum).split('/');
        assert.ok(Number(numerator) / Number(denominator) <= 0.125);
        assert.equal(copy.folder, 'test-folder');
        assert.equal(copy.prototypeToken.name, 'Commoner');
        assert.equal(copy.prototypeToken.actorLink, false);
        assert.equal(copy.prototypeToken.appendNumber, true);
        assert.match(copy.name, new RegExp('^A .+ ' + flags.biography.physical.sex[0] + ' Commoner$'));
    }
    assert.deepEqual(warnings, []);

    const seeded = await openDialog('5', races.human, jobs.berserker);
    seeded.fields.get('name1').value = 'Seeded';
    seeded.fields.get('seed').value = '5001';
    await seeded.submit();
    await seeded.submit();
    const [first, second] = actors.slice(-2);
    assert.equal(first.flags.npcgen.seed, 5001);
    assert.equal(second.flags.npcgen.seed, 5001);
    assert.deepEqual(first.system, second.system);

    seeded.fields.get('seed').value = '0';
    await seeded.submit();
    assert.equal(actors.at(-1).flags.npcgen.seed, 0);
    seeded.fields.get('seed').value = '1.5';
    const count = actors.length;
    await seeded.submit();
    assert.equal(actors.length, count);
    assert.deepEqual(warnings.splice(0), ['Enter a whole-number seed from 0 to 999999.']);

    const { NPCDraft } = await imp('module/generator/npcdraft.js');
    const validate = NPCDraft.prototype.validate;
    let attempts = 0;
    NPCDraft.prototype.validate = () => { attempts++; return false; };
    seeded.fields.get('seed').value = '5001';
    try {
        for (const hpLevel of ['low', 'standard']) {
            seeded.fields.get('hpLevel').value = hpLevel;
            await seeded.submit();
            assert.equal(actors.at(-1).flags.npcgen.seed, 5001);
        }
        assert.equal(attempts, 2);
    } finally {
        NPCDraft.prototype.validate = validate;
    }
}
