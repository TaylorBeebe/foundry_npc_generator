import { logger, searchPacks } from './module/utils.js';
import contextMenu from './module/contextmenu.js';
logger.log('Initializing...');

// The Actors sidebar collects menu entries on its first render, before ready.
Hooks.on('getActorContextOptions', contextMenu);
Hooks.on('getActorDirectoryEntryContext', contextMenu);

async function ready() {
    logger.log('Firing "ready" hook...');
    if (!game.user.hasPermission('ACTOR_CREATE')) {
        logger.log('User dont have permission to create actors.');
        logger.log('Terminated.');
        return;
    }
    // Loads the compatibility layer for Babele only in case the language is not English
    if (typeof Babele !== 'undefined' && game.i18n.lang !== 'en') {
        logger.log('Babele detected. Loading compatibility layer...');
        import('./compatibility/babele.js');
    }
    const { NPCDraft } = await import('./module/generator/npcdraft.js');
    const { app } = await import('./module/menu.js');
    const { registerSettings, getDefaultFolder, migratePortraitDirectory } = await import('./module/settings.js');
    import('./module/report.js');
    searchPacks();
    registerSettings();
    migratePortraitDirectory();
    window.npcGen = {
        app,
        create: NPCDraft.create,
    };
    const { registerMcpQuery } = await import('./module/mcp.js');
    registerMcpQuery();
    Hooks.on('renderActorDirectory', (_app, html) => {
        const btn = jQuery(`<button class="generate-npc-btn" type="button"><i class="fas fa-users-cog"></i> Generate NPC</button>`);
        html.querySelector('.generate-npc-btn')?.remove();
        html.querySelector('.header-actions')?.append(btn[0]);
        btn.on('click', (ev) => {
            ev.preventDefault();
            app._defaultObject.folder = getDefaultFolder();
            app.object = foundry.utils.mergeObject({}, app._defaultObject);
            app.render(true);
        });
    });
    Hooks.on('renderNPCGenerator', app._renderNPCGenerator);
    ui.actors.render(true);
    logger.log('Initialized.');
}
// -------------------------------------------- //
Hooks.once('ready', ready);
