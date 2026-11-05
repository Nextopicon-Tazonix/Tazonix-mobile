import { Alert, Platform } from 'react-native';
import { ApiError } from '@/api/client';

export function notify(title: string, message?: string) {
  if (Platform.OS === 'web') globalThis.alert?.(message ? `${title}\n\n${message}` : title);
  else Alert.alert(title, message);
}

export function showError(e: unknown, title = 'Something went wrong') {
  const message = e instanceof ApiError || e instanceof Error ? e.message : String(e);
  notify(title, message);
}

export function confirm(title: string, message: string, onConfirm: () => void, confirmLabel = 'Confirm') {
  if (Platform.OS === 'web') {
    if (globalThis.confirm?.(`${title}\n\n${message}`)) onConfirm();
    return;
  }
  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    { text: confirmLabel, style: 'destructive', onPress: onConfirm },
  ]);
}
