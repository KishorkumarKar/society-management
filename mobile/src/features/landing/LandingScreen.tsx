import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '../../components/ui/Screen';
import { Button } from '../../components/ui/Button';
import { useAppTheme } from '../../theme/ThemeContext';
import { fontFamilies } from '../../theme/typography';
import { PublicStackParamList } from '../../navigation/types';

/**
 * Adapted (not copied 1:1) from frontend/components/home/{Hero,Stats,
 * Features,CTA}.tsx and frontend/app/layout.tsx's metadata. Same brand
 * name, same copy, same "pinned to a ledger" tone — restructured as a
 * single scroll of mobile-width sections instead of a 12-col desktop grid,
 * and the society-count/stat cards from Stats.tsx are dropped since that
 * data comes from the live API on desktop and isn't worth a network call
 * before a user has even logged in.
 */
const FEATURES = [
  { label: 'Noticeboard', title: 'Digital noticeboard', body: 'Announcements reach every flat the moment they\u2019re sent.' },
  { label: 'Directory', title: 'Member & unit directory', body: 'Every resident, owner and unit in one searchable roll.' },
  { label: 'Ledger', title: 'Maintenance ledger', body: 'Bills, collections and dues tracked per flat, per period.' },
  { label: 'Gate', title: 'Visitor & gate log', body: 'A record of who came and went, and when.' },
  { label: 'Tickets', title: 'Complaint ticketing', body: 'Issues raised, assigned and closed out in the open.' },
  { label: 'Admin', title: 'Multi-society console', body: 'One login, every society a managing agent runs.' },
];

type Nav = NativeStackNavigationProp<PublicStackParamList, 'Landing'>;

export function LandingScreen() {
  const navigation = useNavigation<Nav>();
  const { theme } = useAppTheme();

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Hero */}
        <View style={[styles.hero, { backgroundColor: theme.mode === 'dark' ? theme.background : '#1C2B39' }]}>
          <Text style={[styles.label, { color: '#D9A85C' }]}>Society management</Text>
          <Text style={styles.heroTitle}>SocietyLedger</Text>
          <Text style={styles.heroBody}>
            A single console for managing residents, notices and ledgers across multiple housing societies.
          </Text>
          <View style={styles.heroActions}>
            <Button label="Sign in" onPress={() => navigation.navigate('Login')} />
          </View>
        </View>

        {/* Features */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: theme.primaryDark }]}>What's pinned to the board</Text>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Everything a managing committee actually uses
          </Text>
          <View style={{ gap: 12, marginTop: 20 }}>
            {FEATURES.map((f) => (
              <View key={f.title} style={[styles.featureCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Text style={[styles.label, { color: theme.primaryDark }]}>{f.label}</Text>
                <Text style={[styles.featureTitle, { color: theme.text }]}>{f.title}</Text>
                <Text style={[styles.featureBody, { color: theme.textMuted }]}>{f.body}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* CTA */}
        <View style={[styles.cta, { backgroundColor: theme.mode === 'dark' ? theme.surfaceDim : '#1C2B39' }]}>
          <Text style={[styles.label, { color: '#D9A85C' }]}>Get started</Text>
          <Text style={styles.ctaTitle}>Already have an account with your society?</Text>
          <View style={{ marginTop: 16, width: '100%' }}>
            <Button label="Sign in to your society" onPress={() => navigation.navigate('Login')} />
          </View>
        </View>

        {/* Footer links */}
        <View style={styles.footer}>
          <FooterLink label="About us" onPress={() => navigation.navigate('About')} theme={theme} />
          <FooterLink label="Contact us" onPress={() => navigation.navigate('Contact')} theme={theme} />
          <FooterLink label="Terms & Conditions" onPress={() => navigation.navigate('Terms')} theme={theme} />
        </View>
      </ScrollView>
    </Screen>
  );
}

function FooterLink({ label, onPress, theme }: { label: string; onPress: () => void; theme: ReturnType<typeof useAppTheme>['theme'] }) {
  return (
    <Pressable onPress={onPress} hitSlop={8} style={{ paddingVertical: 6 }}>
      <Text style={[styles.footerLink, { color: theme.textMuted }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hero: { paddingHorizontal: 24, paddingTop: 32, paddingBottom: 40, gap: 14 },
  label: { fontFamily: fontFamilies.mono, fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase' },
  heroTitle: { fontFamily: fontFamilies.display, fontSize: 34, color: '#FBF7EF' },
  heroBody: { fontFamily: fontFamilies.sans, fontSize: 15, lineHeight: 22, color: 'rgba(251,247,239,0.72)', maxWidth: 340 },
  heroActions: { flexDirection: 'row', gap: 12, marginTop: 6 },
  section: { paddingHorizontal: 24, paddingTop: 40 },
  sectionTitle: { fontFamily: fontFamilies.display, fontSize: 22, marginTop: 6 },
  featureCard: { borderWidth: 1, borderRadius: 12, padding: 16, gap: 6 },
  featureTitle: { fontFamily: fontFamilies.display, fontSize: 17 },
  featureBody: { fontFamily: fontFamilies.sans, fontSize: 13, lineHeight: 19 },
  cta: { marginTop: 40, marginHorizontal: 20, borderRadius: 16, padding: 24, alignItems: 'center' },
  ctaTitle: { fontFamily: fontFamilies.display, fontSize: 20, color: '#FBF7EF', textAlign: 'center', marginTop: 8 },
  footer: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: 20, paddingTop: 32, paddingHorizontal: 20 },
  footerLink: { fontFamily: fontFamilies.sansMedium, fontSize: 13 },
});
