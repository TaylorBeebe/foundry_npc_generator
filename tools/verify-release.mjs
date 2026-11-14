import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { basename } from 'node:path';

const [archive, standaloneManifest] = process.argv.slice(2);
assert.ok(archive && standaloneManifest, 'Usage: node tools/verify-release.mjs <module.zip> <module.json>');
const expected = readFileSync(standaloneManifest);
const manifest = JSON.parse(expected);
const prefix = manifest.id + '/';
assert.equal(basename(archive), manifest.id + '.zip');
const windows = process.platform === 'win32';
const run = (windowsArgs, unixArgs) => execFileSync(windows ? 'tar.exe' : 'unzip', windows ? windowsArgs : unixArgs);
if (!windows)
    run([], ['-tq', archive]);
const entries = run(['-tf', archive], ['-Z1', archive]).toString().trim().split(/\r?\n/);
assert.equal(new Set(entries).size, entries.length, 'ZIP contains duplicate paths');

const excluded = new Set(['tests', 'tools', 'fixtures', 'imgs', 'node_modules']);
const image = /\.(?:apng|avif|bmp|gif|jpe?g|png|svg|tiff?|webp)$/i;
const runtime = new Set(['main.js', 'style.css', 'module.json', 'module', 'compatibility', 'templates', 'names', 'tables', 'packs']);
for (const entry of entries) {
    assert.ok(entry.startsWith(prefix), 'Unexpected path outside the module folder: ' + entry);
    if (entry === prefix)
        continue;
    const parts = entry.slice(prefix.length).replace(/\/$/, '').split('/');
    assert.ok(runtime.has(parts[0]) && !image.test(entry) &&
        parts.every((part) => part && !part.startsWith('.') && !part.includes('\\') && !excluded.has(part.toLowerCase())),
        'Unexpected file in release: ' + entry);
}
const entrySet = new Set(entries);
const readEntry = (entry) => run(['-xOf', archive, entry], ['-p', archive, entry]);
for (const required of [...manifest.esmodules, ...manifest.styles, 'templates/menu.html', 'module.json'])
    assert.ok(entrySet.has(prefix + required), 'ZIP is missing ' + required);
assert.deepEqual(manifest.packs.map((pack) => pack.path).sort(), ['packs/features', 'packs/spells']);
for (const pack of manifest.packs) {
    const directory = prefix + pack.path + '/';
    assert.ok(entrySet.has(directory + 'CURRENT'), 'ZIP is missing ' + pack.path + '/CURRENT');
    const current = readEntry(directory + 'CURRENT').toString().trim();
    assert.match(current, /^MANIFEST-\d+$/);
    assert.ok(entrySet.has(directory + current), 'ZIP is missing ' + pack.path + '/' + current);
    assert.ok(entries.some((entry) => entry.startsWith(directory) && entry.endsWith('.ldb')),
        'ZIP is missing LevelDB data for ' + pack.path);
}
assert.deepEqual(readEntry(prefix + 'module.json'), expected,
    'ZIP manifest differs from the standalone manifest');
console.log('Verified release ZIP, manifest, runtime paths, and both compendiums.');
