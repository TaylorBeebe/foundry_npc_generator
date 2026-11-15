import { gen_physical, gen_table } from './bio.js';
import * as jobs from './generator/jobs.js';
import { NPCDraft } from './generator/npcdraft.js';
import * as races from './generator/races.js';
import * as names from './names.js';
import { DISPOSITIONS, FILE_PATH, HP_LEVELS, MODULE, TITLE, TOKEN_NAMES } from './settings.js';
import { browseArt } from './art.js';
import { between, logger, parseCR, pick, sounds } from './utils.js';
const CR_range = [
    '0',
    '1/8',
    '1/4',
    '1/2',
    '1',
    '2',
    '3',
    '4',
    '5',
    '6',
    '7',
    '8',
    '9',
    '10',
    '11',
    '12',
    '13',
    '14',
    '15',
    '16',
    '17',
    '18',
    '19',
    '20',
];
class NPCGeneratorPortraitFilter extends FormApplication {
    object = { tags: {}, files: [], size: 0 };
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            id: 'npcgen-5e-portrait',
            title: 'Portrait Filter',
            classes: ['sheet'],
            template: FILE_PATH + '/templates/tags.html',
            width: 600,
        });
    }
    async _updateObject(_event, formData) {
        this.object.tags = formData;
    }
}
export class NPCGenerator extends FormApplication {
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            id: 'npcgen-5e',
            title: TITLE,
            classes: ['sheet'],
            template: FILE_PATH + '/templates/menu.html',
            width: 700,
        });
    }
    static selectOptionsNoEscape(choices, options) {
        let { localize = false, selected = null, blank = null, sort = false, nameAttr, labelAttr, inverted, } = options.hash;
        selected = selected instanceof Array ? selected.map(String) : [String(selected)];
        // Prepare the choices as an array of objects
        const selectOptions = [];
        if (choices instanceof Array) {
            for (const choice of choices) {
                const name = String(choice[nameAttr]);
                let label = choice[labelAttr];
                if (localize)
                    label = game.i18n.localize(label);
                selectOptions.push({ name, label });
            }
        }
        else {
            for (const choice of Object.entries(choices)) {
                const [key, value] = inverted ? choice.reverse() : choice;
                const name = String(nameAttr ? value[nameAttr] : key);
                let label = labelAttr ? value[labelAttr] : value;
                if (localize)
                    label = game.i18n.localize(label);
                selectOptions.push({ name, label });
            }
        }
        // Sort the array of options
        if (sort)
            selectOptions.sort((a, b) => a.label.localeCompare(b.label));
        // Prepend a blank option
        if (blank !== null) {
            const label = localize ? game.i18n.localize(blank) : blank;
            selectOptions.unshift({ name: '', label });
        }
        // Create the HTML
        let html = '';
        for (const option of selectOptions) {
            const isSelected = selected.includes(option.name);
            html += `<option value="${option.name}" ${isSelected ? 'selected' : ''}>${option.label}</option>`;
        }
        return new Handlebars.SafeString(html);
    }
    _defaultObject = {
        name1: '',
        name2: '',
        name3: '',
        seed: '',
        locks: {
            name1: false,
            name2: false,
            name3: false,
            portrait: false,
            races: false,
            jobs: false,
            physical: false,
            clothing: false,
            personality: false,
            ideals: false,
            bonds: false,
            plot: false,
            age: false,
            sex: false,
        },
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
            ideals: [],
            bonds: [],
            flaws: [],
            plot: [],
        },
        race: races.races.human,
        job: jobs.jobs.warrior,
        alignment: '',
        cr: '1/8',
        selection: {
            names: 0,
            races: 0,
            jobs: 0,
            cr: 0,
        },
        indexes: {
            names: names.index,
            races: races.index,
            jobs: jobs.index,
        },
        portrait: '',
        token: '',
        folders: [],
        hasFolders: false,
        folder: '',
    };
    object = foundry.utils.mergeObject({}, this._defaultObject);
    /**
     * Get all game settings related to the form, to display them
     */
    async getData() {
        if (!game.settings.get(MODULE, 'autogen-bio'))
            foundry.utils.mergeObject(this.object.locks, {
                physical: true,
                clothing: true,
                personality: true,
                ideals: true,
                bonds: true,
                plot: true,
            });
        this.object.folders = game.folders.filter((f) => f.type === 'Actor' && f.displayed);
        this.object.hasFolders = this.object.folders.length >= 1;
        const setting = (key) => game.settings.get(MODULE, key);
        this.object.generation = {
            hpLevels: HP_LEVELS, dispositions: DISPOSITIONS, tokenNames: TOKEN_NAMES,
            hpLevel: setting('hp-level'),
            disposition: setting('token-disposition'),
            actorLink: setting('named-token-link'),
            tokenNameMode: setting('token-name-mode'),
            customTokenName: setting('custom-token-name'),
            generic: setting('generic-npc'),
            quantity: setting('generic-quantity'),
            randomRace: setting('generic-random-race'),
            randomSex: setting('generic-random-sex'),
            lockRotation: setting('token-lock-rotation'),
        };
        return {
            object: this.object,
            title: this.title,
            options: this.options,
        };
    }
    updateNameBoxes(generators) {
        const checkboxes = this.element.find('#names :checkbox');
        for (let i = 0; i < checkboxes.length; i++) {
            const show = generators.length > i;
            const checkbox = checkboxes[i];
            const target = this.element.find(`#${checkbox.getAttribute('for')}`);
            if (!checkbox.checked && !show) {
                if (!target.hasClass('hide'))
                    target.addClass('hide');
            }
            else if (target.hasClass('hide'))
                target.removeClass('hide');
        }
        for (let i = 0; i < generators.length; i++) {
            const input = this.element.find(`input[name=name${i + 1}]`);
            input[0].placeholder = generators[i].label;
        }
    }
    updateSelectBox(name, result) {
        const box = this.element.find(`select[name=${name}]+span.npc-info`);
        if (box.length) {
            box.text(result);
        }
    }
    // Disables the _updateObject method
    async _updateObject() { }
    /**
     * Handles the change event for a range input element.
     * @param event - The change event object.
     */
    _onChangeRange(event) {
        const field = event.target?.parentElement.querySelector('.range-value');
        if (field) {
            if (field.tagName === 'INPUT') {
                field.value = event.target?.value;
                return;
            }
            if (field.classList.contains('cr')) {
                const value = CR_range[event.target?.value];
                field.innerHTML = value;
                this.object.cr = value;
                return;
            }
            field.innerHTML = event.target?.value;
        }
    }
    async _onChangeInput(event) {
        // Handle changes to specific input types
        const el = event.currentTarget;
        const prev = el.previousElementSibling;
        if (prev && prev.children[0]?.classList.contains('lock-btn')) {
            prev.children[0].checked = false;
        }
        if (el.tagName === 'INPUT' && el.name === 'portrait') {
            this._onSelectFile(el.value);
            if (el.value)
                this._lock('portrait', true);
        }
        else if (el.id === 'generator') {
            const generators = names.references[el.value];
            const group = !Array.isArray(generators);
            if (!group) {
                this.updateNameBoxes(generators);
            }
            this._randomizeName();
        }
        if (el.type === 'color' && el.dataset.edit)
            this._onChangeColorPicker(event);
        else if (el.type === 'range')
            this._onChangeRange(event);
        else if (el.type === 'select-one') {
            if (el.name === 'races') {
                this._randomizeRace();
                await this._randomizeBio();
            }
            else if (el.name === 'jobs') {
                this._randomizeJob();
                await this._randomizeBio();
            }
        }
        // Maybe submit the form
        if (this.options.submitOnChange) {
            this._onSubmit(event);
        }
    }
    _onSelectFile(selection, filePicker) {
        const el = this.element.find('div.picture img[title=Portrait]');
        el[0].src = selection || 'icons/svg/circle.svg';
    }
    _lock(input, checked) {
        const lock = this.element.find(`:checkbox[for=${input}]`)[0];
        if (!lock)
            return;
        const check = checked ?? !lock.checked;
        lock.checked = check;
    }
    _find_selection(selection, search) {
        let found;
        if (!Array.isArray(selection) && !selection.apply) {
            for (const sel of Object.values(selection)) {
                found = this._find_selection(sel, search);
                if (found)
                    break;
            }
        }
        else if (selection === search)
            found = selection;
        return found;
    }
    async _randomizeName() {
        const race = this.object.race, html = this.element, desc = ['', '', ''];
        let generators;
        if (race.languages) {
            for (let i = 0; i < race.languages.length; i++) {
                generators = this._find_selection(names.references[html.find('#generator')[0].value], race.languages[i]);
                if (generators)
                    break;
            }
        }
        if (!generators)
            generators = app._pick_selection(names.references[html.find('#generator')[0].value]);
        app.updateNameBoxes(generators);
        const explanation = html.find('#explanation');
        for (let i = 0; i < 3; i++) {
            const generator = generators[i];
            const id = `name${i + 1}`;
            const checked = html.find(`#${id} label input`)[0].checked;
            const hidden = html.find(`#${id}`).hasClass('hide');
            if (hidden) {
                html.find(`input[name=${id}]`)[0].value = '';
                desc[i] = '';
            }
            else if (!checked) {
                const gen = await generator.get();
                html.find(`input[name=${id}]`)[0].value = gen[0];
                desc[i] = gen[1];
            }
        }
        if (!desc[0] && !desc[1] && !desc[2])
            explanation[0].innerText = '...';
        else
            explanation[0].innerText = desc.join(' ');
    }
    _randomizeRace() {
        this.object.race = this._pick_selection(races.references[this.form.querySelector('select[name=races]').value]);
        this.form.querySelector('select[name=races]+span.npc-info').textContent =
            this.object.race.name;
    }
    _randomizeJob() {
        this.object.job = this._pick_selection(jobs.references[this.form.querySelector('select[name=jobs]').value]);
        this.form.querySelector('select[name=jobs]+span.npc-info').textContent =
            this.object.job.name;
    }
    async _randomizeBio() {
        const html = this.element;
        const app = this;
        // Create Tags
        const cr = parseCR(this.object.cr);
        const tags = new Set([
            this.object.race.name,
            this.object.job.name,
            ...(this.object.race.tags ?? []),
            ...(this.object.job.tags ?? []),
        ]);
        if (!tags.has('rich') && cr < 1)
            tags.add('poor');
        if (cr === 0)
            tags.add('commoner');
        else if (cr < 0.5)
            tags.add('novice');
        else if (cr < 2)
            tags.add('amateur');
        else if (cr < 6)
            tags.add('professional');
        else if (cr < 11)
            tags.add('expert');
        else
            tags.add('master');
        if (!this.getCheckBox('physical')) {
            const physical = gen_physical(this.object.race, this.object.job, parseCR(this.object.cr), tags);
            if (this.getCheckBox('age'))
                physical.age = this.getPhysicalInput('age');
            if (this.getCheckBox('sex'))
                physical.sex = this.getPhysicalInput('sex');
            for (const [key, value] of Object.entries(physical)) {
                const el = html.find(`#physical input[name=${key}]`)[0];
                if (el)
                    el.value = value;
            }
            this.object.biography.physical = physical;
        }
        const sex = this.getPhysicalInput('sex');
        const setPronoun = (nominal, possessive1, possessive2) => {
            tags.pronoun = {
                nominal,
                possessive1,
                possessive2,
            };
        };
        if (sex === 'Male') {
            setPronoun('he', 'him', 'his');
            tags.add('male');
        }
        else if (sex === 'Female') {
            setPronoun('she', 'her', 'her');
            tags.add('female');
        }
        else {
            const special = /\((\w+)\/(\w+)\/*(\w*)\)/.exec(sex);
            if (special)
                setPronoun(special[1].toLowerCase(), special[2].toLowerCase(), special[3].toLowerCase() ?? special[2].toLowerCase());
            else
                setPronoun('they', 'their', 'theirs');
        }
        function parse(text) {
            const range = between;
            const name = app.object.name1;
            const surname = app.object.name2 + ' ' + app.object.name3;
            const pattern = /{([^}]*)}/g;
            return text.replaceAll(pattern, (match, p) => eval(p));
        }
        async function genBio(fieldset, apply, ...args) {
            if (!app.getCheckBox(fieldset)) {
                const ps = html.find(`#${fieldset} p`);
                ps.remove();
                const els = (await apply(...args));
                const fsEl = html.find(`#${fieldset}`);
                for (const p of els)
                    fsEl.append($('<p>' + parse(p) + '</p>'));
                app.object.biography[fieldset] = els;
                return fsEl;
            }
        }
        async function genPersonality(tags) {
            const personality = await genBio('personality', gen_table, 'personality', 2, 2, tags);
            if (personality) {
                const flaws = await gen_table('flaw', 1, 1, tags);
                for (const p of flaws)
                    personality.append($('<p class="flaw">' + p + '</p>'));
                app.object.biography.flaws = flaws;
            }
        }
        await genBio('bonds', gen_table, 'bonds', 1, 1, tags); // This determines the background
        await genBio('ideals', gen_table, 'ideals', 1, 1, tags);
        await genPersonality(tags);
        await genBio('plot', gen_table, 'plot', 1, 1, tags);
        //await genBio('clothing', gen_table, 'clothing', 1, 1, tags);
        this.object.alignment = NPCDraft.getAlignment(this.object.race, this.object.job, tags);
    }
    _pick_selection(selection) {
        const list = [];
        const map = (selection) => {
            if (!Array.isArray(selection) && !selection.apply) {
                for (const sel of Object.values(selection))
                    map(sel);
                return;
            }
            list.push(selection);
        };
        map(selection);
        const CRFilter = game.settings.get(MODULE, 'minimum-cr');
        const cr = Math.max(parseCR(this.object.cr), 0);
        const filtered_list = list.filter((v) => parseCR(v.cr ?? 0) <= cr);
        const selected = pick(CRFilter && filtered_list.length ? filtered_list : list);
        return selected;
    }
    getCheckBox(name) {
        return this.element.find(`:checkbox[for=${name}]`)[0].checked;
    }
    getPhysicalInput(name) {
        return (this.object.biography.physical[name] = this.element.find(`fieldset input[name=${name}]`)[0].value);
    }
    _renderNPCGenerator(app, html, formData) {
        const data = formData.object;
        async function load_images(user_dir, browsed) {
            function get_tags(imgs) {
                const tags = [];
                const file_pattern = /.+[\/](.+)/;
                const tag_pattern = /[^_.]+/g;
                imgs.forEach((file) => {
                    const file_name = file_pattern.exec(file);
                    let match = null;
                    if (file_name)
                        while ((match = tag_pattern.exec(file_name[1]))) {
                            if (!tags.includes(match[0]) &&
                                !['jpg', 'webp', 'png'].includes(match[0].toLowerCase()) &&
                                isNaN(+match[0]))
                                tags.push(match[0]);
                        }
                });
                return tags;
            }
            const files = [...await browsed];
            let tokens;
            try {
                tokens = await browseArt(user_dir + '/tokens');
            }
            catch {
                tokens = [];
            }
            // Remove tokens from portraits, because of subfolder search
            for (const token of tokens) {
                const idx = files.indexOf(token);
                if (idx !== -1)
                    files.splice(files.indexOf(token), 1);
            }
            const tags = get_tags(files);
            return { tags, files, tokens };
        }
        function filter(tags) {
            const file_pattern = /.+[\/](.+)/;
            const tag_pattern = /[^_.]+/gi;
            const filtered_imgs = [];
            const races_keys = Object.keys(races.races), jobs_keys = Object.keys(jobs.jobs);
            const filter_race = tags.includes('race*'), filter_job = tags.includes('job*');
            //const tags_found = Object.keys(portraitFilter.object.tags);
            portraitFilter.object.files.forEach((file) => {
                const file_name = file_pattern.exec(file);
                let checks = 0;
                let match = null;
                if (file_name) {
                    let race_matched = false, job_matched = false;
                    while ((match = tag_pattern.exec(file_name[1]))) {
                        const key = match[0].toLowerCase();
                        if (races_keys.includes(key))
                            race_matched = true;
                        if (jobs_keys.includes(key))
                            job_matched = true;
                        if (tags.includes(key) ||
                            (filter_race && app.object.race.name === key) ||
                            (filter_job && app.object.job.name === key))
                            checks++;
                        //if (!tags_found.includes(match[0]) && !['jpg', 'webp', 'png'].includes(match[0])) tags_found.push(match[0]);
                    }
                    if (!race_matched && filter_race)
                        checks++;
                    if (!job_matched && filter_job)
                        checks++;
                }
                if (checks === tags.length)
                    filtered_imgs.push(file);
            });
            return filtered_imgs;
        }
        async function randomize() {
            sounds.dice.play();
            // Randomize Race
            if (!app.getCheckBox('races'))
                app._randomizeRace();
            // Randomize Job
            if (!app.getCheckBox('jobs'))
                app._randomizeJob();
            // Randomize Portrait
            if (!app.getCheckBox('portrait')) {
                const filters = [];
                Object.entries(portraitFilter.object.tags).forEach(([key, value]) => {
                    if (value)
                        filters.push(key);
                });
                const file = pick(filter(filters));
                html.find('input[name=portrait]')[0].value = file ?? '';
                app._onSelectFile(file);
            }
            // Randomize Names
            await app._randomizeName();
            // Create Biography
            await app._randomizeBio();
        }
        // Resize the app everytime it renders
        app.position.height = 'auto';
        const Picker = globalThis.FilePicker ?? foundry.applications.apps.FilePicker.implementation;
        app.filepickers.push(new Picker({
            type: 'image',
            field: app.element.find('input[name=portrait]')[0],
            callback: (file) => {
                app._onSelectFile(file);
                app._lock('portrait', true);
            },
            displayMode: 'tiles',
        }));
        html.find('.file-picker2[data-target=portrait]').on('click', (ev) => app.filepickers[0].render(true));
        const portraitFilter = new NPCGeneratorPortraitFilter();
        let images;
        const artFiles = new Map();
        const user_dir = String(game.settings.get(MODULE, 'portrait-directory') ?? '');
        const checks = { 'race*': true, 'job*': true };
        portraitFilter.object = { tags: checks, files: [], size: 0 };
        html.find('#portrait-filter').on('click', (ev) => portraitFilter.render(true));
        if (user_dir) {
            const browsed = browseArt(user_dir).catch((error) => {
                logger.warn(error.message);
                return [];
            });
            artFiles.set(user_dir, browsed);
            load_images(user_dir, browsed).then((res) => {
                const tags = res.tags.sort((a, b) => {
                    if (a > b)
                        return 1;
                    if (a < b)
                        return -1;
                    return 0;
                });
                tags.forEach((el) => (checks[el] = false));
                portraitFilter.object = { tags: checks, files: res.files, size: res.files.length };
                images = res;
            });
        }
        html.find('#randomizer').on('click', randomize);
        const control = (name) => html.find(`[name="${name}"]`)[0];
        const updateGenerationFields = () => {
            const generic = control('generic').checked;
            html.find('[data-generic]').toggle(generic);
            html.find('[data-named]').toggle(!generic);
            html.find('[data-custom-token]').toggle(!generic && control('tokenNameMode').value === 'custom');
        };
        html.find('[name=generic], [name=tokenNameMode]').on('change', updateGenerationFields);
        updateGenerationFields();
        const createButton = html.find('#create');
        createButton.on('click', async () => {
            const generic = control('generic').checked;
            const names = [];
            for (let i = 1; i <= 3; i++) {
                const id = 'name' + i;
                const name = control(id).value.trim();
                if (!generic && name && !html.find('#' + id).hasClass('hide'))
                    names.push(name);
            }
            if (!generic && !names.length) {
                ui.notifications.warn('Enter a name for a named NPC.');
                return;
            }
            const cr = parseCR(data.cr);
            const minimum = game.settings.get(MODULE, 'minimum-cr');
            const randomRace = generic && control('randomRace').checked;
            if (!randomRace && minimum && parseCR(data.race.cr ?? 0) > cr) {
                ui.notifications.warn(`You need at least a CR of ${data.race.cr} for creating a ${data.race.name}.`);
                return;
            }
            const racesForCR = Object.values(races.races).filter((race) => !minimum || parseCR(race.cr ?? 0) <= cr);
            const randomSex = generic && control('randomSex').checked;
            const quantity = generic ? Number(control('quantity').value) : 1;
            if (!Number.isSafeInteger(quantity) || quantity < 1) {
                ui.notifications.warn('Enter a positive whole number for quantity.');
                return;
            }
            const portrait = control('portrait').value;
            const samePortrait = Boolean(portrait && portrait === data.portrait);
            const seedInput = control('seed');
            const seed = seedInput.value === '' ? Math.floor(Math.random() * 1000000) : Number(seedInput.value);
            if (seedInput.validity?.badInput || !Number.isInteger(seed) || seed < 0 || seed > 999999) {
                ui.notifications.warn('Enter a whole-number seed from 0 to 999999.');
                return;
            }
            for (const name of Object.keys(data.biography.physical))
                app.getPhysicalInput(name);
            const input = {
                name1: names[0] ?? '',
                name2: names[1] ?? '',
                name3: names[2] ?? '',
                portrait,
                portraitLocked: app.getCheckBox('portrait'),
                tokenNameMode: control('tokenNameMode').value,
                customTokenName: control('customTokenName').value,
                actorLink: control('actorLink').checked,
                disposition: Number(control('disposition').value),
                lockRotation: control('lockRotation').checked,
                hpLevel: control('hpLevel').value,
                generic,
                job: data.job.name,
                cr,
                alignment: randomRace ? '' : data.alignment,
            };
            const manualToken = samePortrait ? data.token : '';
            const alternate = images?.tokens.find((file) => file.split('/').at(-1)?.split('.')[0] === portrait.split('/').at(-1)?.split('.')[0]);
            createButton.prop('disabled', true);
            let created = 0;
            try {
                for (let i = 0; i < quantity; i++) {
                    const race = randomRace ? pick(racesForCR) : data.race;
                    const biography = foundry.utils.deepClone(data.biography);
                    if (generic && (randomSex || !biography.physical.sex))
                        biography.physical.sex = pick(['Female', 'Male']);
                    await NPCDraft.create({
                        ...input,
                        token: generic && (randomRace || randomSex) ? '' : manualToken || alternate,
                        race: race.name,
                        biography,
                        seed: (seed + i) % 1000000,
                    }, { folder: control('folder')?.value, artFiles });
                    created++;
                }
            } catch (error) {
                logger.error(error);
                if (quantity > 1)
                    ui.notifications.warn(`${created} of ${quantity} NPCs created.`);
            } finally {
                createButton.prop('disabled', false);
            }
        });
        // Fixes cr_range value
        const cr_range = html.find('input[name=cr]')[0];
        cr_range.value = '' + CR_range.indexOf(data.cr);
        // Biography Content
        // Slider
        const sliderMenu = html.find('div.slider-menu');
        const sliders = [];
        const sections = [];
        let selected = -1;
        function linkExtraContent(button) {
            const section = html.find(`section[name=${button.getAttribute('for')}]`);
            sliders.push(button);
            sections.push(section);
            const idx = sliders.length - 1;
            const openSlider = () => {
                sliderMenu.animate({ right: '-331px' }, 100, () => sliders.forEach((slider) => (slider.disabled = false)));
                for (let i = 0; i < sliders.length; i++) {
                    const slider = sliders[i], section = sections[i];
                    if (slider === button) {
                        section.animate({ right: '-300px' }, 100);
                        break;
                    }
                }
                selected = idx;
                button.classList.add('selected');
            };
            button.addEventListener('click', () => {
                sounds.lock.play();
                sliders.forEach((slider) => (slider.disabled = true));
                if (selected !== -1) {
                    sliderMenu.animate({ right: '-31px' }, 100, () => {
                        sliders.forEach((slider) => (slider.disabled = false));
                        sliders[selected].classList.remove('selected');
                        if (selected !== idx)
                            openSlider();
                        else
                            selected = -1;
                    });
                    sections[selected].animate({ right: '0px' }, 100);
                }
                else
                    openSlider();
            });
        }
        html.find('button.slider')
            .get()
            .forEach((button) => linkExtraContent(button));
    }
}
export const app = new NPCGenerator();
Handlebars.registerHelper({ selectOptionsNoEscape: NPCGenerator.selectOptionsNoEscape });
