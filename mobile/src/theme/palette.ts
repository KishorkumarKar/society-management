/**
 * Colors lifted directly from the web app's tailwind.config.ts so the
 * mobile app reads as the same product, not a re-skin.
 * (frontend/tailwind.config.ts: ink / paper / brass / sage / rust / muted)
 */
export const brand = {
  ink: '#1C2B39',
  inkDark: '#131E28',
  inkLight: '#28384A',
  paper: '#FBF7EF',
  paperDim: '#F1EADA',
  brass: '#B8863B',
  brassLight: '#D9A85C',
  brassDark: '#8C6529',
  sage: '#5F7161',
  sageLight: '#7C8F6E',
  rust: '#A24936',
  muted: '#7C8894',
};

export interface AppTheme {
  mode: 'light' | 'dark';
  background: string;
  surface: string;
  surfaceDim: string;
  text: string;
  textMuted: string;
  border: string;
  primary: string;
  primaryDark: string;
  onPrimary: string;
  accent: string;
  danger: string;
  tabBar: string;
}

export const lightTheme: AppTheme = {
  mode: 'light',
  background: brand.paper,
  surface: '#FFFFFF',
  surfaceDim: brand.paperDim,
  text: brand.ink,
  textMuted: brand.muted,
  border: 'rgba(28,43,57,0.12)',
  primary: brand.brass,
  primaryDark: brand.brassDark,
  onPrimary: brand.ink,
  accent: brand.sage,
  danger: brand.rust,
  tabBar: '#FFFFFF',
};

export const darkTheme: AppTheme = {
  mode: 'dark',
  background: brand.ink,
  surface: brand.inkLight,
  surfaceDim: brand.inkDark,
  text: brand.paper,
  textMuted: 'rgba(251,247,239,0.6)',
  border: 'rgba(251,247,239,0.12)',
  primary: brand.brassLight,
  primaryDark: brand.brass,
  onPrimary: brand.inkDark,
  accent: brand.sageLight,
  danger: '#C97157',
  tabBar: brand.inkDark,
};
