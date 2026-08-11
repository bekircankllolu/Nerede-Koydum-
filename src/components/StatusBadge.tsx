import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radii } from '../theme';
import { useI18n } from '../i18n/I18nProvider';

export default function StatusBadge({ label }: { label?: string }) {
  const { t } = useI18n();
  return (
    <View style={styles.badge}>
      <Text style={styles.text} numberOfLines={1}>{label ?? t('lost.badge')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: colors.lostSoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.pill,
    alignSelf: 'flex-start',
  },
  text: { color: colors.lost, fontWeight: '700', fontSize: 11, letterSpacing: 0.2 },
});
