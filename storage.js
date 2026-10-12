import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FS from 'expo-file-system/legacy';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { initialState, validateState, makeId } from './domain.mjs';
const KEY = 'bauricordi-state-v1';
const ROOT = `${FS.documentDirectory}bauricordi/`;
let writes = Promise.resolve();
export async function loadState() {
  const text = await AsyncStorage.getItem(KEY);
  return text ? validateState(JSON.parse(text)) : initialState();
}
export function saveState(state) {
  validateState(state);
  const text = JSON.stringify(state);
  const write = writes.catch(() => {}).then(() => AsyncStorage.setItem(KEY, text));
  writes = write;
  return write;
}
export async function keepPhoto(uri, width = 1400) {
  await FS.makeDirectoryAsync(ROOT, { intermediates: true });
  const dest = `${ROOT}${makeId()}.jpg`;
  const normalized = await manipulateAsync(uri, [{ resize: { width: Math.min(width || 1400, 1400) } }], { compress: 0.7, format: SaveFormat.JPEG });
  await FS.copyAsync({ from: normalized.uri, to: dest });
  return dest;
}
export async function photoData(uri) {
  if (!uri) return '';
  try { return `data:image/jpeg;base64,${await FS.readAsStringAsync(uri, { encoding: FS.EncodingType.Base64 })}`; } catch { return ''; }
}
export async function createBackup(state) {
  const images = {};
  let length = 0;
  for (const row of [...state.dogs, ...state.memories]) {
    if (!row.photo || images[row.photo]) continue;
    const data = await FS.readAsStringAsync(row.photo, { encoding: FS.EncodingType.Base64 });
    length += data.length;
    if (length > 35 * 1024 * 1024) throw new Error('Il backup supera 35 MB. Esporta gli album PDF o riduci il numero di foto prima di creare un unico backup.');
    images[row.photo] = data;
  }
  const uri = `${FS.cacheDirectory}Bauricordi-backup.json`;
  await FS.writeAsStringAsync(uri, JSON.stringify({ format: 'bauricordi-backup', state, images }));
  return uri;
}
export async function readBackup(uri) {
  const file = await FS.getInfoAsync(uri);
  if (!file.exists || file.size > 40 * 1024 * 1024) throw new Error('Scegli un backup Bauricordi più piccolo di 40 MB.');
  const backup = JSON.parse(await FS.readAsStringAsync(uri));
  if (backup.format !== 'bauricordi-backup' || !backup.images || typeof backup.images !== 'object' || Array.isArray(backup.images)) throw new Error('Il file non è un backup Bauricordi.');
  const state = validateState(backup.state);
  const map = Object.create(null);
  await FS.makeDirectoryAsync(ROOT, { intermediates: true });
  for (const row of [...state.dogs, ...state.memories]) {
    if (!row.photo) continue;
    const old = row.photo;
    if (!map[old]) {
      const data = backup.images[old];
      if (typeof data !== 'string' || !/^[A-Za-z0-9+/]*={0,2}$/.test(data) || data.length > 8 * 1024 * 1024) throw new Error('Una foto del backup non è valida.');
      map[old] = `${ROOT}${makeId()}.jpg`;
      await FS.writeAsStringAsync(map[old], data, { encoding: FS.EncodingType.Base64 });
    }
    row.photo = map[old];
  }
  state.reminders = state.reminders.map(r => ({ ...r, notificationId: null }));
  return state;
}
