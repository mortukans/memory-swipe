import * as Haptics from 'expo-haptics';

type Kind = 'keep' | 'remove' | 'light' | 'select';

/** Fire a subtle haptic, respecting the user's setting. Never throws (web no-op). */
export function haptic(kind: Kind, enabled: boolean): void {
  if (!enabled) return;
  try {
    if (kind === 'remove') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    else if (kind === 'keep' || kind === 'light') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    else void Haptics.selectionAsync();
  } catch {
    /* unsupported platform */
  }
}
