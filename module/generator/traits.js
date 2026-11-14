import { sumArray } from '../utils.js';
export const traitsDraft = {
    Aggressive: (traits) => (traits.dpr_bonus_melee_round += 2),
    Archery: (traits) => (traits.global_atk_bonus_weapon_ranged += 2),
    "Archer's Eye": (traits, _draft, item) => (traits.dpr_bonus_ranged_round += item.flags.npcgen.die / 2 + 0.5),
    Assassinate: (traits) => (traits.atk_bonus_weapon += 2),
    Attacker: (traits) => (traits.global_atk_bonus += 2),
    'Battle Readiness': (traits) => traits.atk_bonus++,
    'Berserker Battleaxe': (traits) => traits.max_hp_con_bonus++,
    'Berserker Greataxe': (traits) => traits.max_hp_con_bonus++,
    Brute: (traits) => traits.extra_dice_melee++,
    'Brutal Critical': (traits, _draft, item) => (traits.atk_bonus_weapon += item.flags.npcgen.dice / 2),
    'Cunning Action': (traits) => (traits.ac_bonus += 2),
    Evasion: (traits) => (traits.ac_bonus += 0.5),
    'Improved Critical': (traits) => traits.atk_bonus_weapon++,
    Indomitable: (traits, draft, item) => (traits.hp_bonus += 5 * +item.system.uses.max * ((draft.cr + 5) / 6)),
    'Legendary Resistance': (traits, draft, item) => (traits.hp_bonus += 10 * +item.system.uses.max * ((draft.cr + 5) / 6)),
    Lightfooted: (traits) => traits.ac_bonus++, // Check again later if 1 is too much
    'Magic Resistance': (traits) => (traits.ac_bonus += 2),
    'Martial Advantage': (traits, _draft, item) => (traits.dpr_bonus_attack_round += 3.2 * item.flags.npcgen.dices), // A little less than sneak attack, because advantages dont trigger it
    'Nimble Escape': (traits) => (traits.ac_bonus += 2),
    Parry: (traits) => traits.ac_bonus++,
    Protection: (traits) => traits.ac_bonus++,
    'Reckless Attack': (traits) => {
        traits.ac_bonus -= 3.6;
        traits.atk_bonus_weapon -= 3.6;
    },
    'Relentless Endurance': (traits, draft) => (traits.hp_bonus += 7 * ((draft.cr + 5) / 6)),
    'Savage Attacks': (traits) => (traits.atk_bonus_weapon += 0.5),
    'Sculpt Spells': (traits) => (traits.spell_evo_area_bonus += 1),
    'Second Wind': (traits) => {
        traits.hp_bonus += 5.5;
    },
    Shield: (traits, _draft, item) => {
        if (item.type !== 'spell')
            return;
        let uses = 0;
        if (item.system.method === 'innate')
            uses = item.system.uses.max;
        else
            uses = sumArray(traits.spell_slots);
        traits.ac_bonus += (5 / 3) * Math.min(3, uses, traits.actions.reaction);
    },
    'Shield of Faith': (traits, _draft, item) => {
        if (item.type !== 'spell')
            return;
        let uses = 0;
        if (item.system.method === 'innate')
            uses = item.system.uses.max;
        else
            uses = sumArray(traits.spell_slots);
        traits.ac_bonus += (2 / 3) * Math.min(1.5, uses, traits.actions.bonus) * 2;
    },
    'Spell Resistance': (traits) => (traits.ac_bonus += 2),
    'Sneak Attack': (traits, draft, item) => (traits.dpr_bonus_attack_round += 3.5 * item.flags.npcgen.dice),
    'Surprise Attack': (traits) => (traits.dpr_bonus_attack_round += 2),
    Survivor: (traits, draft, item) => (traits.hp_bonus += 1.5 * item.flags.npcgen.regen),
    Taunt: (traits, draft) => (traits.ac_bonus += (2 / 3) * (1 + 0.1 * (draft.mod('cha') + draft.prof - 3))),
    'Uncanny Dodge': (traits) => (traits.ac_bonus += 2),
    Vanish: (traits) => traits.ac_bonus++,
};
