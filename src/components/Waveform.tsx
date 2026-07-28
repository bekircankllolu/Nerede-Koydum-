import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

const BAR_COUNT = 22;

export default function Waveform({ color }: { color: string }) {
  const values = useRef(Array.from({ length: BAR_COUNT }, () => new Animated.Value(0.3))).current;

  useEffect(() => {
    const animations = values.map((v, i) => {
      const duration = 680 + (i % 5) * 120;
      const delay = i * 55;
      return Animated.loop(
        Animated.sequence([
          Animated.timing(v, { toValue: 1, duration: duration / 2, delay, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(v, { toValue: 0.3, duration: duration / 2, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      );
    });
    animations.forEach((a) => a.start());
    return () => animations.forEach((a) => a.stop());
  }, [values]);

  return (
    <View style={styles.row}>
      {values.map((v, i) => (
        <Animated.View
          key={i}
          style={[
            styles.bar,
            {
              height: 8 + ((i * 7) % 34),
              backgroundColor: color,
              transform: [{ scaleY: v }],
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, height: 56 },
  bar: { width: 4, borderRadius: 9, opacity: 0.85 },
});
