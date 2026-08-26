/**
 * The web app pairs a display serif (Fraunces) with Inter for body text and
 * IBM Plex Mono for small uppercase labels/tags (see frontend/app/layout.tsx
 * and the font-display / font-mono utility usage across components/home/*).
 * We load the same three families with expo-font so headings, buttons and
 * "pinned note" labels keep the same editorial-ledger feel on mobile.
 */
import {
  useFonts as useFraunces,
  Fraunces_500Medium,
  Fraunces_600SemiBold,
} from '@expo-google-fonts/fraunces';
import {
  useFonts as useInter,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from '@expo-google-fonts/inter';
import {
  useFonts as usePlexMono,
  IBMPlexMono_500Medium,
} from '@expo-google-fonts/ibm-plex-mono';

export const fontFamilies = {
  display: 'Fraunces_500Medium',
  displayStrong: 'Fraunces_600SemiBold',
  sans: 'Inter_400Regular',
  sansMedium: 'Inter_500Medium',
  sansSemiBold: 'Inter_600SemiBold',
  mono: 'IBMPlexMono_500Medium',
};

/** Call once near the app root; returns false until fonts are ready. */
export function useAppFonts(): boolean {
  const [a] = useFraunces({ Fraunces_500Medium, Fraunces_600SemiBold });
  const [b] = useInter({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold });
  const [c] = usePlexMono({ IBMPlexMono_500Medium });
  return a && b && c;
}

export const type = {
  display: { fontFamily: fontFamilies.display, fontSize: 28, lineHeight: 34 },
  displaySm: { fontFamily: fontFamilies.display, fontSize: 20, lineHeight: 26 },
  label: {
    fontFamily: fontFamilies.mono,
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: 'uppercase' as const,
  },
  body: { fontFamily: fontFamilies.sans, fontSize: 15, lineHeight: 22 },
  bodyMedium: { fontFamily: fontFamilies.sansMedium, fontSize: 15, lineHeight: 22 },
  caption: { fontFamily: fontFamilies.sans, fontSize: 12, lineHeight: 16 },
};
