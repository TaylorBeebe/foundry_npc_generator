// Add a single tool to Claude Desktop's installed Foundry MCP 0.8.3 backend.
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const tool = {
    name: 'eldore_generate_npc',
    description: 'Generate one NPC through Eldore in the active D&D 5e world, using Eldore equipment, spells, HP, art and token defaults. This creates an actor in Foundry.',
    inputSchema: {
        type: 'object',
        properties: {
            firstName: { type: 'string', description: 'Required for a named NPC.' },
            lastName: { type: 'string' },
            generic: { type: 'boolean', description: 'Create an unlinked NPC named after race and job.' },
            race: { type: 'string', description: 'Eldore race key, such as dwarf, human, or half-orc.' },
            job: { type: 'string', description: 'Eldore job key, such as bard, fighter, guard, or evoker.' },
            cr: { anyOf: [{ type: 'number' }, { type: 'string' }], description: 'Challenge rating, e.g. 3 or 1/2.' },
            hpLevel: { enum: ['low', 'standard', 'original'], description: 'Omit to use the world setting.' },
            sex: { enum: ['Female', 'Male'], description: 'Used for token art and generic names.' },
            folderId: { type: 'string', description: 'Actor folder ID. Omit to use the Eldore world default.' },
        },
        required: ['race', 'job', 'cr'],
        additionalProperties: false,
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false },
};

function patchBackend(source) {
    if (source.includes('case "eldore_generate_npc":') && source.includes('"name":"eldore_generate_npc"'))
        return source;
    const changes = [
        ['  const allTools = [', '  const allTools = [\n    ' + JSON.stringify(tool) + ','],
        ['              switch (name) {\n                case "get-character":',
            '              switch (name) {\n' +
            '                case "eldore_generate_npc":\n' +
            '                  result = await foundryClient.query("npc-generator-dnd5e-eldore.generateNPC", args ?? {});\n' +
            '                  break;\n' +
            '                case "get-character":'],
    ];
    let patched = source.replace(/\r\n/g, '\n');
    for (const [before, after] of changes) {
        if (patched.split(before).length !== 2)
            throw new Error('Unsupported Foundry MCP backend layout. The installed file was not changed.');
        patched = patched.replace(before, after);
    }
    return patched;
}

if (require.main === module) {
    const [folder, option] = process.argv.slice(2);
    if (!folder || (option && option !== '--check'))
        throw new Error('Usage: node tools/install-eldore-mcp.cjs <mcp-server folder> [--check]');
    const pkg = JSON.parse(fs.readFileSync(path.join(folder, 'package.json'), 'utf8'));
    if (pkg.name !== '@foundry-mcp/server' || pkg.version !== '0.8.3')
        throw new Error('This installer supports Foundry MCP Server 0.8.3.');
    const backend = path.join(folder, 'dist', 'backend.bundle.cjs');
    const original = fs.readFileSync(backend, 'utf8');
    const patched = patchBackend(original);
    if (patched === original) {
        console.log('Eldore tool already installed.');
    } else if (option === '--check') {
        console.log('Foundry MCP backend is compatible with the Eldore installer.');
    } else {
        const temporary = backend + '.' + process.pid + '.cjs';
        try {
            fs.writeFileSync(temporary, patched, { flag: 'wx' });
            execFileSync(process.execPath, ['--check', temporary]);
            fs.copyFileSync(backend, backend + '.eldore-original', fs.constants.COPYFILE_EXCL);
            fs.renameSync(temporary, backend);
            console.log('Installed eldore_generate_npc. Restart Claude Desktop so it reloads Foundry MCP.');
        } finally {
            fs.rmSync(temporary, { force: true });
        }
    }
}

module.exports = { patchBackend };
