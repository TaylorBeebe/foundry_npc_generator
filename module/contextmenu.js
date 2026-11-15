const raceLookup = (race, races) => {
    race = race?.toLowerCase();
    if (race in races)
        return races[race];
};
const conversion = {
    0.125: '1/8',
    0.25: '1/4',
    0.5: '1/2',
};
const convertCR = (cr) => {
    if (cr >= 1 || cr === 0)
        return ('' + cr);
    return conversion[cr];
};
async function buildNPC(li) {
    const { entryId, documentId } = (li?.dataset ?? li?.[0]?.dataset) ?? {};
    const id = entryId || documentId;
    const actor = id && game.actors.get(id);
    if (!actor)
        return;
    const [{ jobs, references: jobOptions }, { races, references: raceOptions }, { app }] = await Promise.all([
        import('./generator/jobs.js'), import('./generator/races.js'), import('./menu.js'),
    ]);
    const data = foundry.utils.mergeObject({}, app._defaultObject);
    const race_name = raceLookup(actor.name, races);
    const name = race_name ? [''] : actor.name.split(' ');
    const job = actor.flags.npcgen?.job in jobs ? jobs[actor.flags.npcgen.job] : jobs.berserker;
    const race = raceLookup(actor.flags.npcgen?.race, races) ||
        raceLookup(actor.system.details.race, races) ||
        raceLookup(actor.name, races) ||
        raceLookup(actor.system.details.type.subtype, races) ||
        raceLookup(actor.system.details.type.value, races);
    data.name1 = actor.flags.npcgen?.name1 ?? name[0] ?? '';
    data.name2 = actor.flags.npcgen?.name2 ?? name.slice(1).join(' ');
    data.name3 = actor.flags.npcgen?.name3;
    data.race = race ?? races.human;
    data.job = job;
    data.selection = {
        ...data.selection,
        races: Object.keys(raceOptions).find((key) => raceOptions[key] === data.race) ?? 0,
        jobs: Object.keys(jobOptions).find((key) => jobOptions[key] === data.job) ?? 0,
    };
    data.seed = actor.flags.npcgen?.seed ?? '';
    data.cr = convertCR(actor.system.details.cr);
    data.portrait = actor.img ?? '';
    data.token = actor.prototypeToken.texture.src ?? '';
    data.alignment = actor.system.details.alignment ?? '';
    if (actor.flags.npcgen?.biography)
        data.biography = foundry.utils.mergeObject(data.biography, actor.flags.npcgen.biography);
    if (data.name1)
        data.locks.name1 = true;
    if (data.name2)
        data.locks.name2 = true;
    if (data.name3)
        data.locks.name3 = true;
    if (race)
        data.locks.races = true;
    if (job)
        data.locks.jobs = true;
    if (data.portrait)
        data.locks.portrait = true;
    if (Object.values(data.biography.physical).join())
        data.locks.physical = true;
    if (data.biography.clothing.length)
        data.locks.clothing = true;
    if (data.biography.personality.length || data.biography.flaws.length)
        data.locks.personality = true;
    if (data.biography.ideals.length)
        data.locks.ideals = true;
    if (data.biography.bonds.length)
        data.locks.bonds = true;
    if (data.biography.plot.length)
        data.locks.plot = true;
    if (actor.folder)
        data.folder = actor.folder.id;
    app.object = data;
    app.render(true);
}

export default function contextMenu(_application, entryOptions) {
    if (!game.user?.hasPermission('ACTOR_CREATE'))
        return;
    const label = 'Build NPC';
    if (entryOptions.some((entry) => (entry.label ?? entry.name) === label))
        return;
    const icon = '<i class="fas fa-users-cog"></i>';
    if (game.release.generation >= 14)
        entryOptions.push({ label, icon, onClick: (_event, target) => buildNPC(target) });
    else
        entryOptions.push({ name: label, icon, callback: buildNPC });
}
