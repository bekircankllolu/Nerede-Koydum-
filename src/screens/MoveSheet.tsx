import React from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radii } from '../theme';
import { useKoydum } from '../state/KoydumContext';
import { PrimaryButton, SecondaryButton, MicButton } from '../components/common';

export default function MoveSheet() {
  const { selected, moveVal, setMoveVal, closeMove, saveMove, startVoice } = useKoydum();

  return (
    <View style={styles.scrim}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ width: '100%' }}>
        <SafeAreaView edges={['bottom']} style={styles.sheet}>
          <Text style={styles.title}>{(selected?.name || 'Eşya') + ' şimdi nerede?'}</Text>
          <View style={styles.row}>
            <View style={styles.fieldBox}>
              <TextInput
                value={moveVal}
                onChangeText={setMoveVal}
                placeholder="Yeni konumu yaz ya da söyle"
                placeholderTextColor={colors.textSecondary}
                style={styles.input}
                autoFocus
              />
            </View>
            <MicButton small size={52} onPress={() => startVoice('move')} />
          </View>
          <View style={styles.actions}>
            <SecondaryButton label="Vazgeç" onPress={closeMove} style={{ flex: 1 }} />
            <PrimaryButton label="Kaydet" onPress={saveMove} style={{ flex: 1.4, height: 52 }} />
          </View>
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
    paddingHorizontal: 20, paddingTop: 24, paddingBottom: 20, gap: 16,
  },
  title: { fontWeight: '700', fontSize: 22, letterSpacing: -0.4, color: colors.textPrimary },
  row: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  fieldBox: { flex: 1, height: 56, borderRadius: radii.md, backgroundColor: colors.card, justifyContent: 'center', paddingHorizontal: 16 },
  input: { fontSize: 16, color: colors.textPrimary, padding: 0 },
  actions: { flexDirection: 'row', gap: 10 },
});
