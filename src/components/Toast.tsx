import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radii } from '../theme';
import { useDepo } from '../state/DepoContext';

export default function Toast() {
  const { toast } = useDepo();
  if (!toast) return null;
  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <View style={styles.textCol} pointerEvents="none">
        <Text style={styles.title}>{toast.title}</Text>
        <Text style={styles.body}>{toast.body}</Text>
      </View>
      {toast.action ? (
        <Pressable onPress={toast.action.onPress} hitSlop={10} style={styles.actionBtn}>
          <Text style={styles.actionText}>{toast.action.label}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute', left: 16, right: 16, bottom: 104, zIndex: 80,
    backgroundColor: colors.toastBg, borderRadius: radii.lg - 2, padding: 15,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    shadowColor: '#000', shadowOpacity: 0.28, shadowRadius: 30, shadowOffset: { width: 0, height: 12 },
  },
  textCol: { flex: 1, gap: 4 },
  title: { color: '#fff', fontWeight: '600', fontSize: 15.5 },
  body: { color: 'rgba(255,255,255,0.68)', fontSize: 13, lineHeight: 17.5 },
  actionBtn: { paddingVertical: 6, paddingHorizontal: 4 },
  actionText: { color: colors.swipeFavorite, fontWeight: '700', fontSize: 14.5 },
});
