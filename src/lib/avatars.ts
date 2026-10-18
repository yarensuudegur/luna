import type { ImageSourcePropType } from 'react-native';

export type AvatarKey = 'kadin' | 'david';

export const AVATARS: ReadonlyArray<{ key: AvatarKey; name: string; source: ImageSourcePropType }> = [
  { key: 'kadin', name: 'Defne', source: require('../../assets/avatars/kadin.webp') },
  { key: 'david', name: 'Davud', source: require('../../assets/avatars/david.webp') },
];

/** Profildeki `avatar` değerinden büstü bulur; boş ya da bilinmiyorsa ilki. */
export function avatarSource(key: string | null | undefined): ImageSourcePropType {
  return (AVATARS.find((a) => a.key === key) ?? AVATARS[0]).source;
}
