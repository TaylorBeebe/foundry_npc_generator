// Run with Node 24: node --expose-internals tools/audit-2024.cjs
// Use Node's bundled JavaScript parser so escaped apostrophes and comments are handled.
const { parse } = require('internal/deps/acorn/acorn/dist/acorn');
const fs = require('node:fs');
const path = require('node:path');
const fixture = require('./fixtures/dnd5e-6.0.6-srd.json');

const generator = path.join(__dirname, '../module/generator');
const items = new Set();
const spells = new Set();
function visit(node, callback) {
    if (!node || typeof node !== 'object')
        return;
    if (node.type)
        callback(node);
    for (const child of Object.values(node)) {
        if (Array.isArray(child))
            child.forEach((entry) => visit(entry, callback));
        else
            visit(child, callback);
    }
}
function collect(tree, target) {
    visit(tree, (node) => {
        if (node.type === 'Literal' && typeof node.value === 'string')
            target.add(node.value);
    });
}
function parseFile(file) {
    return parse(fs.readFileSync(path.join(generator, file), 'utf8'), { ecmaVersion: 'latest', sourceType: 'module' });
}
for (const directory of ['jobs', 'races']) {
    for (const file of fs.readdirSync(path.join(generator, directory)).filter((file) => file.endsWith('.js'))) {
        visit(parseFile(path.join(directory, file)), (node) => {
            if (node.type === 'CallExpression' && node.callee.object?.name === 'draft') {
                const method = node.callee.property?.name;
                if (['weapon', 'armor', 'item'].includes(method))
                    collect(node.arguments[0], items);
                if (['spell', 'innate'].includes(method))
                    collect(node.arguments[0], spells);
            }
            if (['VariableDeclarator', 'AssignmentExpression'].includes(node.type)) {
                const name = (node.id ?? node.left)?.name;
                const value = node.init ?? node.right;
                if (/^(armor|weaponList(?:_superior)?|rangedList|ranged|weapons)$/.test(name) &&
                    ['ArrayExpression', 'Literal'].includes(value?.type)) {
                    collect(value, items);
                    items.delete('items');
                }
                if (name === 'ranged' && value?.callee?.property?.name === 'pickFavoredWeapon')
                    collect(value.arguments[0], items);
                if (['spells_primary', 'spells_utility'].includes(name) || (file === 'tiefling.js' && name === 'ancestries'))
                    collect(value, spells);
            }
        });
    }
}
visit(parseFile('item/spells.js'), (node) => {
    if (node.type === 'VariableDeclarator' && node.id.name === 'wizardCantrips')
        collect(node.init, spells);
});
// These weapon requests assemble a name at runtime.
for (const weapon of ['Dagger', 'Rapier'])
    for (const bonus of [1, 2, 3])
        items.add(weapon + ' +' + bonus);
for (const weapon of ['Greatsword', 'Pike', 'Maul', 'Halberd', 'War Pick'])
    items.add(weapon + ' +1');
for (const weapon of ['Battleaxe', 'Greataxe'])
    items.add('Berserker ' + weapon);

function report(title, names, current, legacy) {
    const modern = new Set(fixture[current].map((doc) => doc.name));
    const old = new Set(fixture[legacy].map((doc) => doc.name));
    console.log('## ' + title + ' (' + names.size + ' names checked)');
    for (const fallback of [true, false]) {
        console.log(fallback ? 'Legacy fixture fallback' : 'Absent from both fixture editions');
        const rows = [...names].filter((name) => !modern.has(name) && old.has(name) === fallback);
        console.log(rows.sort((a, b) => a.localeCompare(b)).join('\n') || '(none)');
    }
}
report('Equipment', items, 'equipment24', 'items');
report('Spells', spells, 'spells24', 'spells');
