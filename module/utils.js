import { MODULE, TITLE } from './settings.js';
// All sound files are stored in this object for ease of use
export const sounds = {
    dice: new Audio('sounds/dice.wav'),
    lock: new Audio('sounds/lock.wav'),
};
export const seeder = new foundry.dice.MersenneTwister();
/**
 * Wraps console methods with a custom title and style.
 * @param title - The title to be displayed in the console.
 * @param style - The CSS style to be applied to the title.
 * @returns An object with debug, log, warn, and error methods.
 */
function consoleWrapper(title = TITLE, style = 'color:red;font-weight:bold') {
    const stylization = [`%c${title} %c|`, style, ''];
    return {
        debug: (message) => console.debug(...stylization, message),
        log: (message) => console.log(...stylization, message),
        warn: (message) => console.warn(...stylization, message),
        error: (message) => console.error(...stylization, message),
    };
}
// Padronized logging messages
export const logger = consoleWrapper();
/**
 * Selects one element of the array at random
 * @param array Any array
 * @returns Any single element of the array
 */
export function pick(array) {
    return array[~~(seeder.rnd() * array.length)];
}
/**
 * Selects one element of the array at random, using weighted distribution
 * @param array Any array
 * @param weights An array of numbers containing the same number of elements than array
 * @returns Any single element of the array
 */
export function pick_weights(array, weights) {
    const length = array.length;
    const sum = weights.reduce((a, b) => a + b, 0);
    const rand = ~~(seeder.rnd() * sum);
    let k = 0;
    for (let i = 0; i < length; i++) {
        k += weights[i];
        if (k > rand)
            return array[i];
    }
    return array[0];
}
/**
 * Randomize an integer between the minimum and maximum number
 * @param min minimum
 * @param max maximum
 */
export function between(min, max) {
    return ~~(seeder.rnd() * (max - min) + min + 0.5);
}
export function parseCR(value) {
    const match = /^(\d+(?:\.\d+)?)(?:\/(\d+))?$/.exec(String(value ?? '').trim());
    if (!match || (match[2] !== undefined && Number(match[2]) === 0))
        return NaN;
    return Number(match[1]) / Number(match[2] ?? 1);
}
export function numberExtense(number) {
    const unity = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
    return unity[number % 10];
}
export function numberSign(number) {
    return (number < 0 ? '' : '+') + number;
}
/**
 * Creates a single object referencing all inner objects
 * @param group Object of chained entities
 */
export function recursive_menu(group, fn) {
    const menu_by_name = {};
    const menu_by_reference = {};
    let id = 0;
    const recursion = (category, value, prefix = '') => {
        menu_by_reference[id] = value;
        id += 1;
        if (!Array.isArray(value) && !value.apply) {
            menu_by_name[id - 1] = prefix + category + ' [+]';
            Object.entries(value).forEach(([key, value]) => recursion(key, value, prefix + '&#160;&#160;'));
            return;
        }
        menu_by_name[id - 1] = prefix + category;
    };
    Object.entries(group).forEach(([key, value]) => recursion(key, value));
    return [menu_by_name, menu_by_reference];
}
// Checks wether a number is odd
export function isOdd(num) {
    return num % 2;
}
/**
 * Returns the ordinal number of a given cardinal number
 * @param i Number to check
 * @returns [number]st or [number]nd or [number]rd
 */
export function ordinalNumber(i) {
    var j = i % 10, k = i % 100;
    if (j == 1 && k != 11) {
        return i + 'st';
    }
    if (j == 2 && k != 12) {
        return i + 'nd';
    }
    if (j == 3 && k != 13) {
        return i + 'rd';
    }
    return i + 'th';
}
/**
 * Filters an array using multiple filters, if the remaining array is empty, returns the original array
 * @param main The main array to filter
 * @param filters Filters to be applied to the main array
 * @returns Either the main array or the filtered array
 */
export function multipleFilter(main, filters) {
    const res = [main, ...filters].reduce((filterA, filterB) => (filterA ?? main).filter((el) => (filterB ?? main).indexOf(el) !== -1));
    if (!res?.length)
        return main;
    return res;
}
/**
 * Returns log of x in the determined base
 * @param x log
 * @param base
 * @returns
 */
export function mathlog(x, base) {
    return Math.log(x) / Math.log(base);
}
/**
 * Shuffles an Array in place
 * @param array
 * @returns
 */
