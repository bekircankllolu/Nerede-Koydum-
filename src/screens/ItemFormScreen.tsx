import React, { useRef, useState } from 'react';
import {
  Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown, useReducedMotion } from 'react-native-reanimated';
import { colors, controls, motion, radii, spacing, surfaces, typography } from '../theme';
import { useDepo } from '../state/DepoContext';
import { useI18n } from '../i18n/I18nProvider';
import type { TranslationKey } from '../i18n';
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

// One namespace per mode, so the whole form re-labels from a single lookup.
const COPY_NS: Record<string, string> = {
  create: 'form.create',
  edit: 'form.edit',
  'lost-create': 'form.lostCreate',
};

export default function ItemFormScreen() {
  const {
    closeForm, formMode, formName, setFormName, formLoc, setFormLoc, formLocUnknown, setFormLocUnknown,
    formNote, setFormNote, formNoteOpen, setFormNoteOpen, formPhotoUri, setFormPhotoUri,
    formColorKey, setFormColorKey, formValid, formSaving, locSuggestions, startVoice, saveForm, flash,
  } = useDepo();
  const { t } = useI18n();

  const reduced = useReducedMotion();
  // Full-screen form, so it fades up rather than sliding like a sheet.
  const entering = reduced
    ? FadeIn.duration(motion.duration.fast)
    : FadeInDown.duration(motion.duration.normal).withInitialValues({ transform: [{ translateY: 10 }] });

  const ns = COPY_NS[formMode];
  const copy = {
    header: t(`${ns}.header` as TranslationKey),
    nameLabel: t(`${ns}.nameLabel` as TranslationKey),
    namePh: t(`${ns}.namePlaceholder` as TranslationKey),
    locLabel: t(`${ns}.locLabel` as TranslationKey),
    save: t(`${ns}.save` as TranslationKey),
  };
  const isLostCreate = formMode === 'lost-create';
  const locRef = useRef<TextInput>(null);
  // Focus is shown by tinting the existing hairline — no glow, no size change,
  // so nothing in the layout shifts when the keyboard arrives.
  const [focused, setFocused] = useState<'name' | 'loc' | null>(null);

  const choosePhoto = async (pick: () => Promise<PhotoPick>, deniedKey: TranslationKey) => {
    const result = await pick();
    if (result.status === 'picked') setFormPhotoUri(result.uri);
    else if (result.status === 'denied') {
      flash(t('form.permissionTitle'), t(deniedKey));
    }
    // 'canceled' is deliberately silent.
  };

  return (
    <AnimatedSafeArea style={styles.root} edges={['top', 'bottom']} entering={entering}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{copy.header}</Text>
          <Pressable onPress={closeForm} hitSlop={8} disabled={formSaving}>
            <Text style={[styles.cancel, formSaving && styles.cancelDisabled]} numberOfLines={1}>
              {t('common.cancel')}
            </Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {formPhotoUri ? (
            <View style={styles.photoPreviewWrap}>
              <Image source={{ uri: formPhotoUri }} style={styles.photoPreview} resizeMode="cover" />
              <Pressable style={styles.removePhoto} onPress={() => setFormPhotoUri(null)}>
                <Text style={styles.removePhotoText} numberOfLines={1}>{t('form.photoRemove')}</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.photoBox}>
              <View style={styles.photoBoxHead}>
                <PhotoIcon size={22} />
                <Text style={styles.photoBoxLabel}>{t('form.photoAdd')}</Text>
              </View>
              <View style={styles.photoActions}>
                <Pressable
                  style={({ pressed }) => [styles.photoActionBtn, pressed && styles.pressed]}
                  onPress={() => choosePhoto(takePhoto, 'form.permissionCamera')}
                  accessibilityRole="button"
                  accessibilityLabel={t('form.photoTake')}
                >
                  <Text style={styles.photoActionText} numberOfLines={1}>{t('form.photoTake')}</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [styles.photoActionBtn, pressed && styles.pressed]}
                  onPress={() => choosePhoto(pickFromGallery, 'form.permissionPhotos')}
                  accessibilityRole="button"
                  accessibilityLabel={t('form.photoPick')}
                >
                  <Text style={styles.photoActionText} numberOfLines={1}>{t('form.photoPick')}</Text>
                </Pressable>
              </View>
            </View>
          )}

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>{copy.nameLabel}</Text>
            <View style={styles.fieldRow}>
              <View style={[styles.fieldBox, focused === 'name' && styles.fieldBoxFocused]}>
                <TextInput
                  value={formName}
                  onFocus={() => setFocused('name')}
                  onBlur={() => setFocused(null)}
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

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>{copy.locLabel}</Text>
            {isLostCreate && formLocUnknown ? (
              <View style={styles.unknownLocBox}>
                <Text style={styles.unknownLocText}>{t('common.unknownLocation')}</Text>
              </View>
            ) : (
              <View style={styles.fieldRow}>
                <View style={[styles.fieldBox, focused === 'loc' && styles.fieldBoxFocused]}>
                  <TextInput
                    ref={locRef}
                    value={formLoc}
                    onFocus={() => setFocused('loc')}
                    onBlur={() => setFocused(null)}
                    onChangeText={setFormLoc}
                    placeholder={t('form.locPlaceholder')}
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
                <Text style={styles.unknownToggleText}>{t('form.dontRemember')}</Text>
              </Pressable>
            ) : null}
            {!isLostCreate || !formLocUnknown ? (
              <View style={styles.suggestionRow}>
                {locSuggestions.map((s) => (
                  <Pressable
                    key={s}
                    style={({ pressed }) => [styles.suggestion, pressed && styles.pressed]}
                    onPress={() => { haptics.light(); setFormLoc(s); }}
                    accessibilityRole="button"
                    accessibilityLabel={t('form.suggestionA11y', { loc: s })}
                  >
                    <Text style={styles.suggestionText} numberOfLines={2}>{s}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
          </View>

          {/* Colour and note are optional: they get a tighter rhythm so they
              never compete with name/location for attention. */}
          <View style={styles.secondaryGroup}>
            <Text style={styles.fieldLabel}>{t('form.colorLabel')}</Text>
            <ColorPicker value={formColorKey} onChange={setFormColorKey} />
          </View>

          <Pressable onPress={() => setFormNoteOpen(!formNoteOpen)} style={styles.noteToggle}>
            <Text style={styles.noteToggleText}>{formNoteOpen ? t('form.noteClose') : t('form.noteAdd')}</Text>
          </Pressable>
          {formNoteOpen ? (
            <View style={styles.noteBox}>
              <TextInput
                value={formNote}
                onChangeText={setFormNote}
                placeholder={t('form.notePlaceholder')}
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
            label={formSaving ? t('form.saving') : copy.save}
            loading={formSaving}
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
    paddingHorizontal: spacing.xl, paddingVertical: spacing.md, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'space-between',
  },
  headerTitle: { ...typography.title3, color: colors.textPrimary },
  cancel: { ...typography.body, color: colors.indigo, fontWeight: '500' },
  cancelDisabled: { opacity: 0.4 },
  content: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xl },
  // Compact when there's no photo yet: a 4:3 empty frame used to swallow the
  // top third of the screen before the user had typed anything.
  photoBox: {
    borderRadius: radii.lg, backgroundColor: colors.photoPlaceholderBg, height: 130,
    borderWidth: 1, borderStyle: 'dashed', borderColor: colors.photoPlaceholderBorder,
    alignItems: 'center', justifyContent: 'center', gap: spacing.md,
  },
  photoBoxHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  photoBoxLabel: { ...typography.callout, color: colors.textWarm },
  photoActions: { flexDirection: 'row', gap: spacing.sm + 2 },
  // 44 rather than controls.compactHeight (40): these are the only real tap
  // targets in the empty photo state, so they get the full minimum locally
  // instead of raising the shared compact height everywhere.
  photoActionBtn: {
    // flexShrink keeps the pair inside the card on a 320pt screen instead of
    // pushing past it — the labels are short enough that it never actually
    // engages at supported widths, it is just a hard stop against overflow.
    minHeight: 44, justifyContent: 'center', flexShrink: 1,
    paddingVertical: spacing.sm + 2, paddingHorizontal: spacing.lg - 1,
    borderRadius: radii.sm, backgroundColor: colors.card,
  },
  photoActionText: { ...typography.subheadline, fontWeight: '600', color: colors.textPrimary },
  // A chosen photo is worth showing large.
  photoPreviewWrap: { borderRadius: radii.lg, overflow: 'hidden', aspectRatio: 4 / 3 },
  photoPreview: { width: '100%', height: '100%' },
  removePhoto: {
    position: 'absolute', right: spacing.sm + 2, top: spacing.sm + 2,
    minHeight: 34, justifyContent: 'center',
    backgroundColor: 'rgba(22,22,22,0.6)',
    paddingVertical: spacing.xs + 2, paddingHorizontal: spacing.md,
    borderRadius: radii.sm,
  },
  removePhotoText: { ...typography.footnote, fontWeight: '600', color: '#fff' },
  fieldGroup: { marginTop: spacing.xl, gap: spacing.sm + 1 },
  secondaryGroup: { marginTop: spacing.lg, gap: spacing.sm },
  fieldLabel: { ...typography.footnote, fontWeight: '600', color: colors.textSecondary, paddingLeft: spacing.xs },
  fieldRow: { flexDirection: 'row', gap: spacing.sm + 2, alignItems: 'center' },
  fieldBox: {
    ...surfaces.card,
    flex: 1, height: controls.fieldHeight, justifyContent: 'center', paddingHorizontal: spacing.lg,
  },
  fieldBoxFocused: { borderColor: colors.indigoSoftDisabled },
  fieldInput: { ...typography.headline, fontWeight: '400', color: colors.textPrimary, padding: 0 },
  fieldInputLoc: { ...typography.body, color: colors.textPrimary, padding: 0 },
  pressed: { opacity: 0.85 },
  unknownLocBox: {
    height: controls.fieldHeight, borderRadius: radii.md, backgroundColor: colors.neutralChip,
    justifyContent: 'center', paddingHorizontal: spacing.lg,
  },
  unknownLocText: { ...typography.body, fontWeight: '500', color: colors.neutralChipText },
  unknownToggle: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm + 1,
    marginTop: 2, paddingVertical: spacing.sm,
  },
  checkbox: { width: 20, height: 20, borderRadius: 6, borderWidth: 1.6, borderColor: colors.textTertiary },
  checkboxOn: { backgroundColor: colors.indigo, borderColor: colors.indigo },
  unknownToggleText: { ...typography.subheadline, fontWeight: '500', color: colors.textSecondary },
  suggestionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.xs },
  suggestion: {
    paddingVertical: spacing.sm + 1, paddingHorizontal: spacing.md,
    borderRadius: radii.pill, backgroundColor: colors.neutralChip, maxWidth: '100%',
  },
  suggestionText: { ...typography.footnote, color: colors.neutralChipText },
  noteToggle: { marginTop: spacing.lg, paddingVertical: spacing.sm },
  noteToggleText: { ...typography.callout, fontWeight: '600', color: colors.indigo },
  noteBox: { ...surfaces.card, marginTop: spacing.xs, padding: spacing.md + 2 },
  noteInput: { ...typography.callout, fontWeight: '400', lineHeight: 21, color: colors.textPrimary, padding: 0, minHeight: 24 },
  footer: {
    paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.md,
    backgroundColor: 'rgba(247,245,240,0.96)',
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.hairlineStrong,
  },
});
