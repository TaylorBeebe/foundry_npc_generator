export const HeavyWeapons = ['Glaive', 'Greataxe', 'Greatsword', 'Halberd', 'Heavy Crossbow', 'Longbow', 'Maul', 'Pike'];
export const NonHeavyWeapons = [
    'Battleaxe',
    'Blowgun',
    'Club',
    'Dagger',
    'Dart',
    'Flail',
    'Greatclub',
    'Hand Crossbow',
    'Handaxe',
    'Javelin',
    'Lance',
    'Light Crossbow',
    'Light Hammer',
    'Longsword',
    'Mace',
    'Morningstar',
    'Net',
    'Quarterstaff',
    'Rapier',
    'Scimitar',
    'Shortbow',
    'Shortsword',
    'Sickle',
    'Sling',
    'Spear',
    'Staff',
    'Trident',
    'War Pick',
    'Warhammer',
    'Whip',
    'Wooden Staff',
];
export const OneHandedWeapons = [
    'Battleaxe',
    'Blowgun',
    'Club',
    'Dagger',
    'Dart',
    'Flail',
    'Hand Crossbow',
    'Handaxe',
    'Javelin',
    'Lance',
    'Light Hammer',
    'Longsword',
    'Mace',
    'Morningstar',
    'Net',
    'Quarterstaff',
    'Rapier',
    'Scimitar',
    'Shortsword',
    'Sickle',
    'Sling',
    'Spear',
    'Staff',
    'Trident',
    'War Pick',
    'Warhammer',
    'Whip',
    'Wooden Staff',
];
export const VersatileWeapons = [
    'Battleaxe',
    'Longsword',
    'Quarterstaff',
    'Spear',
    'Staff',
    'Trident',
    'Warhammer',
    'Wooden Staff',
];
export const baseItems = {
    handcrossbow: 'hand crossbow',
    lighthammer: 'light hammer',
    lightcrossbow: 'light crossbow',
    heavycrossbow: 'heavy crossbow',
    warpick: 'war pick',
};
export function avgDmg(formula, melee = false) {
    return formula
        .replaceAll('@', '')
        .replace(/\b\d+(?=d\d)/, (str) => `(${str}${melee ? '+extra_dice_melee' : ''})`)
        .replaceAll(/d[0-9]+/g, (str) => '*' + (Number(str.slice(1)) + 1) / 2);
}
export function formulaReplace(formula, melee = false) {
    if (melee)
        formula = formula.replace(/\b\d+(?=d\d)/, (str) => `{{${str}+extra_dice_melee}}`);
    return formula.replaceAll('@mod', '{{mod}}').replaceAll('@prof', '{{prof}}');
}
// List of weapons with wrong damage calculations in the compendium, alongside their correct calculations
export const weapons = {};
