import { jobs } from './generator/jobs.js';
import { races } from './generator/races.js';
import { app } from './menu.js';
const raceLookup = (race) => {
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
export default function contextMenu(_html, entryOptions) {
    entryOptions.push({
        name: 'Build NPC',
        icon: '<i class="fas fa-users-cog"></i>',
        callback: (li) => {
            const actor = game.actors.get(li.dataset.documentId ?? '');
            const data = foundry.utils.mergeObject({}, app._defaultObject);
            const race_name = raceLookup(actor.name);
            const name = race_name ? [''] : actor.name.split(' ');
            const job = actor.flags.npcgen?.job in jobs ? jobs[actor.flags.npcgen.job] : jobs.berserker;
            const race = raceLookup(actor.flags.npcgen?.race) ||
                raceLookup(actor.system.details.race) ||
                raceLookup(actor.name) ||
                raceLookup(actor.system.details.type.subtype) ||
                raceLookup(actor.system.details.type.value);
            data.name1 = actor.flags.npcgen?.name1 ?? name[0] ?? '';
            data.name2 = actor.flags.npcgen?.name2 ?? name.slice(1).join(' ');
            data.name3 = actor.flags.npcgen?.name3;
            data.race = race ?? races.human;
            data.job = job;
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
        },
    });
}
