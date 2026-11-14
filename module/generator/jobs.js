import { commoner, labourer, merchant, guard } from './jobs/commoner.js';
import { recursive_menu } from '../utils.js';
import { abjurer } from './jobs/abjurer.js';
import { assassin } from './jobs/assassin.js';
import { archer } from './jobs/archer.js';
import { bard } from './jobs/bard.js';
import { berserker } from './jobs/berserker.js';
import { druid } from './jobs/druid.js';
import { evoker } from './jobs/evoker.js';
import { fighter } from './jobs/fighter.js';
import { monk } from './jobs/monk.js';
import { noble } from './jobs/noble.js';
import { paladin } from './jobs/paladin.js';
import { priest } from './jobs/priest.js';
import { ranger } from './jobs/ranger.js';
import { sorcerer } from './jobs/sorcerer.js';
import { swashbuckler } from './jobs/swashbuckler.js';
import { thief } from './jobs/thief.js';
import { warcleric } from './jobs/warcleric.js';
import { warlock } from './jobs/warlock.js';
import { warrior } from './jobs/warrior.js';
export function jobsWithTag(tag) {
    const names = [];
    for (const job of Object.values(jobs)) {
        if (job.tags?.includes(tag))
            names.push(job.name);
    }
    return names;
}
const jobs = {
    abjurer,
    archer,
    assassin,
    bard,
    berserker,
    druid,
    evoker,
    fighter,
    monk,
    noble,
    paladin,
    priest,
    ranger,
    sorcerer,
    swashbuckler,
    thief,
    warcleric,
    warlock,
    warrior,
    commoner,
    labourer,
    merchant,
    guard,
};
const menu = {
    All: {
        Civilian: { Commoner: commoner, Labourer: labourer, Merchant: merchant, Guard: guard },
        Martial: {
            Archer: archer,
            Berserker: berserker,
            Fighter: fighter,
            Paladin: paladin,
            Ranger: ranger,
            Warrior: warrior,
        },
        Specialist: {
            Assassin: assassin,
            Monk: monk,
            Noble: noble,
            Swashbuckler: swashbuckler,
            Thief: thief,
        },
        //},
        Spellcaster: {
            Bard: bard,
            //Druid: druid,
            Arcanist: {
                Abjurer: abjurer,
                //Enchanter: enchanter,
                Evoker: evoker,
                //Illusionist: illusionist,
                //Transmuter: transmuter,
                //Summoner: summoner,
                //Necromancer: necromancer,
            },
            Druid: druid,
            Pious: {
                Warcleric: warcleric,
                Priest: priest,
                //Cleric: cleric,
                //Cultist: cultist,
            },
            Sorcerer: sorcerer,
            Warlock: warlock,
        },
    },
};
const [index, references] = recursive_menu(menu);
export { menu, index, references, jobs };
