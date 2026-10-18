import { t } from './core';

/** Gezegen ve noktaların (iç anahtarlar Türkçe) görünen adı. */
export const planetName = (key: string): string => t(`planets.${key}`);
export const signName = (i: number): string => t(`signs.names.${i}`);
/** "Koç’ta" / "in Aries". */
export const signIn = (i: number): string => t(`signs.in.${i}`);
export const elementName = (i: number): string => t(`elements.${i}`);
export const roleName = (i: number): string => t(`roles.${i}`);
export const moonPhase = (name: string): string => t(`moon.phase.${name}`);
export const moonEvent = (name: string): string => t(`moon.event.${name}`);
export const relName = (rel: string): string => t(`rel.types.${rel}`);
export const catName = (cat: string): string => t(`cat.${cat}`);
export const moodName = (field: string): string => t(`moods.${field}`);
