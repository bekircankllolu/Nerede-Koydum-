import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radii } from '../theme';
import { useKoydum } from '../state/KoydumContext';
import { PrimaryButton } from '../components/common';

function OnboardingGlyph() {
  return (
    <Svg width={34} height={34} viewBox="0 0 24 24" fill="none">
      <Rect x={3} y={8} width={18} height={12} rx={2.5} stroke="#fff" strokeWidth={1.8} />
      <Path d="M9 13h6" stroke="#fff" strokeWidth={1.8} strokeLinecap="round" />
      <Path d="M6 8V6a2 2 0 012-2h8a2 2 0 012 2v2" stroke="#fff" strokeWidth={1.8} />
      <Circle cx={18} cy={5} r={2.6} fill="#EEEEFF" />
    </Svg>
  );
}

export default function OnboardingScreen() {
  const { onbData, onbStep, onbDotsCount, onbNext, onbSkip, accent } = useKoydum();
  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <View style={styles.top}>
        <View style={styles.iconBox}>
          <OnboardingGlyph />
        </View>
        <View style={styles.copy}>
          <Text style={styles.title}>{onbData.title}</Text>
          <Text style={styles.body}>{onbData.body}</Text>
        </View>
        {onbData.chips ? (
          <View style={styles.chipRow}>
            {onbData.chips.map((c, i) => (
              <View key={i} style={styles.chip}>
                <Text style={styles.chipText}>{c}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>
      <View style={styles.bottom}>
        <View style={styles.dots}>
          {Array.from({ length: onbDotsCount }).map((_, i) => (
            <View key={i} style={[styles.dot, { backgroundColor: i === onbStep ? accent : '#D6D1C7' }]} />
          ))}
        </View>
        <PrimaryButton label={onbData.cta} onPress={onbNext} />
        <Pressable onPress={onbSkip} style={styles.skip}>
          <Text style={styles.skipText}>Atla</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 30, backgroundColor: colors.appBg,
    paddingHorizontal: 28, paddingBottom: 20,
  },
  top: { flex: 1, justifyContent: 'center', gap: 34 },
  iconBox: {
    alignSelf: 'flex-start', width: 66, height: 66, borderRadius: 18,
    backgroundColor: colors.indigo, alignItems: 'center', justifyContent: 'center',
  },
  copy: { gap: 14 },
  title: { fontWeight: '700', fontSize: 34, lineHeight: 39, letterSpacing: -0.8, color: colors.textPrimary },
  body: { fontSize: 17, lineHeight: 24.6, color: colors.textSecondary },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  chip: { paddingVertical: 9, paddingHorizontal: 13, borderRadius: radii.sm, backgroundColor: colors.indigoLight },
  chipText: { color: colors.indigo, fontWeight: '600', fontSize: 14 },
  bottom: { gap: 16, paddingTop: 8 },
  dots: { flexDirection: 'row', gap: 6, justifyContent: 'center' },
  dot: { width: 7, height: 7, borderRadius: 99 },
  skip: { paddingVertical: 6, alignItems: 'center' },
  skipText: { color: colors.textSecondary, fontWeight: '500', fontSize: 14 },
});
