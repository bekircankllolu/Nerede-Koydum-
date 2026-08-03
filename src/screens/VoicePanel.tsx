import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radii } from '../theme';
import { useCekmece } from '../state/CekmeceContext';
import { PrimaryButton, SecondaryButton } from '../components/common';
import { MicIcon } from '../components/icons';
import Waveform from '../components/Waveform';

const COPY: Record<string, { title: string; hint: string }> = {
  listening: { title: 'Dinliyorum…', hint: 'Eşyanın adını ya da yerini söyle.' },
  processing: { title: 'Bir saniye…', hint: 'Yazıya çeviriyorum.' },
  done: { title: 'Şunu duydum', hint: 'Doğruysa kullan, değilse yeniden söyle.' },
  'no-speech': { title: 'Duyamadım', hint: 'Tekrar dener misin, yoksa yazarak girebilirsin.' },
  error: { title: 'Bir sorun oldu', hint: 'Mikrofon veya izinle ilgili bir sorun oluştu.' },
};

export default function VoicePanel() {
  const { voice, voiceRetry, voiceUse, accent } = useCekmece();
  const copy = COPY[voice.stage] || COPY.listening;
  const showWave = voice.stage === 'listening' || voice.stage === 'processing';
  const showResult = voice.stage === 'done';
  const secondaryLabel = showWave ? 'Yazarak gir' : 'Yeniden söyle';

  return (
    <View style={styles.scrim}>
      <SafeAreaView edges={['bottom']} style={styles.sheet}>
        <View style={styles.header}>
          <View style={styles.iconWrap}>
            <MicIcon size={19} color={colors.indigo} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{copy.title}</Text>
            <Text style={styles.hint}>{copy.hint}</Text>
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
            label="Kullan"
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
