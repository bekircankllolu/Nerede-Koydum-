import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radii } from '../theme';
import { useDepo } from '../state/DepoContext';
import { useI18n } from '../i18n/I18nProvider';
import type { TranslationKey } from '../i18n';
import { PrimaryButton, SecondaryButton } from '../components/common';
import { MicIcon } from '../components/icons';
import Waveform from '../components/Waveform';

const STAGE_COPY: Record<string, { title: TranslationKey; hint: TranslationKey }> = {
  listening: { title: 'voice.listeningTitle', hint: 'voice.listeningHint' },
  processing: { title: 'voice.processingTitle', hint: 'voice.processingHint' },
  done: { title: 'voice.doneTitle', hint: 'voice.doneHint' },
  'no-speech': { title: 'voice.noSpeechTitle', hint: 'voice.noSpeechHint' },
  error: { title: 'voice.errorTitle', hint: 'voice.errorHint' },
};

export default function VoicePanel() {
  const { voice, voiceRetry, voiceUse, accent } = useDepo();
  const { t } = useI18n();
  const copy = STAGE_COPY[voice.stage] || STAGE_COPY.listening;
  const showWave = voice.stage === 'listening' || voice.stage === 'processing';
  const showResult = voice.stage === 'done';
  const secondaryLabel = showWave ? t('voice.typeInstead') : t('voice.sayAgain');

  return (
    <View style={styles.scrim}>
      <SafeAreaView edges={['bottom']} style={styles.sheet}>
        <View style={styles.header}>
          <View style={styles.iconWrap}>
            <MicIcon size={19} color={colors.indigo} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{t(copy.title)}</Text>
            <Text style={styles.hint}>{t(copy.hint)}</Text>
          </View>
        </View>

        {showWave ? <Waveform color={accent} /> : null}
        {showResult ? (
          <View style={styles.resultBox}>
            <Text style={styles.resultText}>{voice.transcript}</Text>
          </View>
        ) : null}

        <View style={styles.actions}>
          <SecondaryButton label={secondaryLabel} onPress={voiceRetry} style={{ flex: 1 }} />
          <PrimaryButton
            label={t('voice.use')}
            onPress={voiceUse}
            disabled={!showResult}
            bg={showResult ? accent : colors.indigoSoftDisabled}
            style={{ flex: 1.3, height: 52 }}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  scrim: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 60, backgroundColor: colors.voiceScrim,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.card, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 20, paddingTop: 24, paddingBottom: 20, gap: 18,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrap: {
    width: 44, height: 44, borderRadius: 99, backgroundColor: colors.indigoLight,
    alignItems: 'center', justifyContent: 'center',
  },
  title: { fontWeight: '600', fontSize: 17, color: colors.textPrimary },
  hint: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  resultBox: { borderRadius: radii.md, backgroundColor: colors.appBg, padding: 18 },
  resultText: { fontWeight: '600', fontSize: 19, lineHeight: 25.5, color: colors.textPrimary },
  actions: { flexDirection: 'row', gap: 10 },
});
