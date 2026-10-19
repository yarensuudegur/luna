// Yazı tipi dosyaları projede (assets/fonts) tutulur: node_modules yolundan gelirse
// GitHub Pages yayınında (gh-pages) bu klasör atlanır ve webde yazı tipleri yüklenmez.
export const fontAssets = {
  BodoniModa_400Regular: require('../../assets/fonts/BodoniModa_400Regular.ttf'),
  BodoniModa_500Medium: require('../../assets/fonts/BodoniModa_500Medium.ttf'),
  BodoniModa_400Regular_Italic: require('../../assets/fonts/BodoniModa_400Regular_Italic.ttf'),
  SpaceMono_400Regular: require('../../assets/fonts/SpaceMono_400Regular.ttf'),
  SpaceMono_700Bold: require('../../assets/fonts/SpaceMono_700Bold.ttf'),
};

export const fonts = {
  serif: 'BodoniModa_400Regular',
  serifMedium: 'BodoniModa_500Medium',
  serifItalic: 'BodoniModa_400Regular_Italic',
  mono: 'SpaceMono_400Regular',
  monoBold: 'SpaceMono_700Bold',
  // Metin için sistem sans-serif'i kullanılır: Text'e fontFamily verilmez.
} as const;
