import React, { useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown, useReducedMotion } from 'react-native-reanimated';
import { colors, controls, motion, radii, spacing, surfaces, typography } from '../theme';
import { useDepo } from '../state/DepoContext';
import { useI18n } from '../i18n/I18nProvider';
import { PrimaryButton, SecondaryButton } from '../components/common';
import { PhotoIcon, StarIcon } from '../components/icons';
import { photoFileExists } from '../lib/photoStorage';

const AnimatedSafeArea = Animated.createAnimatedComponent(SafeAreaView);

export default function DetailScreen() {
  const {
    detail, closeDetail, toggleFav, openMove, confirmLoc, deleteItem, openEditForm, markLost, openFoundSheet,
  } = useDepo();
  const { t } = useI18n();
  const reduced = useReducedMotion();
  // A stored photo whose file has gone missing must degrade to a placeholder
  // rather than rendering a broken image or crashing the screen.
  const [photoBroken, setPhotoBroken] = useState(false);
  const d = detail();
  if (!d) return null;

  // Overlays are conditionally mounted, so an entering animation is enough —
  // there is no exit frame to animate against.
  const entering = reduced
    ? FadeIn.duration(motion.duration.fast)
    : FadeInDown.duration(motion.duration.normal).withInitialValues({ transform: [{ translateY: 8 }] });

  const photoMissing = !!d.item.photoUri && !photoFileExists(d.item.photoUri);
  const showPhoto = !!d.item.photoUri && !photoBroken && !photoMissing;

  const onDelete = () => {
    Alert.alert(t('detail.deleteConfirmTitle'), t('detail.deleteConfirmBody', { name: d.name }), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('detail.deleteConfirmCta'), style: 'destructive', onPress: deleteItem },
    ]);
  };

  const onMarkLost = () => {
    Alert.alert(
      t('detail.markLostConfirmTitle', { name: d.name }),
      t('detail.markLostConfirmBody'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('detail.markLost'), style: 'destructive', onPress: markLost },
      ]
    );
  };

  return (
    <AnimatedSafeArea style={styles.root} edges={['top', 'bottom']} entering={entering}>
      <View style={styles.header}>
        {/* hitSlop rather than a taller Pressable: the label is ~22pt, so 12
            on each side clears 44pt without growing the header. */}
        <Pressable onPress={closeDetail} hitSlop={12} accessibilityRole="button" accessibilityLabel={t('common.backA11y')}>
          <Text style={styles.back} numberOfLines={1}>{t('common.back')}</Text>
        </Pressable>
        <Pressable onPress={openEditForm} hitSlop={12} accessibilityRole="button" accessibilityLabel={t('detail.editA11y')}>
          <Text style={styles.edit} numberOfLines={1}>{t('detail.edit')}</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {showPhoto ? (
          <Image
            source={{ uri: d.item.photoUri as string }}
            style={styles.photo}
            resizeMode="cover"
            onError={() => setPhotoBroken(true)}
          />
        ) : (
          <View style={styles.photoPlaceholder}>
            <PhotoIcon size={22} />
            <Text style={styles.photoPlaceholderText}>
              {d.item.photoUri ? t('detail.photoUnavailable') : t('detail.photoNone')}
            </Text>
          </View>
        )}

        <View style={styles.nameRow}>
          <Text style={styles.name}>{d.name}</Text>
          <Pressable
            onPress={toggleFav}
            hitSlop={10}
            style={styles.favBtn}
            accessibilityRole="button"
            accessibilityLabel={d.item.fav ? t('detail.favRemove') : t('detail.favAdd')}
          >
            <StarIcon size={24} color={d.item.fav ? colors.favorite : colors.textTertiary} filled={d.item.fav} />
          </Pressable>
        </View>

        <View style={styles.locCard}>
          <Text style={styles.locLabel}>{d.isLost ? t('detail.locLabelLost') : t('detail.locLabelStored')}</Text>
          <View style={styles.locLines}>
            <Text style={styles.locPrimary}>{d.lines[0]}</Text>
            {d.lines.length > 1 ? (
              <Text style={styles.locPath}>{d.lines.slice(1).join('  ›  ')}</Text>
            ) : null}
          </View>
          {d.isLost ? (
            <Text style={styles.lostLine}>{d.lostDaysLabel}</Text>
          ) : (
            <Text style={d.stale ? styles.confirmedStale : styles.confirmed}>
              {d.stale
                ? t('detail.staleSuffix', { confirmed: d.confirmed.replace(/\.$/, '') })
                : d.confirmed}
            </Text>
          )}
          {!d.isLost ? (
            <View style={styles.locActions}>
              <PrimaryButton label={t('detail.move')} onPress={openMove} style={{ flex: 1, height: 52 }} />
              <SecondaryButton
                label={t('detail.confirmLoc')}
                accessibilityLabel={t('detail.confirmLocA11y')}
                onPress={confirmLoc}
                style={d.stale ? styles.confirmBtnStale : styles.confirmBtn}
                textColor={d.stale ? '#fff' : undefined}
              />
            </View>
          ) : null}
        </View>

        {d.isLost ? (
          <Pressable style={styles.foundBtn} onPress={openFoundSheet} accessibilityRole="button" accessibilityLabel={t('detail.found')}>
            <Text style={styles.foundBtnText} numberOfLines={1}>{t('detail.found')}</Text>
          </Pressable>
        ) : (
          <Pressable onPress={onMarkLost} style={styles.markLostBtn} hitSlop={6} accessibilityRole="button" accessibilityLabel={t('detail.markLost')}>
            <Text style={styles.markLostText}>{t('detail.markLost')}</Text>
          </Pressable>
        )}

        {d.note ? (
          <View style={styles.noteCard}>
            <Text style={styles.noteLabel}>{t('detail.noteLabel')}</Text>
            <Text style={styles.noteText}>{d.note}</Text>
          </View>
        ) : null}

        <Text style={styles.historyLabel}>{t('detail.historyLabel')}</Text>
        <View style={styles.historyCard}>
          {d.history.length === 0 ? (
            <View style={styles.historyRow}>
              <Text style={styles.historyEmpty}>{t('detail.historyEmpty')}</Text>
            </View>
          ) : null}
          {d.history.map((h, i) => (
            <View key={i} style={[styles.historyRow, i === d.history.length - 1 && { borderBottomWidth: 0 }]}>
              <View style={[styles.dot, { backgroundColor: h.dot }]} />
              <Text style={styles.historyWhere}>{h.where}</Text>
              <Text style={styles.historyWhen}>{h.when}</Text>
            </View>
          ))}
        </View>

        {/* Text links keep their quiet padding and gain the rest through
            slop, so the vertical rhythm of the screen is unchanged. */}
        <Pressable onPress={onDelete} style={styles.deleteBtn} hitSlop={6} accessibilityRole="button" accessibilityLabel={t('detail.deleteRecord')}>
          <Text style={styles.deleteText}>{t('detail.deleteRecord')}</Text>
        </Pressable>
      </ScrollView>
    </AnimatedSafeArea>
  );
}

