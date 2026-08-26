import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../components/ui/Screen';
import { useAppTheme } from '../../theme/ThemeContext';
import { fontFamilies } from '../../theme/typography';

// Adapted from frontend/app/about/page.tsx (also mirrored at
// app/(site)/about/page.tsx — identical route group duplicate in the
// source repo). Same eyebrow, heading, values and timeline copy; laid out
// as a single mobile scroll instead of three full-bleed desktop sections.
const VALUES = [
  {
    code: 'V-01',
    title: "One register, not six spreadsheets",
    body: "Every society we work with started with a maintenance sheet, a WhatsApp group and a notice pinned in the lobby. We built the single place all three point to.",
  },
  {
    code: 'V-02',
    title: "Committees change, records shouldn't vanish",
    body: 'Managing committees rotate every year. The ledger, the notices and the member history stay put regardless of who\u2019s holding the keys.',
  },
  {
    code: 'V-03',
    title: 'Every society keeps its own book',
    body: 'Data for one society is never visible to another, even though they share the same system. Access is scoped the moment you sign in.',
  },
];

const TIMELINE = [
  { year: '2021', label: 'Started with one RWA in Pune keeping accounts on paper.' },
  { year: '2023', label: 'Crossed 40 societies onto a shared, secure console.' },
  { year: '2026', label: 'Serving societies across Pune, Bengaluru and Gurugram.' },
];

export function AboutScreen() {
  const { theme } = useAppTheme();

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={[styles.hero, { backgroundColor: theme.mode === 'dark' ? theme.background : '#1C2B39' }]}>
          <Text style={[styles.label, { color: '#D9A85C' }]}>About SocietyLedger</Text>
          <Text style={styles.heroTitle}>
            Built by people who once ran a society WhatsApp group at 11pm.
          </Text>
          <Text style={styles.heroBody}>
            We started SocietyLedger after watching a committee treasurer reconcile a
            year of maintenance dues from three different notebooks. There had to be a
            better register.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: theme.primaryDark }]}>What we believe</Text>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Three things every society deserves from its software
          </Text>
          <View style={{ gap: 12, marginTop: 20 }}>
            {VALUES.map((v) => (
              <View key={v.code} style={[styles.valueCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Text style={[styles.label, { color: theme.primaryDark }]}>{v.code}</Text>
                <Text style={[styles.valueTitle, { color: theme.text }]}>{v.title}</Text>
                <Text style={[styles.valueBody, { color: theme.textMuted }]}>{v.body}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={[styles.timelineWrap, { backgroundColor: theme.mode === 'dark' ? theme.surfaceDim : '#1C2B39' }]}>
          <Text style={[styles.label, { color: '#D9A85C' }]}>
            How we got here
          </Text>
          <Text style={[styles.sectionTitle, { color: '#FBF7EF' }]}>A short, honest timeline</Text>
          <View style={{ marginTop: 20, gap: 18 }}>
            {TIMELINE.map((item) => (
              <View key={item.year} style={styles.timelineRow}>
                <Text style={styles.timelineYear}>{item.year}</Text>
                <Text style={styles.timelineLabel}>{item.label}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { paddingHorizontal: 24, paddingTop: 32, paddingBottom: 36, gap: 14 },
  label: { fontFamily: fontFamilies.mono, fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase' },
  heroTitle: { fontFamily: fontFamilies.display, fontSize: 26, lineHeight: 32, color: '#FBF7EF' },
  heroBody: { fontFamily: fontFamilies.sans, fontSize: 14, lineHeight: 21, color: 'rgba(251,247,239,0.7)' },
  section: { paddingHorizontal: 20, paddingTop: 32 },
  sectionTitle: { fontFamily: fontFamilies.display, fontSize: 20, marginTop: 6 },
  valueCard: { borderWidth: 1, borderRadius: 12, padding: 16, gap: 4 },
  valueTitle: { fontFamily: fontFamilies.display, fontSize: 16 },
  valueBody: { fontFamily: fontFamilies.sans, fontSize: 13, lineHeight: 19 },
  timelineWrap: { marginTop: 36, paddingHorizontal: 20, paddingVertical: 32 },
  timelineRow: { gap: 4 },
  timelineYear: { fontFamily: fontFamilies.display, fontSize: 20, color: '#D9A85C' },
  timelineLabel: { fontFamily: fontFamilies.sans, fontSize: 13, color: 'rgba(251,247,239,0.7)' },
});
