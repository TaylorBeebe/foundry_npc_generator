import { artSource, MODULE } from './settings.js';
import { logger, pick } from './utils.js';

const imageExtensions = ['.apng', '.avif', '.bmp', '.gif', '.jpg', '.jpeg', '.png', '.svg', '.tiff', '.webp'];

export async function browseArt(path) {
    const source = artSource();
    const picker = globalThis.FilePicker ?? foundry.applications.apps.FilePicker.implementation;
    const result = await picker.browse(source, path, { extensions: imageExtensions, recursive: source === 'forgevtt' });
    if (source === 'forgevtt')
        return result.files;
    const nested = await Promise.all(result.dirs.map((dir) => browseArt(dir)));
    return [...result.files, ...nested.flat()];
}

function decodeSegment(segment) {
    try {
        return decodeURIComponent(segment);
    } catch {
        return segment;
    }
}

function artFile(path) {
    const parts = path.split(/[?#]/)[0].split('/').map(decodeSegment);
    const file = parts.pop();
    if (parts.some((part) => part.startsWith('.') || part.toLowerCase() === 'portrait_history'))
        return;
    const extension = file.match(/\.[^.]+$/)?.[0] ?? '';
    return { path, file, stem: file.slice(0, file.length - extension.length), extension, folder: parts.at(-1) ?? '', directory: parts.join('/') };
}

function nameKey(value) {
    return value.normalize('NFKC').toLowerCase().replace(/ß/g, 'ss').replace(/ς/g, 'σ').replace(/[^\p{L}\p{N}]/gu, '');
}

function folderMatches(file, names) {
    return names.includes(nameKey(file.folder)) || names.includes(nameKey(file.folder.split(',', 1)[0]));
}

function portraitRank(file, names) {
    const key = nameKey(file.stem);
    const isCharacterFolder = folderMatches(file, names);
    const suffix = (prefix) => key.startsWith(prefix) && /^\d*$/.test(key.slice(prefix.length));
    if (isCharacterFolder && file.stem.toLowerCase() === (file.folder + '_portrait').toLowerCase())
        return 0;
    if (names.some((name) => key === name + 'portrait'))
        return 1;
    if (names.some((name) => suffix(name + 'portrait')))
        return 2;
    if (isCharacterFolder && (suffix('portrait') || suffix(nameKey(file.folder) + 'portrait')))
        return 2;
    if (!isCharacterFolder)
        return Infinity;
    if (names.includes(key) || key === nameKey(file.folder))
        return 3;
    if (file.stem.toLowerCase().startsWith('gemini_generated_image_'))
        return 4;
    return Infinity;
}

const raceAliases = { dwarf: 'dwarven', elf: 'elven', drow: 'dark elf' };
const jobAliases = { berserker: 'barbarian', thief: 'rogue', evoker: 'wizard', abjurer: 'wizard', priest: 'cleric', warcleric: 'cleric' };
function asWords(value) {
    return value?.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}

export async function findNPCArt(config, files = new Map()) {
    async function read(key) {
        const dir = game.settings.get(MODULE, key)?.trim();
        if (!dir)
            return [];
        if (!files.has(dir)) {
            files.set(dir, browseArt(dir).catch((error) => {
                logger.warn(`Could not browse ${dir}: ${error.message}`);
                return [];
            }));
        }
        return files.get(dir);
    }
    const [portraits, tokens] = await Promise.all([
        config.generic || config.portraitLocked || !config.name1 ? [] : read('portrait-directory'),
        config.token ? [] : read('token-directory'),
    ]);
    const nameParts = [config.name1, config.name2, config.name3].filter(Boolean);
    const shortName = [nameParts[0], nameParts.length > 1 ? nameParts.at(-1) : ''].filter(Boolean).join(' ');
    const names = config.generic ? [] : [...new Set([nameParts.join(' '), shortName].map(nameKey).filter(Boolean))];
    const named = portraits.map(artFile).filter(Boolean)
        .map((file) => ({ file, rank: portraitRank(file, names) }))
        .filter(({ rank }) => Number.isFinite(rank))
        .sort((a, b) => a.rank - b.rank ||
            Number(b.file.extension.toLowerCase() === '.webp') - Number(a.file.extension.toLowerCase() === '.webp') ||
            a.file.file.localeCompare(b.file.file))[0]?.file;

    const sex = asWords(config.biography?.physical?.sex);
    const race = [asWords(config.race), raceAliases[config.race]].filter(Boolean);
    const job = [asWords(config.job), jobAliases[config.job]].filter(Boolean);
    let best = 0;
    let matches = [];
    for (const file of tokens.map(artFile).filter(Boolean)) {
        const inCharacterFolder = folderMatches(file, names);
        const sameFolder = named && file.directory === named.directory;
        const folderNames = [file.folder, file.folder.split(',', 1)[0]].map(nameKey).filter(Boolean);
        if (/portrait\d*$/.test(nameKey(file.stem)) ||
            file.stem.toLowerCase().startsWith('gemini_generated_image_') ||
            folderNames.includes(nameKey(file.stem)) ||
            ((sameFolder || inCharacterFolder) && Number.isFinite(portraitRank(file, names))))
            continue;
        const words = ' ' + asWords(file.stem) + ' ';
        const has = (word) => words.includes(' ' + word + ' ');
        if ((sex === 'male' && has('female')) || (sex === 'female' && has('male')))
            continue;
        const tags = Number(race.some(has)) + Number(job.some(has)) + Number(Boolean(sex && has(sex)));
        const score = tags + (inCharacterFolder ? sameFolder ? 8 : 4 : 0);
        if (score > best) {
            matches = [];
            best = score;
        }
        if (score && score === best)
            matches.push(file.path);
    }
    return { portrait: named?.path || config.portrait, token: config.token || pick(matches) };
}
