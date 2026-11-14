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
        const selected = tag === 'select' && template.match(new RegExp('name="' + name + '"[^>]*>\\{\\{selectOptions \\w+ selected=(\\w+)'));
        const checked = attributes.match(/\{\{checked (\w+)\}\}/)?.[1];
        const value = attributes.match(/\bvalue="\{\{([^}]+)\}\}"/)?.[1];
        const read = (key) => key.split('.').reduce((object, field) => object?.[field], formData.object);
        fields.set(name, {
            value: String((selected ? generation[selected[1]] : value ? (generation[value] ?? read(value)) : '') ?? ''),
            checked: Boolean(generation[checked]),
        });
    }
    const selectors = new Map();
    function find(selector) {
        if (selectors.has(selector))
            return selectors.get(selector);
        const field = selector.match(/^(?:fieldset input|input)?\[name="?([\w]+)"?\]$/)?.[1];
        const lock = selector.match(/^:checkbox\[for=(\w+)\]$/)?.[1];
        const elements = field && fields.has(field) ? [fields.get(field)] : lock ? [{ checked: lock === 'seed' }] : [];
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
    const { NPCGenerator } = await imp('module/menu.js');
    const { jobs } = await imp('module/generator/jobs.js');
    const { races } = await imp('module/generator/races.js');

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
}
