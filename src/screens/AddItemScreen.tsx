import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radii } from '../theme';
import { useCekmece } from '../state/CekmeceContext';
import { PrimaryButton, MicButton } from '../components/common';
import { PhotoIcon } from '../components/icons';

async function takePhoto(): Promise<string | null> {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) return null;
  const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.7, allowsEditing: true, aspect: [4, 3] });
  if (result.canceled || !result.assets?.length) return null;
  return result.assets[0].uri;
}

async function pickFromGallery(): Promise<string | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return null;
  const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7, allowsEditing: true, aspect: [4, 3] });
  if (result.canceled || !result.assets?.length) return null;
  return result.assets[0].uri;
}

export default function AddItemScreen() {
  const {
    closeAdd, addName, setAddName, addLoc, setAddLoc, addNote, setAddNote,
    noteOpen, setNoteOpen, addPhotoUri, setAddPhotoUri, locSuggestions,
    startVoice, saveItem,
  } = useCekmece();

  const canSave = addName.trim().length > 0 && addLoc.trim().length > 0;

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Yeni eşya</Text>
        <Pressable onPress={closeAdd} hitSlop={8}>
          <Text style={styles.cancel}>Vazgeç</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {addPhotoUri ? (
          <View style={styles.photoPreviewWrap}>
            <Image source={{ uri: addPhotoUri }} style={styles.photoPreview} resizeMode="cover" />
            <Pressable style={styles.removePhoto} onPress={() => setAddPhotoUri(null)}>
              <Text style={styles.removePhotoText}>Kaldır</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.photoBox}>
            <PhotoIcon size={30} />
            <View style={styles.photoActions}>
              <Pressable style={styles.photoActionBtn} onPress={async () => {
                const uri = await takePhoto();
                if (uri) setAddPhotoUri(uri);
              }}>
                <Text style={styles.photoActionText}>Fotoğraf çek</Text>
              </Pressable>
              <Pressable style={styles.photoActionBtn} onPress={async () => {
                const uri = await pickFromGallery();
                if (uri) setAddPhotoUri(uri);
              }}>
                <Text style={styles.photoActionText}>Galeriden seç</Text>
              </Pressable>
            </View>
          </View>
        )}

        <View style={{ marginTop: 22, gap: 9 }}>
          <Text style={styles.fieldLabel}>Ne koydun?</Text>
          <View style={styles.fieldRow}>
            <View style={styles.fieldBox}>
              <TextInput
                value={addName}
                onChangeText={setAddName}
                placeholder="Örneğin: Pasaport"
                placeholderTextColor={colors.textSecondary}
                style={styles.fieldInput}
              />
            </View>
            <MicButton small size={52} onPress={() => startVoice('name')} />
          </View>
        </View>

        <View style={{ marginTop: 18, gap: 9 }}>
          <Text style={styles.fieldLabel}>Nereye koydun?</Text>
          <View style={styles.fieldRow}>
            <View style={styles.fieldBox}>
              <TextInput
                value={addLoc}
                onChangeText={setAddLoc}
                placeholder="Yatak odası, beyaz dolap, üst çekmece"
                placeholderTextColor={colors.textSecondary}
                style={[styles.fieldInput, { fontSize: 16 }]}
              />
            </View>
            <MicButton small size={52} onPress={() => startVoice('loc')} />
          </View>
          <View style={{ gap: 7, marginTop: 4 }}>
            {locSuggestions.map((s) => (
              <Pressable key={s} style={styles.suggestion} onPress={() => setAddLoc(s)}>
                <Text style={styles.suggestionText}>{s}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <Pressable onPress={() => setNoteOpen(!noteOpen)} style={styles.noteToggle}>
          <Text style={styles.noteToggleText}>{noteOpen ? '− Notu kapat' : '+ Not ekle'}</Text>
        </Pressable>
        {noteOpen ? (
          <View style={styles.noteBox}>
            <TextInput
              value={addNote}
              onChangeText={setAddNote}
              placeholder="Pasaportla birlikte eski vizeler de burada."
              placeholderTextColor={colors.textSecondary}
              style={styles.noteInput}
              multiline
            />
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton
          label="Kaydet"
          onPress={saveItem}
          disabled={!canSave}
          bg={canSave ? colors.accent : colors.indigoSoftDisabled}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 40, backgroundColor: colors.appBg },
  header: {
    paddingHorizontal: 20, paddingVertical: 12, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'space-between',
  },
  headerTitle: { fontWeight: '600', fontSize: 18, color: colors.textPrimary },
  cancel: { color: colors.indigo, fontWeight: '500', fontSize: 16 },
  content: { paddingHorizontal: 20, paddingBottom: 20 },
  photoBox: {
    borderRadius: radii.lg, backgroundColor: colors.photoPlaceholderBg, aspectRatio: 4 / 3,
    borderWidth: 1, borderStyle: 'dashed', borderColor: colors.photoPlaceholderBorder,
    alignItems: 'center', justifyContent: 'center', gap: 14,
  },
  photoActions: { flexDirection: 'row', gap: 9 },
  photoActionBtn: { paddingVertical: 10, paddingHorizontal: 15, borderRadius: radii.sm, backgroundColor: colors.card },
  photoActionText: { fontWeight: '600', fontSize: 14, color: colors.textPrimary },
  photoPreviewWrap: { borderRadius: radii.lg, overflow: 'hidden', aspectRatio: 4 / 3 },
  photoPreview: { width: '100%', height: '100%' },
  removePhoto: {
    position: 'absolute', right: 10, top: 10, backgroundColor: 'rgba(22,22,22,0.6)',
    paddingVertical: 6, paddingHorizontal: 12, borderRadius: radii.sm,
  },
  removePhotoText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  fieldLabel: { fontWeight: '600', fontSize: 13, color: colors.textSecondary, paddingLeft: 4 },
  fieldRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  fieldBox: {
    flex: 1, height: 56, borderRadius: radii.md, backgroundColor: colors.card,
    justifyContent: 'center', paddingHorizontal: 16,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 2, shadowOffset: { width: 0, height: 1 },
  },
  fieldInput: { fontSize: 17, color: colors.textPrimary, padding: 0 },
  suggestion: { paddingVertical: 11, paddingHorizontal: 14, borderRadius: radii.sm, backgroundColor: colors.neutralChip },
  suggestionText: { fontSize: 14, lineHeight: 16.8, color: colors.neutralChipText },
  noteToggle: { marginTop: 18, paddingVertical: 4 },
  noteToggleText: { fontWeight: '600', fontSize: 15, color: colors.indigo },
  noteBox: {
    marginTop: 4, borderRadius: radii.md, backgroundColor: colors.card, padding: 14,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 2, shadowOffset: { width: 0, height: 1 },
  },
  noteInput: { fontSize: 15, lineHeight: 21, color: colors.textPrimary, padding: 0, minHeight: 24 },
  footer: {
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12,
    backgroundColor: 'rgba(247,245,240,0.96)', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.hairlineStrong,
  },
});
