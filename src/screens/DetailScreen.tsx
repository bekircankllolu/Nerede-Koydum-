import React from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown, useReducedMotion } from 'react-native-reanimated';
import { colors, motion, radii, spacing, surfaces, typography } from '../theme';
import { useDepo } from '../state/DepoContext';
import { PrimaryButton, SecondaryButton } from '../components/common';
import { PhotoIcon, StarIcon } from '../components/icons';

const AnimatedSafeArea = Animated.createAnimatedComponent(SafeAreaView);

export default function DetailScreen() {
  const {
    detail, closeDetail, toggleFav, openMove, confirmLoc, deleteItem, openEditForm, markLost, openFoundSheet,
  } = useDepo();
  const reduced = useReducedMotion();
  const d = detail();
  if (!d) return null;

  // Overlays are conditionally mounted, so an entering animation is enough —
  // there is no exit frame to animate against.
  const entering = reduced
    ? FadeIn.duration(motion.duration.fast)
    : FadeInDown.duration(motion.duration.normal).withInitialValues({ transform: [{ translateY: 8 }] });

  const onDelete = () => {
    Alert.alert('Bu kaydı silmek istediğine emin misin?', d.name + ' kalıcı olarak silinecek.', [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: deleteItem },
    ]);
  };

  const onMarkLost = () => {
    Alert.alert(
      `${d.name}'i kayıp olarak işaretlemek istiyor musun?`,
      'Son bilinen konumu Kayıplar bölümünde saklarız.',
      [
        { text: 'Vazgeç', style: 'cancel' },
        { text: 'Kayıp olarak işaretle', style: 'destructive', onPress: markLost },
      ]
    );
  };

  return (
    <AnimatedSafeArea style={styles.root} edges={['top', 'bottom']} entering={entering}>
      <View style={styles.header}>
        <Pressable onPress={closeDetail} hitSlop={8}>
          <Text style={styles.back}>‹ Geri</Text>
        </Pressable>
        <Pressable onPress={openEditForm} hitSlop={8} accessibilityRole="button" accessibilityLabel="Eşyayı düzenle">
          <Text style={styles.edit}>Düzenle</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {d.item.photoUri ? (
          <Image source={{ uri: d.item.photoUri }} style={styles.photo} resizeMode="cover" />
        ) : (
          <View style={styles.photoPlaceholder}>
            <PhotoIcon />
            <Text style={styles.photoPlaceholderText}>Fotoğraf eklenmedi</Text>
          </View>
        )}

        <View style={styles.nameRow}>
          <Text style={styles.name}>{d.name}</Text>
          <Pressable
            onPress={toggleFav}
            hitSlop={10}
            style={styles.favBtn}
            accessibilityRole="button"
            accessibilityLabel={d.item.fav ? 'Favorilerden çıkar' : 'Favoriye ekle'}
          >
            <StarIcon size={24} color={d.item.fav ? colors.favorite : colors.textTertiary} filled={d.item.fav} />
          </Pressable>
        </View>

        <View style={styles.locCard}>
          <Text style={styles.locLabel}>{d.isLost ? 'Son bilinen konum' : 'Bulunduğu yer'}</Text>
          <View style={styles.locLines}>
            <Text style={styles.locPrimary}>{d.lines[0]}</Text>
            {d.lines.length > 1 ? (
              <Text style={styles.locPath}>{d.lines.slice(1).join('  ›  ')}</Text>
            ) : null}
          </View>
          {d.isLost ? (
            <Text style={styles.lostLine}>{d.lostDaysLabel}</Text>
          ) : (
            <Text style={styles.confirmed}>{d.confirmed}</Text>
          )}
          {!d.isLost ? (
            <View style={styles.locActions}>
              <PrimaryButton label="Yerini değiştir" onPress={openMove} style={{ flex: 1, height: 52 }} />
              <SecondaryButton label="Konumu doğrula" onPress={confirmLoc} style={{ flex: 1, backgroundColor: colors.indigoLight }} />
            </View>
          ) : null}
        </View>

        {d.isLost ? (
          <Pressable style={styles.foundBtn} onPress={openFoundSheet} accessibilityRole="button" accessibilityLabel="Buldum">
            <Text style={styles.foundBtnText}>Buldum</Text>
          </Pressable>
        ) : (
          <Pressable onPress={onMarkLost} style={styles.markLostBtn} accessibilityRole="button" accessibilityLabel="Kayıp olarak işaretle">
            <Text style={styles.markLostText}>Kayıp olarak işaretle</Text>
          </Pressable>
        )}

        {d.note ? (
          <View style={styles.noteCard}>
            <Text style={styles.noteLabel}>NOT</Text>
            <Text style={styles.noteText}>{d.note}</Text>
          </View>
        ) : null}

        <Text style={styles.historyLabel}>Geçmiş</Text>
        <View style={styles.historyCard}>
          {d.history.map((h, i) => (
            <View key={i} style={[styles.historyRow, i === d.history.length - 1 && { borderBottomWidth: 0 }]}>
              <View style={[styles.dot, { backgroundColor: h.dot }]} />
              <Text style={styles.historyWhere}>{h.where}</Text>
              <Text style={styles.historyWhen}>{h.when}</Text>
            </View>
          ))}
        </View>

        <Pressable onPress={onDelete} style={styles.deleteBtn} accessibilityRole="button" accessibilityLabel="Kaydı sil">
          <Text style={styles.deleteText}>Kaydı sil</Text>
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
  photo: { borderRadius: radii.lg, height: 190, backgroundColor: colors.photoPlaceholderBg },
  photoPlaceholder: {
    borderRadius: radii.lg, height: 190, backgroundColor: colors.photoPlaceholderBg,
    borderWidth: 1, borderStyle: 'dashed', borderColor: colors.photoPlaceholderBorder,
    alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  photoPlaceholderText: { ...typography.caption, color: colors.textWarm2 },
  nameRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginVertical: spacing.lg, gap: spacing.sm + 2,
  },
  name: { flex: 1, ...typography.title1, fontSize: 28, lineHeight: 34, color: colors.textPrimary },
  favBtn: { padding: 2 },
  // The one real hero surface on this screen — this is the answer the user
  // opened the app for, so it keeps its elevation.
  locCard: { ...surfaces.hero, padding: spacing.xxl - 2, gap: spacing.md + 2 },
  locLabel: { ...typography.overline, color: colors.textSecondary, textTransform: 'uppercase' },
  locLines: { gap: spacing.xs },
  locPrimary: { ...typography.title2, color: colors.textPrimary },
  locPath: { ...typography.headline, color: colors.textSecondary },
  confirmed: { ...typography.footnote, color: colors.accent },
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
    paddingVertical: spacing.md + 2, paddingHorizontal: spacing.lg,
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.hairline,
  },
  dot: { width: 8, height: 8, borderRadius: 99 },
  historyWhere: { flex: 1, ...typography.callout, color: colors.textPrimary },
  historyWhen: { ...typography.footnote, color: colors.textTertiary },
  deleteBtn: {
    marginTop: spacing.xxl + 2, alignSelf: 'center',
    paddingVertical: spacing.sm + 2, paddingHorizontal: spacing.md,
  },
  deleteText: { ...typography.callout, color: colors.danger },
});
