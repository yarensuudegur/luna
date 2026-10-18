import {
  BodoniModa_400Regular,
  BodoniModa_500Medium,
  BodoniModa_400Regular_Italic,
} from '@expo-google-fonts/bodoni-moda';
import { SpaceMono_400Regular, SpaceMono_700Bold } from '@expo-google-fonts/space-mono';

export const fontAssets = {
  BodoniModa_400Regular,
  BodoniModa_500Medium,
  BodoniModa_400Regular_Italic,
  SpaceMono_400Regular,
  SpaceMono_700Bold,
};

export const fonts = {
  serif: 'BodoniModa_400Regular',
  serifMedium: 'BodoniModa_500Medium',
  serifItalic: 'BodoniModa_400Regular_Italic',
  mono: 'SpaceMono_400Regular',
  monoBold: 'SpaceMono_700Bold',
  // Metin için sistem sans-serif'i kullanılır: Text'e fontFamily verilmez.
} as const;
