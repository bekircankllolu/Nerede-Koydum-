import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radii } from '../theme';
import { useDepo } from '../state/DepoContext';
import { useI18n } from '../i18n/I18nProvider';
import type { TranslationKey } from '../i18n';

const SECTION_KEYS: { title: TranslationKey; body: TranslationKey }[] = [
  { title: 'privacy.s1Title', body: 'privacy.s1Body' },
  { title: 'privacy.s2Title', body: 'privacy.s2Body' },
  { title: 'privacy.s3Title', body: 'privacy.s3Body' },
  { title: 'privacy.s4Title', body: 'privacy.s4Body' },
];

export default function PrivacyScreen() {
  const { closePrivacy } = useDepo();
  const { t } = useI18n();

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={closePrivacy} hitSlop={12} accessibilityRole="button" accessibilityLabel={t('common.backA11y')}>
          <Text style={styles.back} numberOfLines={1}>{t('common.back')}</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{t('privacy.title')}</Text>

        {SECTION_KEYS.map((section) => (
          <View key={section.title} style={styles.card}>
            <Text style={styles.cardTitle}>{t(section.title)}</Text>
            <Text style={styles.cardBody}>{t(section.body)}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 20, backgroundColor: colors.appBg },
  header: { paddingHorizontal: 20, paddingVertical: 12 },
  back: { color: colors.indigo, fontWeight: '500', fontSize: 16 },
  content: { paddingHorizontal: 20, paddingBottom: 40, gap: 14 },
  title: { fontWeight: '700', fontSize: 28, letterSpacing: -0.6, color: colors.textPrimary, marginBottom: 6 },
  card: { borderRadius: radii.md, backgroundColor: colors.card, padding: 16, gap: 6 },
  cardTitle: { fontWeight: '600', fontSize: 15, color: colors.textPrimary },
  cardBody: { fontSize: 14, lineHeight: 20, color: colors.textSecondary },
});
