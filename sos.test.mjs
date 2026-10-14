import test from 'node:test';
import assert from 'node:assert/strict';
import { validateState, initialState } from './domain.mjs';
import { phoneUrl, vetSearchUrl, reportText } from './sos.mjs';
const fixture = () => { const state = initialState(); const report = {id:'report-1',dogId:state.activeDogId,area:'Bolzano, Parco',when:'15 ottobre, 18:30',contact:'+39 333 1234567',description:'Collare rosso',status:'missing',createdAt:'2026-10-15T16:30:00Z'}; return {state,report}; };
test('old backups remain readable, SOS reports survive state validation',()=>{
 const {state,report}=fixture();delete state.sosReports;assert.equal(validateState(state),state);
 state.sosReports=[report];assert.equal(validateState(JSON.parse(JSON.stringify(state))).sosReports[0].contact,report.contact);
});
test('reject invalid announcements and foreign dog references',()=>{
 for(const patch of [{area:''},{contact:''},{when:''},{status:'sent'},{dogId:'other'},{createdAt:'invalid'},{description:'a'.repeat(2001)}]){
  const {state,report}=fixture();state.sosReports=[{...report,...patch}];assert.throws(()=>validateState(state));
 }
 const {state,report}=fixture();state.sosReports=[report,report];assert.throws(()=>validateState(state));
});
test('safe phone and map URLs',()=>{
 assert.equal(phoneUrl('+39 (0471) 123-456'),'tel:+390471123456');
 for(const phone of ['tel:123456','12345#12','abc',''])assert.throws(()=>phoneUrl(phone));
 const url=new URL(vetSearchUrl('Bolzano & centro'));assert.equal(url.searchParams.get('query'),'pronto soccorso veterinario Bolzano & centro');
 assert.throws(()=>vetSearchUrl(' '));
});
test('announcements distinguish lost and found and include owner contact',()=>{
 const {state,report}=fixture(),dog=state.dogs[0];const lost=reportText(report,dog);
 assert.match(lost,/CANE SMARRITO/);assert.ok(lost.includes(report.area));assert.ok(lost.includes(report.contact));
 assert.match(reportText({...report,status:'found'},dog),/^RITROVATO/);
 assert.throws(()=>reportText(report,{...dog,id:'other'}));
});
