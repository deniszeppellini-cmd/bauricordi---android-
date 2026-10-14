import { validateSosReport } from './sos.mjs';
export const FREE_MEMORY_LIMIT = 20;
export const SCHEMA_VERSION = 1;
export const makeId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
export const newDog = (name = 'Il mio cane') => ({ id: makeId(), name, breed: '', birthday: '', vet: '', phone: '', notes: '', photo: null });
export function initialState() {
  const dog = newDog('Maia');
  return { schema: SCHEMA_VERSION, dogs: [dog], activeDogId: dog.id, memories: [], reminders: [], missions: [], chat: [], sosReports: [] };
}
export function validateState(value) {
  if (!value || value.schema !== SCHEMA_VERSION || !Array.isArray(value.dogs) || !value.dogs.length || value.dogs.length > 100) throw new Error('File Bauricordi non valido.');
  const text = (v, n = 2000) => typeof v === 'string' && v.length <= n;
  const ids = new Set();
  for (const dog of value.dogs) {
    if (!text(dog.id, 80) || !text(dog.name, 80) || !dog.name.trim() || ids.has(dog.id)) throw new Error('Profilo cane non valido.');
    ids.add(dog.id);
    for (const k of ['breed', 'birthday', 'vet', 'phone', 'notes']) if (!text(dog[k] ?? '')) throw new Error('Dati del profilo non validi.');
    if (dog.photo != null && !text(dog.photo, 1000)) throw new Error('Foto del profilo non valida.');
  }
  for (const key of ['memories', 'reminders', 'missions', 'chat']) if (!Array.isArray(value[key]) || value[key].length > 10000) throw new Error('Archivio non valido.');
  for (const memory of value.memories) {
    if (!text(memory.id, 80) || !ids.has(memory.dogId) || !text(memory.title, 160) || !memory.title.trim() || !text(memory.note) || !Number.isFinite(Date.parse(memory.date)) || (memory.photo != null && !text(memory.photo, 1000))) throw new Error('Ricordo non valido.');
  }
  for (const rem of value.reminders) {
    if (!text(rem.id, 80) || !ids.has(rem.dogId) || !text(rem.title, 160) || !rem.title.trim() || !text(rem.note) || !Number.isFinite(Date.parse(rem.date)) || typeof rem.done !== 'boolean' || (rem.notificationId != null && !text(rem.notificationId, 200))) throw new Error('Promemoria non valido.');
  }
  for (const message of value.chat) if (!['user', 'assistant'].includes(message.role) || !text(message.text, 8000) || !ids.has(message.dogId)) throw new Error('Conversazione non valida.');
  for (const mission of value.missions) if (!ids.has(mission.dogId) || !Number.isInteger(mission.index) || mission.index < 0 || mission.index > 8) throw new Error('Missione non valida.');
  if (value.sosReports !== undefined) {
    if (!Array.isArray(value.sosReports) || value.sosReports.length > 1000) throw new Error('Archivio SOS non valido.');
    const reportIds = new Set();
    for (const report of value.sosReports) {
      validateSosReport(report, ids);
      if (reportIds.has(report.id)) throw new Error('Annuncio SOS duplicato.');
      reportIds.add(report.id);
    }
  }
  if (!ids.has(value.activeDogId)) throw new Error('Profilo attivo non valido.');
  return value;
}
export function nextReminders(state, dogId, now = Date.now()) {
  return state.reminders.filter(r => r.dogId === dogId && !r.done && Date.parse(r.date) > now).sort((a, b) => Date.parse(a.date) - Date.parse(b.date));
}
export function canAddMemory(state, premium) { return premium || state.memories.length < FREE_MEMORY_LIMIT; }
export const hasPremiumEntitlement = (info, now = Date.now()) => {
  const entitlement = info?.entitlements?.active?.premium;
  return Boolean(entitlement?.isActive && (!entitlement.expirationDate || Date.parse(entitlement.expirationDate) > now));
};
export function escapeHtml(value = '') { return String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
export const MISSIONS = [
  ['Il nostro primo piano', 'Scatta un ritratto del tuo cane e scrivi tre cose che ami di lui.'],
  ['Passeggiata da ricordare', 'Racconta una passeggiata speciale, al ritmo del tuo cane.'],
  ['La faccia buffa', 'Cattura un’espressione che ti fa sorridere.'],
  ['Il posto del cuore', 'Fotografa il suo angolino preferito.'],
  ['Una piccola conquista', 'Racconta qualcosa di nuovo che avete imparato insieme.'],
  ['Gli amici di zampa', 'Conserva un incontro tranquillo con un amico.'],
  ['Il nostro rituale', 'Scrivi il piccolo gesto che ripetete ogni giorno.'],
  ['Un giorno insieme', 'Dedica una pagina a una giornata semplice ma felice.'],
  ['Lettera al mio cane', 'Scrivigli cosa ha cambiato nella tua vita.'],
];
export function localBauri(question, state, dog, now = Date.now()) {
  const q = question.toLowerCase();
  const next = nextReminders(state, dog.id, now);
  const memories = state.memories.filter(m => m.dogId === dog.id);
  if (/veterin|farmac|dose|vomit|diarrea|malat|dolor|sangue|respir|vaccin|aliment|mangiar/.test(q)) return 'Per salute, farmaci e alimentazione personalizzata serve il veterinario. Posso aiutarti a raccogliere le informazioni da riferirgli e a creare un promemoria, ma non fare diagnosi o indicare dosi. Il contatto che hai salvato è: ' + (dog.vet || 'nessun veterinario ancora inserito') + (dog.phone ? `, ${dog.phone}.` : '.');
  if (/promem|appunt|prossim|scadenz|agenda/.test(q)) return next.length ? `Il prossimo appuntamento di ${dog.name} è “${next[0].title}”, il ${new Date(next[0].date).toLocaleString('it-IT')}.${next[0].note ? ` Nota: ${next[0].note}` : ''} Lo trovi nella sezione Promemoria.` : `${dog.name} non ha promemoria futuri. Puoi aggiungerne uno con data, ora e una nota nella sezione Promemoria.`;
  if (/ricord|diario|riassunt|album/.test(q)) return `Hai conservato ${memories.length} ricordi di ${dog.name}. ` + (memories.length ? `L’ultimo è “${[...memories].sort((a,b)=>Date.parse(b.date)-Date.parse(a.date))[0].title}”. ` : '') + 'Puoi aggiungere foto e una piccola storia in Ricordi. Con Premium puoi creare l’album PDF.';
  if (/mission|idea|divert|gioco|oggi/.test(q)) {
    const complete = state.missions.filter(m => m.dogId === dog.id).map(m => m.index);
    const index = MISSIONS.findIndex((_, i) => !complete.includes(i));
    return index < 0 ? 'Avete completato tutte le nove missioni! Scegli un ricordo e scrivi cosa lo rende speciale.' : `Una missione per voi: “${MISSIONS[index][0]}”. ${MISSIONS[index][1]} La trovi nella Home.`;
  }
  if (/profil|razza|nome|scheda|sitter/.test(q)) return `${dog.name}${dog.breed ? ` è ${dog.breed}` : ' ha il profilo pronto da completare'}. ${dog.notes ? `Le tue note: ${dog.notes}` : 'Aggiungi abitudini e informazioni utili nel Profilo.'} Puoi anche condividere la scheda Dog Sitter.`;
  return `Ciao! Sono Bauri, l’assistente locale di ${dog.name}. Posso leggere i tuoi promemoria, riassumere il diario e proporti una delle nove missioni. Prova: “Qual è il prossimo appuntamento?” oppure “Dammi una missione”. L’IA online non è attiva in questa versione.`;
}
