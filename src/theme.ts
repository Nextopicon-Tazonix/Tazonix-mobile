// Tazonix brand tokens (implementation.md §4). Dark-first.
export const colors = {
  blue: '#007BFF',
  purple: '#8A2BE2',
  magenta: '#FF2D88',
  amber: '#FF9500',
  navy: '#0A0F2C',
  grey: '#F4F6FA',

  bg: '#0A0F2C',
  surface: '#131A3D',
  surfaceAlt: '#1B2350',
  border: '#2A3366',
  text: '#FFFFFF',
  textMuted: '#A9B1D6',
  textFaint: '#6E77A8',
  success: '#2ECC71',
  danger: '#FF4D5E',
  warning: '#FF9500',
} as const;

export const gradient = {
  brand: [colors.blue, colors.purple, colors.magenta, colors.amber] as const,
  cool: [colors.blue, colors.purple] as const,
  warm: [colors.magenta, colors.amber] as const,
};

export const fonts = {
  regular: 'Montserrat_400Regular',
  medium: 'Montserrat_500Medium',
  semibold: 'Montserrat_600SemiBold',
  bold: 'Montserrat_700Bold',
  extrabold: 'Montserrat_800ExtraBold',
} as const;

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const radius = { sm: 8, md: 12, lg: 16, xl: 24, pill: 999 } as const;
