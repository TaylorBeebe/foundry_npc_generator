import { getItemName } from '../../utils.js';
export async function applyCommonerWeapon(draft) {
    const weapons = ['Unarmed Strike', 'Club', 'Dagger', 'Sickle', 'Light Hammer'];
    const weapon = await draft.weapon(draft.pickFavoredWeapon(weapons));
    if (weapon && getItemName(weapon) === 'Unarmed Strike')
        replaceUnarmedStrikeDescription(weapon);
    return weapon;
}
export function applyCommonerRangedWeapon(draft) {
    const weapons = ['Sling', 'Dart'];
    return draft.weapon(draft.pickFavoredWeapon(weapons));
}
export function replaceUnarmedStrikeDescription(weapon) {
    weapon.system.description.value = weapon.system.description.value.replace('{{name}} attacks with its .', '{{name}} attacks with an unarmed strike.');
}

function civilian(name, skills, apply, tags = []) {
    return {
        name, tags: ['civilian', ...tags],
        async apply(draft) {
            for (const skill of skills)
                draft.skill(skill);
            await apply(draft);
        },
    };
}
export const commoner = civilian('commoner', [], applyCommonerWeapon);
export const labourer = civilian('labourer', ['ath'], (draft) => draft.weapon('Greatclub'));
export const merchant = civilian('merchant', ['ins', 'per'], (draft) => draft.weapon('Dagger'));
export const guard = civilian('guard', ['prc'], async (draft) => {
    await draft.armor('Leather Armor');
    await draft.item('Shield');
    await draft.weapon('Spear');
    await applyCommonerRangedWeapon(draft);
}, ['martial']);
