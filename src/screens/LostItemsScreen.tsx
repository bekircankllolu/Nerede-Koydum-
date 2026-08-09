import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, radii } from '../theme';
import { useDepo } from '../state/DepoContext';
import { daysBetween } from '../lib/search';
import ItemRow from '../components/ItemRow';
import EmptyState from '../components/EmptyState';
import { PlusIcon } from '../components/icons';

export default function LostItemsScreen() {
  const { lostItems, card, openLostForm } = useDepo();
  const now = Date.now();

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Kayıp Eşyalar</Text>
          <Text style={styles.subtitle}>Bulamadığın eşyaları burada takip et.</Text>
        </View>
        <Pressable
          onPress={openLostForm}
          style={styles.reportBtn}
          accessibilityRole="button"
          accessibilityLabel="Kayıp bildir"
        >
          <PlusIcon size={14} />
          <Text style={styles.reportBtnText}>Kayıp bildir</Text>
        </Pressable>
      </View>

      {lostItems.length === 0 ? (
        <EmptyState
          title="Harika, şu an kayıp eşyan yok."
          body="Bir şeyi bulamazsan burada takip edebilirsin."
          ctaLabel="Kayıp bildir"
          onPress={openLostForm}
        />
      ) : (
        <View style={{ marginTop: 6, gap: 10 }}>
          {lostItems.map((it) => {
            const c = card(it);
            const days = Math.max(0, daysBetween(it.lostAt || it.updatedAt, now));
            const ageLabel = days === 0 ? 'bugün kayıp' : days === 1 ? '1 gündür kayıp' : `${days} gündür kayıp`;
            return (
              <ItemRow
                key={it.id}
                initial={c.initial}
                name={c.name}
                subtitle={c.fullLoc}
                onPress={c.open}
                rightLabel={ageLabel}
                colorKey={c.colorKey}
                showChevron
              />
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 100 },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  title: { fontWeight: '700', fontSize: 30, letterSpacing: -0.7, color: colors.textPrimary },
  subtitle: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },
  reportBtn: {
    marginTop: 4, height: 36, paddingHorizontal: 14, borderRadius: radii.pill, backgroundColor: colors.indigo,
    flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  reportBtnText: { color: '#fff', fontWeight: '600', fontSize: 13.5 },
});
