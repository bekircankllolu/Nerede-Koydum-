import React, { useRef } from 'react';
import {
  Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown, useReducedMotion } from 'react-native-reanimated';
import { colors, motion, radii, surfaces } from '../theme';
import { useDepo } from '../state/DepoContext';
import { PrimaryButton, MicButton } from '../components/common';
import ColorPicker from '../components/ColorPicker';
import { PhotoIcon } from '../components/icons';
import { haptics } from '../lib/haptics';

const AnimatedSafeArea = Animated.createAnimatedComponent(SafeAreaView);

// Cancelling is a normal outcome and must stay silent; a denied permission
// is the only case worth telling the user about.
type PhotoPick =
  | { status: 'picked'; uri: string }
  | { status: 'canceled' }
  | { status: 'denied' };

async function takePhoto(): Promise<PhotoPick> {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) return { status: 'denied' };
  const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.7, allowsEditing: true, aspect: [4, 3] });
  if (result.canceled || !result.assets?.length) return { status: 'canceled' };
  return { status: 'picked', uri: result.assets[0].uri };
}

async function pickFromGallery(): Promise<PhotoPick> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return { status: 'denied' };
  const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7, allowsEditing: true, aspect: [4, 3] });
  if (result.canceled || !result.assets?.length) return { status: 'canceled' };
  return { status: 'picked', uri: result.assets[0].uri };
}

const COPY = {
  create: { header: 'Yeni eşya', nameLabel: 'Ne koydun?', namePh: 'Örneğin: Pasaport', locLabel: 'Nereye koydun?', save: 'Eşyayı kaydet' },
  edit: { header: 'Eşyayı düzenle', nameLabel: 'Ne koydun?', namePh: 'Örneğin: Pasaport', locLabel: 'Nereye koydun?', save: 'Değişiklikleri kaydet' },
  'lost-create': { header: 'Kayıp bildir', nameLabel: 'Ne kaybettin?', namePh: 'Örneğin: AirPods', locLabel: 'En son nerede gördün?', save: 'Kayıp olarak kaydet' },
} as const;

