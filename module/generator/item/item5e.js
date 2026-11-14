export var SpellPreparation;
(function (SpellPreparation) {
    SpellPreparation[SpellPreparation["false"] = 0] = "false";
    SpellPreparation[SpellPreparation["true"] = 1] = "true";
    SpellPreparation[SpellPreparation["always"] = 2] = "always";
})(SpellPreparation || (SpellPreparation = {}));
export function updateDescription(item, data) {
    let desc = item.system.description.value;
    if (desc) {
        for (const [key, value] of Object.entries(data))
            desc = desc.replace(new RegExp(`{{ *${key} *}}`, 'g'), value);
        item.system.description.value = desc;
    }
    return item;
}
export function getActivity(item, type) {
    if (!type)
        return item.system.activities?.dnd5eactivity000 ?? Object.values(item.system.activities ?? {})[0];
    return Object.values(item.system.activities ?? {}).find((act) => act.type === type);
}
export function getActivities(item, type) {
    if (!type)
        return Object.values(item.system.activities ?? {});
    return Object.values(item.system.activities ?? {}).filter((act) => act.type === type);
}
export function getActionType(item) {
    const atk = getActivity(item, 'attack');
    if (!atk)
        return '';
    if (atk.attack.type.classification === 'spell')
        return atk.attack.type.value === 'melee' ? 'msak' : 'rsak';
    return atk.attack.type.value === 'melee' ? 'mwak' : 'rwak';
}
function evaluateDamageValue(activity, item) {
    if (!activity)
        return 0;
    let baseBonus = 0;
    if (activity.includeBase && 'damage' in item.system) {
        const dmg = item.system.damage.base;
        baseBonus = (dmg?.number ?? 0) * (dmg?.denomination ?? 0);
    }
    return baseBonus + activity.parts.reduce((total, part) => total + (part.number ?? 0) * (part.denomination ?? 0), 0);
}
function damageToString(part, weaponBase = false, magicalBonus = 0) {
    if (!part)
        return;
    const dice = part.number > 0 && part.denomination > 0 ? `${part.number}d${part.denomination}` : '';
    const formula = part.custom?.enabled ? part.custom.formula : [dice, part.bonus].filter(Boolean).join(' + ');
    if (!formula)
        return;
    const terms = [formula];
    if (weaponBase && !/@mod\b/.test(formula))
        terms.push('@mod');
    if (weaponBase && magicalBonus)
        terms.push(magicalBonus);
    return [terms.join(' + '), part.types?.[0]];
}
export function getAttackDamage(item) {
    const atk = getActivities(item, 'attack');
    if (!atk.length)
        return {
            parts: [],
            versatile: undefined,
        };
    const bestAtk = atk.reduce((best, atk) => evaluateDamageValue(atk.damage, item) > evaluateDamageValue(best.damage, item) ? atk : best);
    const damage = {
        parts: bestAtk.damage?.parts.map((part) => damageToString(part)).filter(Boolean) ?? [],
        versatile: undefined,
    };
    if (bestAtk.damage?.includeBase && 'damage' in item.system) {
        const base = damageToString(item.system.damage.base, true, item.system.magicalBonus);
        if (base) {
            damage.parts.unshift(base);
            if (item.system.properties?.includes('ver'))
                damage.versatile = damageToString(item.system.damage.versatile, true, item.system.magicalBonus)?.[0];
        }
    }
    return damage;
}
export function getSaveDamage(item) {
    const save = getActivity(item, 'save');
    if (!save || !('damage' in save))
        return;
    return {
        save,
        damage: save.damage.parts.map((part) => damageToString(part)).filter(Boolean),
    };
}
export function isClassSpellcasting(item) {
    return item.system.method === 'spell' || item.system.method === 'pact';
}
