import React from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radii } from '../theme';
import { useDepo } from '../state/DepoContext';
import { useI18n } from '../i18n/I18nProvider';
import { PrimaryButton, SecondaryButton } from '../components/common';

export default function FoundSheet() {
  const { foundLocVal, setFoundLocVal, closeFoundSheet, markFound } = useDepo();
  const { t } = useI18n();

  return (
    <View style={styles.scrim}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ width: '100%' }}>
        <SafeAreaView edges={['bottom']} style={styles.sheet}>
          <Text style={styles.title}>{t('found.title')}</Text>
          <Text style={styles.hint}>{t('found.hint')}</Text>
          <View style={styles.fieldBox}>
            <TextInput
              value={foundLocVal}
              onChangeText={setFoundLocVal}
              placeholder={t('found.placeholder')}
              placeholderTextColor={colors.textSecondary}
              style={styles.input}
              autoFocus
              returnKeyType="done"
            />
          </View>
          <View style={styles.actions}>
            <SecondaryButton label={t('found.keepLocation')} onPress={() => markFound(false)} style={{ flex: 1 }} />
          </View>
          <PrimaryButton
            label={t('found.markFound')}
            onPress={() => markFound(true)}
            disabled={!foundLocVal.trim()}
            bg={foundLocVal.trim() ? colors.accent : colors.indigoSoftDisabled}
          />
          <Pressable onPress={closeFoundSheet} style={styles.cancelBtn} hitSlop={8}>
            <Text style={styles.cancelText}>{t('common.cancel')}</Text>
          </Pressable>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  scrim: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 55, backgroundColor: colors.sheetScrim,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.appBg, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 20, paddingTop: 24, paddingBottom: 20, gap: 14,
  },
  title: { fontWeight: '700', fontSize: 22, letterSpacing: -0.4, color: colors.textPrimary },
  hint: { fontSize: 14, lineHeight: 19, color: colors.textSecondary, marginTop: -8 },
  fieldBox: { height: 56, borderRadius: radii.md, backgroundColor: colors.card, justifyContent: 'center', paddingHorizontal: 16 },
  input: { fontSize: 16, color: colors.textPrimary, padding: 0 },
  actions: { flexDirection: 'row', gap: 10 },
  cancelBtn: { alignSelf: 'center', paddingVertical: 6 },
  cancelText: { color: colors.textTertiary, fontWeight: '500', fontSize: 13.5 },
});