export default function ItemFormScreen() {
  const {
    closeForm, formMode, formName, setFormName, formLoc, setFormLoc, formLocUnknown, setFormLocUnknown,
    formNote, setFormNote, formNoteOpen, setFormNoteOpen, formPhotoUri, setFormPhotoUri,
    formColorKey, setFormColorKey, formValid, formSaving, locSuggestions, startVoice, saveForm, flash,
  } = useDepo();

  const reduced = useReducedMotion();
  // Full-screen form, so it fades up rather than sliding like a sheet.
  const entering = reduced
    ? FadeIn.duration(motion.duration.fast)
    : FadeInDown.duration(motion.duration.normal).withInitialValues({ transform: [{ translateY: 10 }] });

  const copy = COPY[formMode];
  const isLostCreate = formMode === 'lost-create';
  const locRef = useRef<TextInput>(null);

  const choosePhoto = async (pick: () => Promise<PhotoPick>, what: string) => {
    const result = await pick();
    if (result.status === 'picked') setFormPhotoUri(result.uri);
    else if (result.status === 'denied') {
      flash('İzin gerekli.', `Ayarlar'dan ${what} erişimine izin verebilirsin.`);
    }
    // 'canceled' is deliberately silent.
  };

  return (
    <AnimatedSafeArea style={styles.root} edges={['top', 'bottom']} entering={entering}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{copy.header}</Text>
          <Pressable onPress={closeForm} hitSlop={8} disabled={formSaving}>
            <Text style={[styles.cancel, formSaving && styles.cancelDisabled]}>Vazgeç</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {formPhotoUri ? (
            <View style={styles.photoPreviewWrap}>
              <Image source={{ uri: formPhotoUri }} style={styles.photoPreview} resizeMode="cover" />
              <Pressable style={styles.removePhoto} onPress={() => setFormPhotoUri(null)}>
                <Text style={styles.removePhotoText}>Kaldır</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.photoBox}>
              <PhotoIcon size={30} />
              <View style={styles.photoActions}>
                <Pressable
                  style={({ pressed }) => [styles.photoActionBtn, pressed && styles.pressed]}
                  onPress={() => choosePhoto(takePhoto, 'kamera')}
                  accessibilityRole="button"
                  accessibilityLabel="Fotoğraf çek"
                >
                  <Text style={styles.photoActionText}>Fotoğraf çek</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [styles.photoActionBtn, pressed && styles.pressed]}
                  onPress={() => choosePhoto(pickFromGallery, 'fotoğraflar')}
                  accessibilityRole="button"
                  accessibilityLabel="Galeriden seç"
                >
                  <Text style={styles.photoActionText}>Galeriden seç</Text>
                </Pressable>
              </View>
            </View>
          )}

          <View style={{ marginTop: 22, gap: 9 }}>
            <Text style={styles.fieldLabel}>{copy.nameLabel}</Text>
            <View style={styles.fieldRow}>
              <View style={styles.fieldBox}>
                <TextInput
                  value={formName}
                  onChangeText={setFormName}
                  placeholder={copy.namePh}
                  placeholderTextColor={colors.textSecondary}
                  style={styles.fieldInput}
                  returnKeyType="next"
                  onSubmitEditing={() => locRef.current?.focus()}
                />
              </View>
              <MicButton small size={52} onPress={() => startVoice('name')} />
            </View>
          </View>

          <View style={{ marginTop: 18, gap: 9 }}>
            <Text style={styles.fieldLabel}>{copy.locLabel}</Text>
            {isLostCreate && formLocUnknown ? (
              <View style={styles.unknownLocBox}>
                <Text style={styles.unknownLocText}>Konum bilinmiyor</Text>
              </View>
            ) : (
              <View style={styles.fieldRow}>
                <View style={styles.fieldBox}>
                  <TextInput
                    ref={locRef}
                    value={formLoc}
                    onChangeText={setFormLoc}
                    placeholder="Yatak odası, beyaz dolap, üst çekmece"
                    placeholderTextColor={colors.textSecondary}
                    style={styles.fieldInputLoc}
                    returnKeyType="done"
                    onSubmitEditing={() => { if (formValid && !formSaving) saveForm(); }}
                  />
                </View>
                <MicButton small size={52} onPress={() => startVoice('loc')} />
              </View>
            )}
            {isLostCreate ? (
              <Pressable
                onPress={() => setFormLocUnknown(!formLocUnknown)}
                style={styles.unknownToggle}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: formLocUnknown }}
              >
                <View style={[styles.checkbox, formLocUnknown && styles.checkboxOn]} />
                <Text style={styles.unknownToggleText}>Hatırlamıyorum</Text>
              </Pressable>
            ) : null}
            {!isLostCreate || !formLocUnknown ? (
              <View style={{ gap: 7, marginTop: 4 }}>
                {locSuggestions.map((s) => (
                  <Pressable
                    key={s}
                    style={({ pressed }) => [styles.suggestion, pressed && styles.pressed]}
                    onPress={() => { haptics.light(); setFormLoc(s); }}
                    accessibilityRole="button"
                    accessibilityLabel={`Konumu kullan: ${s}`}
                  >
                    <Text style={styles.suggestionText} numberOfLines={2}>{s}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
          </View>

          <View style={{ marginTop: 20, gap: 9 }}>
            <Text style={styles.fieldLabel}>Renk</Text>
            <ColorPicker value={formColorKey} onChange={setFormColorKey} />
          </View>

          <Pressable onPress={() => setFormNoteOpen(!formNoteOpen)} style={styles.noteToggle}>
            <Text style={styles.noteToggleText}>{formNoteOpen ? '− Notu kapat' : '+ Not ekle'}</Text>
          </Pressable>
          {formNoteOpen ? (
            <View style={styles.noteBox}>
              <TextInput
                value={formNote}
                onChangeText={setFormNote}
                placeholder="Pasaportla birlikte eski vizeler de burada."
                placeholderTextColor={colors.textSecondary}
                style={styles.noteInput}
                multiline
                returnKeyType="done"
                blurOnSubmit
              />
            </View>
          ) : null}
        </ScrollView>

        <View style={styles.footer}>
          <PrimaryButton
            label={formSaving ? 'Kaydediliyor…' : copy.save}
            onPress={saveForm}
            disabled={!formValid || formSaving}
            bg={formValid && !formSaving ? (isLostCreate ? colors.indigo : colors.accent) : colors.indigoSoftDisabled}
          />
        </View>
      </KeyboardAvoidingView>
    </AnimatedSafeArea>
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
  cancelDisabled: { opacity: 0.4 },
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
    ...surfaces.card,
    flex: 1, height: 56, justifyContent: 'center', paddingHorizontal: 16,
  },
  fieldInput: { fontSize: 17, color: colors.textPrimary, padding: 0 },
  fieldInputLoc: { fontSize: 16, color: colors.textPrimary, padding: 0 },
  pressed: { opacity: 0.85 },
  unknownLocBox: {
    height: 56, borderRadius: radii.md, backgroundColor: colors.neutralChip, justifyContent: 'center', paddingHorizontal: 16,
  },
  unknownLocText: { fontSize: 16, color: colors.neutralChipText, fontWeight: '500' },
  unknownToggle: { flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 2, paddingVertical: 4 },
  checkbox: { width: 20, height: 20, borderRadius: 6, borderWidth: 1.6, borderColor: colors.textTertiary },
  checkboxOn: { backgroundColor: colors.indigo, borderColor: colors.indigo },
  unknownToggleText: { fontSize: 14, color: colors.textSecondary, fontWeight: '500' },
  suggestion: { paddingVertical: 11, paddingHorizontal: 14, borderRadius: radii.sm, backgroundColor: colors.neutralChip },
  suggestionText: { fontSize: 14, lineHeight: 16.8, color: colors.neutralChipText },
  noteToggle: { marginTop: 18, paddingVertical: 4 },
  noteToggleText: { fontWeight: '600', fontSize: 15, color: colors.indigo },
  noteBox: { ...surfaces.card, marginTop: 4, padding: 14 },
  noteInput: { fontSize: 15, lineHeight: 21, color: colors.textPrimary, padding: 0, minHeight: 24 },
  footer: {
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12,
    backgroundColor: 'rgba(247,245,240,0.96)', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.hairlineStrong,
  },
});
