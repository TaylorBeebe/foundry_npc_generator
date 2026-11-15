import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { access, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

function run(args, env = process.env) {
    const result = spawnSync(process.execPath, args, { encoding: 'utf8', env, timeout: 15000 });
    assert.ifError(result.error);
    assert.equal(result.status, 0, result.stderr + result.stdout);
    return result.stdout;
}

test('dialog controls reach the created actor and token documents', () => {
    assert.match(run(['tools/hp-check.mjs', '--dialog']), /Dialog checks passed/);
});

test('biography tables share pending loads and stop when no rows are eligible', () => {
    assert.match(run(['tools/hp-check.mjs', '--bio']), /Biography checks passed/);
});

test('MCP bridge enforces write permissions and creates an Eldore actor', () => {
    assert.match(run(['tools/hp-check.mjs', '--mcp']), /MCP checks passed/);
});

test('Low HP and Foundry integration mocks, including Portrait Studio names', () => {
    const output = run(['tools/hp-check.mjs', '--verify', '--smoke']);
    assert.match(output, /Smoke checks passed/);
});

for (const mode of ['standard', 'original']) {
    test(mode + ' drafts respect the hit-dice cap', () => {
        run(['tools/hp-check.mjs', '--verify', '--hp=' + mode]);
    });
}

test('HP multiplier cannot bypass the cap', () => {
    run(['tools/hp-check.mjs', '--verify', '--hp=original', '--mult=50']);
});

test('2024 audit handles apostrophes and dynamic weapon names', () => {
    const audit = run(['--expose-internals', 'tools/audit-2024.cjs']);
    assert.match(audit, /Dagger \+3/);
    assert.match(audit, /Jim's Magic Missile/);
    assert.match(audit, /Branding Smite/);
    assert.doesNotMatch(audit, /^acid$/m);
});

test('release manifest points to the versioned ZIP and bundles runtime files', async (t) => {
    const output = await mkdtemp(join(tmpdir(), 'eldore-release-'));
    t.after(() => rm(output, { recursive: true }));
    const source = JSON.parse(await readFile('module.json', 'utf8'));
    const env = { ...process.env, ELDORE_REPOSITORY: 'example/eldore', ELDORE_VERSION: source.version };
    run(['tools/build-release.mjs', output], env);
    const folder = join(output, source.id);
    const remote = await readFile(join(output, 'module.json'), 'utf8');
    assert.equal(await readFile(join(folder, 'module.json'), 'utf8'), remote);
    const manifest = JSON.parse(remote);
    assert.equal(manifest.manifest, 'https://github.com/example/eldore/releases/latest/download/module.json');
    assert.equal(manifest.download, 'https://github.com/example/eldore/releases/download/v' + source.version + '/' + source.id + '.zip');
    assert.equal(manifest.relationships.systems[0].manifest, undefined);
    for (const path of [...manifest.esmodules, ...manifest.styles, ...manifest.packs.map((pack) => pack.path), 'templates/menu.html'])
        await access(join(folder, path));
    for (const path of ['tools', 'tests', 'imgs'])
        await assert.rejects(access(join(folder, path)), { code: 'ENOENT' });
    const archive = join(output, source.id + '.zip');
    const manifestPath = join(output, 'module.json');
    const zip = () => {
        const windows = process.platform === 'win32';
        const result = spawnSync(windows ? 'tar.exe' : 'zip',
            windows ? ['-a', '-cf', archive, source.id] : ['-qr', archive, source.id],
            { cwd: output, encoding: 'utf8' });
        assert.ifError(result.error);
        assert.equal(result.status, 0, result.stderr + result.stdout);
    };
    const verifier = ['tools/verify-release.mjs', archive, manifestPath];
    zip();
    assert.match(run(verifier), /Verified release ZIP/);

    const checkInvalid = (message) => {
        const result = spawnSync(process.execPath, verifier, { encoding: 'utf8' });
        assert.ifError(result.error);
        assert.notEqual(result.status, 0);
        assert.match(result.stderr, message);
    };

    await writeFile(manifestPath, remote + ' ');
    checkInvalid(/ZIP manifest differs/);
    await writeFile(manifestPath, remote);

    await writeFile(join(folder, 'module', 'private-art.webp'), '');
    await rm(archive);
    zip();
    checkInvalid(/Unexpected file in release/);
    await rm(join(folder, 'module', 'private-art.webp'));
    await rm(join(folder, 'packs', 'features'), { recursive: true });
    await rm(archive);
    zip();
    checkInvalid(/ZIP is missing packs\/features/);

    const wrongVersion = spawnSync(process.execPath, ['tools/build-release.mjs', output], {
        encoding: 'utf8', env: { ...env, ELDORE_VERSION: '0.0.0' },
    });
    assert.notEqual(wrongVersion.status, 0);
    assert.match(wrongVersion.stderr, /must match the version/);
});
