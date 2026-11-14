import { HP_LEVELS, MODULE, getDefaultFolder } from './settings.js';
import { parseCR } from './utils.js';
import { jobs } from './generator/jobs.js';
import { races } from './generator/races.js';
import { NPCDraft } from './generator/npcdraft.js';

const BRIDGE = 'foundry-mcp-bridge';
const QUERY = MODULE + '.generateNPC';

export function registerMcpQuery() {
    if (!game.modules.get(BRIDGE)?.active)
        return;

    // Drafts share the generator's seeded RNG. Run bridge requests one at a time.
    let pending = Promise.resolve();
    CONFIG.queries[QUERY] = (input, ...sender) => {
        if (sender.length)
            return Promise.reject(new Error('Use the Foundry MCP Bridge to generate NPCs.'));
        const request = pending.then(() => generate(input));
        pending = request.catch(() => {});
        return request;
    };
}

async function generate(input) {
    if (!game.user?.isGM || !game.user.hasPermission('ACTOR_CREATE') ||
        game.settings.get(BRIDGE, 'allowWriteOperations') !== true)
        throw new Error('Generating an NPC requires a Foundry GM session with MCP write operations enabled.');
    if (game.system.id !== 'dnd5e')
        throw new Error('Eldore requires D&D 5e.');
    if (!input || typeof input !== 'object' || Array.isArray(input))
        throw new Error('NPC options must be an object.');
    const { firstName, lastName, generic = false, race, job, cr, hpLevel, sex, folderId } = input;
    if (typeof generic !== 'boolean')
        throw new Error('generic must be a boolean.');
    const name1 = readName(firstName);
    const name2 = readName(lastName);
    if (!generic && !name1)
        throw new Error('Provide firstName for a named NPC, or set generic to true.');
    if (!Object.hasOwn(races, race))
        throw new Error('Unknown race. Choose from: ' + Object.keys(races).join(', '));
    if (!Object.hasOwn(jobs, job))
        throw new Error('Unknown job. Choose from: ' + Object.keys(jobs).join(', '));
    const rating = parseCR(cr);
    if (!((Number.isInteger(rating) && rating >= 0 && rating <= 20) || [0.125, 0.25, 0.5].includes(rating)))
        throw new Error('CR must be 0–20, 1/8, 1/4, or 1/2.');
    if (game.settings.get(MODULE, 'minimum-cr') && rating < parseCR(races[race].cr ?? 0))
        throw new Error('Minimum CR for ' + race + ' is ' + races[race].cr + '.');
    if (hpLevel !== undefined && !Object.hasOwn(HP_LEVELS, hpLevel))
        throw new Error('HP level must be low, standard, or original.');
    if (sex !== undefined && !['Female', 'Male'].includes(sex))
        throw new Error('Sex must be Female or Male when supplied.');
    if (folderId !== undefined && (typeof folderId !== 'string' || game.folders.get(folderId)?.type !== 'Actor'))
        throw new Error('folderId must identify an Actor folder.');

    const config = { name1, name2, generic, race, job, cr: rating, seed: Math.floor(Math.random() * 1000000) };
    if (sex)
        config.biography = { physical: { sex } };
    if (hpLevel !== undefined)
        config.hpLevel = hpLevel;
    const actor = await NPCDraft.create(config, { folder: folderId ?? getDefaultFolder() });
    return { id: actor.id, uuid: actor.uuid, name: actor.name, race, job, cr: rating, hp: actor.system.attributes.hp.max };
}

function readName(value) {
    if (value === undefined)
        return '';
    if (typeof value !== 'string' || value.length > 100 || /[<>]/.test(value))
        throw new Error('Names must be plain text of at most 100 characters.');
    return value.trim();
}