export function shuffle(array) {
    let currentIndex = array.length, randomIndex;
    // While there remain elements to shuffle.
    while (currentIndex != 0) {
        // Pick a remaining element.
        randomIndex = Math.floor(seeder.rnd() * currentIndex);
        currentIndex--;
        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    return array;
}
/**
 * Returns an array including every pack found of the selected type
 * @param type Library type, such as items, spells or monsters
 * @returns
 */
function getPacks(regex) {
    const keys = [];
    for (let k of game.packs.keys()) {
        if (regex.exec(k))
            keys.unshift(k);
    }
    return keys;
}
export const PACKS = {
    features: [],
    items: [],
    spells: [],
};
const packs = {
    features: [],
    items: [],
    spells: [],
};
export function searchPacks() {
    //const item_packs = getPacksByType('Item');
    PACKS.features = getPacks(/feature|races/i);
    PACKS.items = getPacks(/item|equipment24/i);
    PACKS.spells = getPacks(/spell/i);
}
export function updatePacks() {
    packs.features = PACKS.features;
    packs.items = PACKS.items;
    packs.spells = PACKS.spells;
    const prefer2024 = game.settings.get(MODULE, 'prefer-2024') ?? true;
    const prioritize = (ids, modern, legacy) => {
        const preferred = prefer2024 ? [modern, legacy] : [legacy, modern];
        return [...preferred.filter((id) => ids.includes(id)), ...ids.filter((id) => !preferred.includes(id))];
    };
    packs.items = prioritize(packs.items, 'dnd5e.equipment24', 'dnd5e.items');
    packs.spells = prioritize(packs.spells, 'dnd5e.spells24', 'dnd5e.spells');
    const configFeature = game.settings.get(MODULE, 'pack-feature'), configItem = game.settings.get(MODULE, 'pack-item'), configSpells = game.settings.get(MODULE, 'pack-spell');
    if (configFeature)
        packs.features = configFeature.split(',').map((v) => v.trim());
    if (configItem)
        packs.items = configItem.split(',').map((v) => v.trim());
    if (configSpells)
        packs.spells = configSpells.split(',').map((v) => v.trim());
}
/**
 * Look for an item in all packs of the selected database
 * @param name Item name
 * @param database
 * @returns
 */
export function findItem(name, database) {
    let id, pack;
    for (const pack_name of packs[database]) {
        const pack_ = game.packs.get(pack_name);
        if (pack_ === undefined)
            continue;
        const data = pack_.index.find((i) => getItemName(i) === name);
        id = data?._id;
        if (id) {
            pack = pack_;
            break;
        }
    }
    if (!id)
        return;
    return { id, pack: pack };
}
/**
 * Retrieves the name of an item from the given `CompendiumIndexData` or `Item` object.
 * If the item has a `babele` flag with an `originalName` property, that will be returned.
 * Otherwise, the `name` property of the item will be returned.
 *
 * @param item  The `CompendiumIndexData` or `Item` object from which to retrieve the name.
 * @returns     The name of the item.
 */
export function getItemName(item) {
    return item.flags?.babele?.originalName || item.name;
}
/**
 * Retrieves the description of an item.
 * If the item has a custom description set by the 'npc-generator-dnd5e' module, it returns that.
 * Otherwise, it returns the default description of the item.
 *
 * @param item - The item to retrieve the description from.
 * @returns The description of the item.
 */
export function getItemDescription(item) {
    return item.flags?.[MODULE]?.originalDescription || item.system.description.value;
}
export function repeatFn(fn, steps, max_steps) {
    steps = ~~steps;
    if (steps < max_steps)
        max_steps = steps;
    for (let i = 0; i < max_steps; i++)
        fn();
}
export function sumArray(arr, start = 0) {
    let x = 0;
    const last = arr.length;
    for (let i = start; i < last; i++)
        x += arr[i];
    return x;
}
function bm_transform() {
    let u = 1 - Math.random(); //Converting [0,1) to (0,1)
    let v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}
export function normalRandom(mean, deviation) {
    return bm_transform() * deviation + mean;
}
export function normalRandomAdjusted(mean, deviation) {
    const dev = bm_transform() * deviation;
    return mean ** ((dev + mean) / mean);
}
export const elementFromList = (texts, element = 'p') => `<${element}>` + texts.join(`</${element}><${element}>`) + `</${element}>`; // .replaceAll(/(<|<\/)p/g, `$1${element}`)
