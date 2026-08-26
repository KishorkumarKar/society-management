import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../components/ui/Screen';
import { Card } from '../../components/ui/Card';
import { useAppTheme } from '../../theme/ThemeContext';
import { fontFamilies } from '../../theme/typography';

/**
 * There is NO Terms & Conditions page anywhere in the source repo
 * (frontend/app has about/, contact/, pricing/, login/, dashboard/ — no
 * terms/ or legal/ route at all), so unlike About/Contact this screen
 * isn't "adapted from the real thing" — it's a placeholder shell only.
 *
 * Deliberately not filled with generic boilerplate legal text: real Terms
 * & Conditions is a legal document that should come from whoever owns
 * SocietyLedger's actual policies (liability, data handling, cancellation,
 * etc.), reviewed by counsel — not invented by an AI assistant. Swap the
 * placeholder below for the real text (or fetch it from a CMS/URL) before
 * shipping.
 */
export function TermsScreen() {
  const { theme } = useAppTheme();

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <Text style={[styles.title, { color: theme.text }]}>Terms & Conditions</Text>

        <Card style={{ marginTop: 16, borderColor: theme.primary }}>
          <Text style={[styles.noticeLabel, { color: theme.primaryDark }]}>Placeholder content</Text>
          <Text style={[styles.noticeBody, { color: theme.textMuted }]}>
            This page doesn't exist in the source SocietyLedger web app, so there's no
            real copy to mirror. Replace the section below with your organization's
            actual Terms & Conditions before this screen ships to users.
          </Text>
        </Card>

        <View style={{ marginTop: 20, gap: 16 }}>
          {PLACEHOLDER_SECTIONS.map((s) => (
            <View key={s.title}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>{s.title}</Text>
              <Text style={[styles.sectionBody, { color: theme.textMuted }]}>{s.body}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}

const PLACEHOLDER_SECTIONS = [
  { title: '1. Acceptance of terms', body: 'Placeholder — describe what using the app means the resident/committee agrees to.' },
  { title: '2. Accounts & society access', body: 'Placeholder — describe how login credentials and society-scoped access are governed.' },
  { title: '3. Payments & maintenance dues', body: 'Placeholder — describe billing, refunds, and dispute handling for maintenance/expense records.' },
  { title: '4. Data & privacy', body: 'Placeholder — link to or summarize the actual privacy policy once one exists.' },
  { title: '5. Changes to these terms', body: 'Placeholder — describe how and when updates will be communicated to users.' },
];

const styles = StyleSheet.create({
  title: { fontFamily: fontFamilies.display, fontSize: 26 },
  noticeLabel: { fontFamily: fontFamilies.mono, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase' },
  noticeBody: { fontFamily: fontFamilies.sans, fontSize: 13, lineHeight: 19, marginTop: 6 },
  sectionTitle: { fontFamily: fontFamilies.sansSemiBold, fontSize: 15 },
  sectionBody: { fontFamily: fontFamilies.sans, fontSize: 13, lineHeight: 19, marginTop: 4 },
});
