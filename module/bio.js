import { DB } from './names.js';
import { between, normalRandomAdjusted, pick, pick_weights, seeder } from './utils.js';
const AGE_CATEGORIES = ['young', 'adult', 'middle age', 'old', 'venerable', 'supernaturally old'];
const WEIGHT_CATEGORIES = ['underweight', 'fit', 'fat', 'obese'];
const HEIGHT_CATEGORIES = ['short', 'average-height', 'tall', 'giant'];
const TABLES = {};
async function parseDraw(text, tags, drawMap = new Set()) {
    let matches = [];
    let arrMatches = null;
    const pattern = /\[([^\]]*)]/g;
    while ((arrMatches = pattern.exec(text))) {
        var command = arrMatches[1];
        matches.push([`[${command}]`, await draw(command, tags, drawMap)]);
    }
    for (const match of matches) {
        text = text.replace(match[0], match[1]);
    }
    return text;
}
async function draw(table, tags, drawMap = new Set()) {
    const tables = table.split('|');
    if (tables.length > 1)
        table = pick(tables);
    const notTable = /'(.*)'/.exec(table);
    if (notTable)
        return notTable[1];
    let db = TABLES[table];
    if (!db) {
        db = TABLES[table] = new DB('tables/' + table.replaceAll('.', '/'));
        await db.load();
    }
    const weights = db.data.map(([text, weight]) => (weight ? +weight : 1));
    while (true) {
        const pick = pick_weights(db.data, weights);
        const [text, weight, condition, exclusion, addition] = pick;
        if (condition && !condition.split(',').some((el) => tags.has(el)))
            continue;
        if (exclusion && exclusion.split(',').some((el) => tags.has(el)))
            continue;
        const id = table + db.data.indexOf(pick);
        if (drawMap.has(id))
            continue;
        drawMap.add(id);
        if (addition)
            addition.split(',').forEach((tag) => tags.add(tag));
        return (await parseDraw(text, tags, drawMap))
            .replaceAll(/( |^)a (?=[aeiou])/g, '$1an ')
            .replaceAll(/he\/she/gi, (match) => {
            if (match[0] === 'h')
                return tags.pronoun.nominal;
            else
                return tags.pronoun.nominal.titleCase();
        })
            .replaceAll(/him\/her/gi, (match) => {
            if (match[0] === 'h')
                return tags.pronoun.possessive1;
            else
                return tags.pronoun.possessive1.titleCase();
        })
            .replaceAll(/his\/her/gi, (match) => {
            if (match[0] === 'h')
                return tags.pronoun.possessive2;
            else
                return tags.pronoun.possessive2.titleCase();
        });
    }
}
function categorize(value, range, category) {
    const step = range / (category.length - 1);
    return category[Math.clamp(~~(value / step), 0, category.length)];
}
export function gen_physical(race, job, cr, tags) {
    const AGE_BIAS_STRENGHT = 0.7;
    const TRAITS = {
        age_job_bias: 0,
        age_multiplier: 1,
        height_multiplier: 1,
        age: {
            min: 16,
            max: 80,
            bias: -3,
        },
        hair: ['Black', 'Blonde', 'Light brown', 'Dark brown', 'Gray', 'Red', 'Bald'],
        //hair_styles: ['straight', 'curly', 'kinky'],
        skin: ['Pale', 'Fair', 'Tanned', 'Medium', 'Light brown', 'Dark brown'],
        eyes: ['Blue', 'Brown', 'Gray', 'Green', 'Hazel'],
        sex: ['Female', 'Male'],
        height: {
            average: 5.6,
            deviation: 0.3,
            minimum: 2,
        },
        weight: {
            average: 120,
            deviation: 3,
            minimum: 20,
        },
    };
    foundry.utils.mergeObject(TRAITS, { ...race.bio, ...job.bio });
    const age_bias = TRAITS.age.bias + TRAITS.age_job_bias + ~~(cr / 6);
    const age_modifier = TRAITS.age_multiplier;
    const ageValue = ~~(age_modifier *
        (seeder.rnd() ** (AGE_BIAS_STRENGHT ** age_bias) * (TRAITS.age.max - TRAITS.age.min) + TRAITS.age.min));
    const ageCategory = categorize(ageValue - TRAITS.age.min, TRAITS.age.max - TRAITS.age.min, AGE_CATEGORIES);
    const age = `${ageValue} (${ageCategory})`;
    const hair = pick(TRAITS.hair);
    const skin = pick(TRAITS.skin);
    const eyes = pick(TRAITS.eyes);
    const sex = pick(TRAITS.sex);
    if (sex === 'Female') {
        TRAITS.height.average *= 0.93;
        TRAITS.height.deviation *= 0.93;
    }
    const heightValue = normalRandomAdjusted((TRAITS.height.average - TRAITS.height.minimum) * TRAITS.height_multiplier, TRAITS.height.deviation) + TRAITS.height.minimum;
    const weightModifier = (heightValue / TRAITS.height.average) ** 2;
    const weightValue = ~~((normalRandomAdjusted(TRAITS.weight.average - TRAITS.weight.minimum, TRAITS.weight.deviation) + TRAITS.weight.minimum) *
        weightModifier);
    const height = `${~~heightValue}'${~~((heightValue % 1) * 12)}" (${(heightValue * 0.3).toFixed(2)} m)`;
    const weight = `${weightValue} (${(weightValue * 0.5).toFixed(2)} kg)`;
    const heightCategory = categorize(heightValue - 4, 3, HEIGHT_CATEGORIES);
    const weightCategory = categorize(weightValue - (TRAITS.weight.average - TRAITS.weight.deviation * 20), TRAITS.weight.deviation * 40, WEIGHT_CATEGORIES);
    tags.add(ageCategory);
    tags.add(heightCategory);
    tags.add(weightCategory);
    tags.add(sex.toLowerCase());
    return {
        age,
        hair,
        skin,
        eyes,
        sex,
        height,
        weight,
    };
}
export async function gen_table(table, min, max, tags) {
    const drawMap = new Set();
    const traits = new Array(between(min, max));
    for (let i = 0; i < traits.length; i++)
        traits[i] = await draw(`${table}.base`, tags, drawMap);
    return traits;
}
// Debug - DELETE LATER
//@ts-ignore
window.gen_table = gen_table;
//@ts-ignore
window.draw = draw;
//@ts-ignore
window.TABLES = TABLES;
