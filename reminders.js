import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
Notifications.setNotificationHandler({ handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }) });
export async function requestReminderPermission() {
  if (Platform.OS === 'android') await Notifications.setNotificationChannelAsync('reminders', { name: 'Promemoria Bauricordi', importance: Notifications.AndroidImportance.HIGH, sound: 'default' });
  const current = await Notifications.getPermissionsAsync();
  const result = current.granted ? current : await Notifications.requestPermissionsAsync();
  return result.granted || result.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
}
export async function scheduleReminder(reminder, dogName) {
  if (Date.parse(reminder.date) <= Date.now()) throw new Error('Scegli una data e un’ora future.');
  if (!await requestReminderPermission()) return null;
  return Notifications.scheduleNotificationAsync({
    content: { title: `${dogName}: ${reminder.title}`, body: reminder.note || 'Un appuntamento da ricordare con Bauricordi.', sound: 'default', data: { page: 'Promemoria', dogId: reminder.dogId, reminderId: reminder.id } },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(reminder.date), channelId: 'reminders' },
  });
}
export async function cancelReminder(id) { if (id) await Notifications.cancelScheduledNotificationAsync(id); }
export async function notificationTest(dogName) {
  if (!await requestReminderPermission()) throw new Error('Le notifiche sono disattivate. Abilitale nelle impostazioni del telefono.');
  return Notifications.scheduleNotificationAsync({ content: { title: `Bauricordi · ${dogName}`, body: 'Questo è il testo del promemoria: le notifiche sono attive.', sound: 'default' }, trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 10, channelId: 'reminders' } });
}
export { Notifications };
