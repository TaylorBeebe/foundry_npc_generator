export function setActiveEffects(effects, activate = true) {
    effects.forEach((effect) => (effect.disabled = !activate));
}
