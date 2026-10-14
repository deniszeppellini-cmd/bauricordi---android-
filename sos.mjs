const clean = (value, max = 2000) => typeof value === 'string' && value.length <= max;
export function validateSosReport(report, dogIds) {
  if (!report || !clean(report.id, 80) || !dogIds.has(report.dogId) ||
      !clean(report.area, 160) || !report.area.trim() || !clean(report.when, 160) || !report.when.trim() ||
      !clean(report.contact, 160) || !report.contact.trim() || !clean(report.description) ||
      !['missing', 'found'].includes(report.status) || !Number.isFinite(Date.parse(report.createdAt))) {
    throw new Error('Annuncio SOS non valido. Inserisci luogo, data e ora, e un recapito.');
  }
  return report;
}
export function vetSearchUrl(area) {
  if (!clean(area, 160) || !area.trim()) throw new Error('Inserisci la città o la zona in cui cercare.');
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`pronto soccorso veterinario ${area.trim()}`)}`;
}
export function phoneUrl(phone) {
  const number = String(phone || '').trim().replace(/[\s().-]/g, '');
  if (!/^\+?[0-9]{5,15}$/.test(number)) throw new Error('Inserisci un numero di telefono valido nel Profilo.');
  return `tel:${number}`;
}
export function reportText(report, dog) {
  validateSosReport(report, new Set([dog.id]));
  return [report.status === 'found' ? 'RITROVATO · Aggiornamento Bauricordi' : 'CANE SMARRITO · SOS Bauricordi',
    `Nome: ${dog.name}`, dog.breed ? `Razza: ${dog.breed}` : '',
    `Ultimo avvistamento: ${report.area}`, `Data e ora: ${report.when}`,
    report.description ? `Segni particolari e informazioni: ${report.description}` : '',
    `Contatto del proprietario: ${report.contact}`,
    report.status === 'found' ? 'Il cane è stato ritrovato. Grazie per l’aiuto! Condividi questo aggiornamento.' : 'Se lo avvisti, contatta il proprietario indicando luogo e orario.'
  ].filter(Boolean).join('\n');
}
