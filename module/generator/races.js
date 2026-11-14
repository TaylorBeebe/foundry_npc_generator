import { recursive_menu } from '../utils.js';
import { halfOrc } from './races/half-orc.js';
import { halfElf } from './races/half-elf.js';
import { bullywug } from './races/bullywug.js';
import { dwarf } from './races/dwarf.js';
import { duergar } from './races/duergar.js';
import { human } from './races/human.js';
import { drow } from './races/drow.js';
import { elf } from './races/elf.js';
import { halfling } from './races/halfling.js';
import { gnome } from './races/gnome.js';
import { svirfneblin } from './races/svirfneblin.js';
import { orc } from './races/orc.js';
import { goblin } from './races/goblin.js';
import { hobgoblin } from './races/hobgoblin.js';
import { bugbear } from './races/bugbear.js';
import { dragonborn } from './races/dragonborn.js';
import { tiefling } from './races/tiefling.js';
export const races = {
    bullywug,
    dwarf,
    duergar,
    human,
    drow,
    elf,
    'half-elf': halfElf,
    halfling,
    gnome,
    svirfneblin,
    'half-orc': halfOrc,
    orc,
    goblin,
    hobgoblin,
    bugbear,
    dragonborn,
    tiefling,
};
export const menu = {
    All: {
        Civilized: {
            Common: {
                Dwarf: races.dwarf,
                Elf: races.elf,
                Gnome: races.gnome,
                Human: races.human,
                Halfling: races.halfling,
                'Half-elf': races['half-elf'],
                'Half-orc': races['half-orc'],
            },
            Uncommon: {
                Drow: races.drow,
                Tiefling: races.tiefling,
            },
            Rare: {
                Dragonborn: races.dragonborn,
                Hobgoblin: races.hobgoblin,
            },
        },
        Tribal: {
            Bullywug: races.bullywug,
            Goblinoids: {
                Goblin: races.goblin,
                Hobgoblin: races.hobgoblin,
                Bugbear: races.bugbear,
            },
            'Half-orc': races['half-orc'],
            Orc: races.orc,
        },
        Underdark: {
            Drow: races.drow,
            Duergar: races.duergar,
            Dwarf: races.dwarf,
            Orc: races.orc,
            Svirfneblin: races.svirfneblin,
        },
    },
};
export const [index, references] = recursive_menu(menu);
for (let i = 0; i < Object.keys(index).length; i++) {
    const el = index[i];
    const ref = references[i];
    if (ref.cr)
        index[i] = `${el} (CR ${ref.cr})`;
}