const styles = StyleSheet.create({
  root: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 20, backgroundColor: colors.appBg },
  header: {
    paddingHorizontal: spacing.xl, paddingVertical: spacing.md, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'space-between',
  },
  back: { ...typography.body, color: colors.indigo, fontWeight: '500' },
  edit: { ...typography.bodyStrong, color: colors.indigo },
  content: { paddingHorizontal: spacing.xl, paddingBottom: 40 },
  photo: { borderRadius: radii.lg, height: 210, backgroundColor: colors.photoPlaceholderBg },
  // Deliberately much shorter than the real photo: the location card is the
  // answer the user came for, so it should not be pushed down by an empty
  // frame.
  photoPlaceholder: {
    borderRadius: radii.lg, height: 110, backgroundColor: colors.photoPlaceholderBg,
    borderWidth: 1, borderStyle: 'dashed', borderColor: colors.photoPlaceholderBorder,
    alignItems: 'center', justifyContent: 'center', gap: spacing.xs + 2,
  },
  photoPlaceholderText: { ...typography.caption, color: colors.textWarm2 },
  nameRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginVertical: spacing.lg, gap: spacing.sm + 2,
  },
  name: { flex: 1, ...typography.title1, fontSize: 28, lineHeight: 34, color: colors.textPrimary },
  favBtn: {
    width: controls.iconButton, height: controls.iconButton,
    alignItems: 'center', justifyContent: 'center',
  },
  // The one real hero surface on this screen — this is the answer the user
  // opened the app for, so it keeps its elevation.
  locCard: { ...surfaces.hero, padding: spacing.xxl - 2, gap: spacing.md + 2 },
  locLabel: { ...typography.overline, color: colors.textSecondary, textTransform: 'uppercase' },
  locLines: { gap: spacing.xs },
  locPrimary: { ...typography.title2, color: colors.textPrimary },
  locPath: { ...typography.headline, color: colors.textSecondary },
  confirmed: { ...typography.footnote, color: colors.accent },
  confirmedStale: { ...typography.footnote, color: colors.textSecondary },
  confirmBtn: { flex: 1, backgroundColor: colors.indigoLight },
  // Old records make the re-confirm action a little more inviting without
  // displacing the primary "move it" action.
  confirmBtnStale: { flex: 1, backgroundColor: colors.indigo },
  lostLine: { ...typography.footnote, color: colors.lost, fontWeight: '600' },
  locActions: { flexDirection: 'row', gap: spacing.sm + 2, marginTop: 2 },
  foundBtn: {
    marginTop: spacing.md + 2, height: 56, borderRadius: radii.md, backgroundColor: colors.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  foundBtnText: { color: '#fff', ...typography.headline, fontWeight: '700' },
  markLostBtn: {
    marginTop: spacing.md + 2, alignSelf: 'center',
    paddingVertical: spacing.sm, paddingHorizontal: spacing.md,
  },
  markLostText: { ...typography.subheadline, color: colors.lost, fontWeight: '500' },
  noteCard: { ...surfaces.card, marginTop: spacing.lg, padding: spacing.lg },
  noteLabel: { ...typography.overline, color: colors.textSecondary, marginBottom: spacing.sm - 2 },
  noteText: { ...typography.callout, fontWeight: '400', lineHeight: 21, color: colors.textPrimary },
  historyLabel: {
    marginTop: spacing.xxl, ...typography.footnote, fontWeight: '600',
    color: colors.textSecondary, paddingLeft: spacing.xs,
  },
  historyCard: { ...surfaces.card, marginTop: spacing.sm + 2, overflow: 'hidden' },
  historyRow: {
    paddingVertical: spacing.md, paddingHorizontal: spacing.lg,
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.hairline,
  },
  dot: { width: 6, height: 6, borderRadius: 99 },
  historyWhere: { flex: 1, ...typography.callout, color: colors.textPrimary },
  historyEmpty: { ...typography.callout, color: colors.textTertiary },
  historyWhen: { ...typography.caption, color: colors.textTertiary },
  deleteBtn: {
    marginTop: spacing.xxl + 2, alignSelf: 'center',
    paddingVertical: spacing.sm + 2, paddingHorizontal: spacing.md,
  },
  deleteText: { ...typography.callout, color: colors.danger },
});
