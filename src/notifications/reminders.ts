import { Platform } from 'react-native';
import type { MediaItem } from '../media/types';
import { onThisDay } from '../collections';

/**
 * "On this day" reminders: one LOCAL notification per day (no push, no server),
 * only on days that actually have memories from past years. We schedule the next
 * two weeks whenever the library index or the setting changes, so the body can
 * carry the real count for that day. Everything stays on the device.
 */

const DAYS_AHEAD = 14;
const CATEGORY = 'on-this-day';

/** Deep-link target carried in the notification payload. */
export const ON_THIS_DAY_URL = '/swipe?kind=on-this-day';

type Texts = { title: string; body: (count: number) => string };

async function mod() {
  if (Platform.OS === 'web') return null;
  return import('expo-notifications');
}

export async function getReminderPermission(): Promise<'granted' | 'denied' | 'undetermined'> {
  const N = await mod();
  if (!N) return 'denied';
  try {
    const p = await N.getPermissionsAsync();
    if (p.granted) return 'granted';
    return p.canAskAgain ? 'undetermined' : 'denied';
  } catch {
    return 'denied';
  }
}

export async function requestReminderPermission(): Promise<boolean> {
  const N = await mod();
  if (!N) return false;
  try {
    const p = await N.requestPermissionsAsync({ ios: { allowAlert: true, allowBadge: false, allowSound: true } });
    return p.granted;
  } catch {
    return false;
  }
}

/** Show reminders even while the app is in the foreground (quietly, no badge). */
export async function installForegroundHandler(): Promise<void> {
  const N = await mod();
  if (!N) return;
  try {
    N.setNotificationHandler({
      handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
    });
  } catch {
    /* unsupported platform */
  }
}

export async function cancelReminders(): Promise<void> {
  const N = await mod();
  if (!N) return;
  try {
    await N.cancelAllScheduledNotificationsAsync();
  } catch {
    /* nothing scheduled */
  }
}

/**
 * Re-plan the next DAYS_AHEAD days at `hour`:00 local time. Days with nothing from
 * past years get no notification at all. Idempotent: clears previous plans first.
 */
export async function scheduleReminders(items: MediaItem[], hour: number, texts: Texts, now = new Date()): Promise<number> {
  const N = await mod();
  if (!N) return 0;
  await cancelReminders();
  let scheduled = 0;
  for (let d = 0; d < DAYS_AHEAD; d++) {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + d, hour, 0, 0, 0);
    if (day.getTime() <= now.getTime()) continue; // today's slot already passed
    const count = onThisDay(items, day).length;
    if (count === 0) continue;
    try {
      await N.scheduleNotificationAsync({
        content: { title: texts.title, body: texts.body(count), data: { url: ON_THIS_DAY_URL }, categoryIdentifier: CATEGORY, sound: false },
        trigger: { type: N.SchedulableTriggerInputTypes.DATE, date: day },
      });
      scheduled++;
    } catch {
      /* scheduling limit or platform error: the remaining days are simply not planned */
    }
  }
  return scheduled;
}

/** The URL of the notification the user tapped to open the app, if any (consumed once). */
export async function consumeLaunchUrl(): Promise<string | null> {
  const N = await mod();
  if (!N) return null;
  try {
    const r = await N.getLastNotificationResponseAsync();
    const url = r?.notification.request.content.data?.url;
    return typeof url === 'string' ? url : null;
  } catch {
    return null;
  }
}

/** Subscribe to notification taps while the app is running. Returns unsubscribe. */
export function onReminderOpened(cb: (url: string) => void): () => void {
  let sub: { remove: () => void } | null = null;
  let cancelled = false;
  void mod().then((N) => {
    if (!N || cancelled) return;
    try {
      sub = N.addNotificationResponseReceivedListener((r) => {
        const url = r.notification.request.content.data?.url;
        if (typeof url === 'string') cb(url);
      });
    } catch {
      /* unsupported */
    }
  });
  return () => {
    cancelled = true;
    sub?.remove();
  };
}
