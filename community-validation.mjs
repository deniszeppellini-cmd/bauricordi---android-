export const cityKey = value => String(value||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase().replace(/\s+/g,' ');
export function validateCommunityPayload(value) {
 const text=(k,max,required=false)=>typeof value?.[k]==='string'&&value[k].length<=max&&(!required||value[k].trim().length>0);
 for(const [k,max,required] of [['localId',80,true],['city',80,true],['dogName',80,true],['breed',160,false],['area',160,true],['lastSeen',160,true],['contact',160,true],['description',2000,false]]){
  if(!text(k,max,required))throw new Error('Completa luogo, data, recapito e zona dell’annuncio.');
 }
 if(cityKey(value.city).length<2)throw new Error('Inserisci una città o zona valida.');
 if(value.consent!==true)throw new Error('Conferma la pubblicazione dei dati dell’annuncio.');
 if(value.photoData!=null&&(!/^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(value.photoData)||value.photoData.length>220000))throw new Error('Foto troppo grande o non valida.');
 return {...value,city:cityKey(value.city)};
}
export function isRomeWeekend(now=Date.now()) {
 const day=new Intl.DateTimeFormat('en-US',{timeZone:'Europe/Rome',weekday:'short'}).format(new Date(now));
 return day==='Sat'||day==='Sun';
}
export const VET_DUTY={
 title:'Reperibilità veterinaria · Bolzano e dintorni',
 phone:'0471080808',
 label:'Centro di contatto regionale della Croce Rossa',
 hours:'Sabato e domenica, in collaborazione con le cliniche veterinarie dell’area di Bolzano.',
 area:'Bolzano, Merano, Val Venosta e Bressanone',
 source:'https://www.tieraerztekammer.com/it/download/reperibilita-veterinari-per-animali-daffezione-bolzano/',
 checkedAt:'2026-10-15',
};
