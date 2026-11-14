import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const source = fileURLToPath(new URL('../', import.meta.url));
const output = resolve(process.argv[2] ?? join(source, 'dist'));
const manifest = JSON.parse(await readFile(join(source, 'module.json'), 'utf8'));
const repository = process.env.ELDORE_REPOSITORY;
const version = process.env.ELDORE_VERSION;
if (!/^[\w.-]+\/[\w.-]+$/.test(repository ?? ''))
    throw new Error('Set ELDORE_REPOSITORY to the GitHub owner and repository.');
if (!/^\d+\.\d+\.\d+$/.test(version ?? '') || version !== manifest.version)
    throw new Error('ELDORE_VERSION must match the version in module.json.');

const id = 'npc-generator-dnd5e-eldore';
if (manifest.id !== id)
    throw new Error('Unexpected module ID: ' + manifest.id);
const url = 'https://github.com/' + repository;
Object.assign(manifest, {
    url,
    bugs: url + '/issues',
    readme: url + '/blob/HEAD/CLAUDE.md',
    changelog: url + '/blob/HEAD/CHANGELOG-eldore.md',
    manifest: url + '/releases/latest/download/module.json',
    download: url + '/releases/download/v' + version + '/' + id + '.zip',
});
delete manifest.relationships.systems[0].manifest;

const folder = join(output, id);
await mkdir(dirname(folder), { recursive: true });
await mkdir(folder);
const runtime = ['main.js', 'style.css', 'module', 'compatibility', 'templates', 'names', 'tables', 'packs'];
for (const file of runtime)
    await cp(join(source, file), join(folder, file), { recursive: true });
for (const destination of [output, folder])
    await writeFile(join(destination, 'module.json'), JSON.stringify(manifest, null, 4) + '\n');
console.log('Staged Foundry module at ' + folder);
