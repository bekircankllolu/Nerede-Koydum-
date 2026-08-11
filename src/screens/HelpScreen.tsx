import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radii, FREE_ITEM_LIMIT } from '../theme';
import { useDepo } from '../state/DepoContext';
import { useI18n } from '../i18n/I18nProvider';
import type { TranslationKey } from '../i18n';

const TOPIC_KEYS: { title: TranslationKey; body: TranslationKey }[] = [
  { title: 'help.q1Title', body: 'help.q1Body' },
  { title: 'help.q2Title', body: 'help.q2Body' },
  { title: 'help.q3Title', body: 'help.q3Body' },
  { title: 'help.q4Title', body: 'help.q4Body' },
  { title: 'help.q5Title', body: 'help.q5Body' },
];

export default function HelpScreen() {
  const { closeHelp } = useDepo();
  const { t } = useI18n();

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={closeHelp} hitSlop={12} accessibilityRole="button" accessibilityLabel={t('common.backA11y')}>
          <Text style={styles.back} numberOfLines={1}>{t('common.back')}</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{t('help.title')}</Text>

        {TOPIC_KEYS.map((topic) => (
          <View key={topic.title} style={styles.card}>
            <Text style={styles.cardTitle}>{t(topic.title)}</Text>
            <Text style={styles.cardBody}>{t(topic.body, { limit: FREE_ITEM_LIMIT })}</Text>
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
