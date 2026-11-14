Hooks.on('getActorSheet5eNPCHeaderButtons', (app, buttons) => {
    const npcgen = app.actor.flags.npcgen;
    if (npcgen) {
        const btn = {
            label: 'Report',
            class: 'npc-gen-report',
            icon: 'fas fa-user-secret',
            onclick: () => open('https://github.com/elizeuangelo/fvtt-module-npc-generator-dnd5e-faq/issues'),
        };
        buttons.unshift(btn);
    }
});
export {};
