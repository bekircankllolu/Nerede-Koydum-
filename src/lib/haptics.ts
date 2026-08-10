import * as Haptics from 'expo-haptics';

// Single place that decides what each kind of feedback feels like, so the
// same class of interaction is consistent across screens. Every call is
// fire-and-forget: haptics are never worth failing a user action over.
//
// Note: ItemRow's swipe keeps calling expo-haptics directly. Its armed /
// commit feedback is tuned against the gesture's own thresholds and is
// deliberately not routed through here.
export const haptics = {
  /** Light tap: chips, toggles, list-level favourite. */
  light() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  },
  /** Tab bar and picker selection changes. */
  selection() {
    Haptics.selectionAsync().catch(() => {});
  },
  /** A save/confirm that completed. */
  success() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  },
  /** A destructive action actually going through. */
  warning() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
  },
};
