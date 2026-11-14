import { MODULE } from '../module/settings.js';
//import { MODULE as module } from '../module/settings.js';
//const compatibleLanguages = ['pt-BR'];
//const lang = game.i18n.lang;
//
//if (compatibleLanguages.includes(lang)) {
//	Babele.get().register({
//		module,
//		lang,
//		dir: `lang/compendium/${lang}`,
//	});
//}
/**
 * Wraps the Compendium translations to include item descriptions.
 */
function wrapCompendiumTranslations() {
    const TranslatedCompendium = game.babele.packs.contents[0]?.constructor;
    // Replace the original translate method to include item descriptions
    const translateBabele = TranslatedCompendium.prototype.translate;
    const allowedTypes = new Set(CONFIG.Item.documentClass.TYPES);
    TranslatedCompendium.prototype.translate = function (data, translationsOnly) {
        if (data == null || data.translated) {
            return data;
        }
        if (allowedTypes.has(data.type)) {
            const description = getProperty(data, 'system.description.value');
            if (description !== undefined) {
                setProperty(data, `flags.${MODULE}.originalDescription`, description);
                if ('_source' in data)
                    setProperty(data, `_source.flags.${MODULE}.originalDescription`, description);
            }
        }
        return translateBabele.call(this, data, translationsOnly);
    };
}
Hooks.once('babele.ready', wrapCompendiumTranslations);
export {};
