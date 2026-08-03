import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radii } from '../theme';
import { useCekmece } from '../state/CekmeceContext';

export default function Toast() {
  const { toast } = useCekmece();
  if (!toast) return null;
  return (
    <View style={styles.wrap} pointerEvents="none">
      <Text style={styles.title}>{toast.title}</Text>
      <Text style={styles.body}>{toast.body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute', left: 16, right: 16, bottom: 104, zIndex: 80,
    backgroundColor: colors.toastBg, borderRadius: radii.lg - 2, padding: 15,
    gap: 4,
    shadowColor: '#000', shadowOpacity: 0.28, shadowRadius: 30, shadowOffset: { width: 0, height: 12 },
  },
  title: { color: '#fff', fontWeight: '600', fontSize: 15.5 },
  body: { color: 'rgba(255,255,255,0.68)', fontSize: 13, lineHeight: 17.5 },
});
