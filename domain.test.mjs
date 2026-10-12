import test from 'node:test';
import assert from 'node:assert/strict';
import { initialState, validateState, nextReminders, canAddMemory, hasPremiumEntitlement, escapeHtml, localBauri, MISSIONS } from './domain.mjs';
test('backup state survives serialization and malformed records are rejected',()=>{
 const state=initialState();assert.deepEqual(validateState(JSON.parse(JSON.stringify(state))),state);
 assert.throws(()=>validateState({...state,activeDogId:'unknown'}));
 assert.throws(()=>validateState({...state,dogs:[state.dogs[0],state.dogs[0]]}));
 assert.throws(()=>validateState({...state,reminders:[{id:'x',dogId:state.activeDogId,title:'x',note:'',date:'invalid',done:false}]}));
 assert.throws(()=>validateState({...state,memories:[{id:'x',dogId:'someone-else',title:'x',note:'',date:new Date().toISOString()}]}));
});
test('free limit blocks new records but premium allows them',()=>{const state=initialState();state.memories=Array(20).fill({});assert.equal(canAddMemory(state,false),false);assert.equal(canAddMemory(state,true),true);});
test('premium access requires verified entitlement and expires',()=>{
 const now=Date.parse('2026-10-13T10:00:00Z');
 assert.equal(hasPremiumEntitlement({premium:true},now),false);
 assert.equal(hasPremiumEntitlement({entitlements:{active:{premium:{isActive:true,expirationDate:'2026-10-12T10:00:00Z'}}}},now),false);
 assert.equal(hasPremiumEntitlement({entitlements:{active:{premium:{isActive:true,expirationDate:'2026-11-13T10:00:00Z'}}}},now),true);
 assert.equal(hasPremiumEntitlement({entitlements:{active:{premium:{isActive:false,expirationDate:null}}}},now),false);
});
test('next reminder excludes other dogs, completed and past appointments',()=>{
 const state=initialState(),id=state.activeDogId,now=1000;
 state.reminders=[{id:'late',dogId:id,date:new Date(3000).toISOString(),done:false},{id:'early',dogId:id,date:new Date(2000).toISOString(),done:false},{id:'past',dogId:id,date:new Date(500).toISOString(),done:false},{id:'done',dogId:id,date:new Date(1500).toISOString(),done:true},{id:'other',dogId:'other',date:new Date(1500).toISOString(),done:false}];
 assert.deepEqual(nextReminders(state,id,now).map(r=>r.id),['early','late']);
});
test('local assistant uses the selected dog and avoids prescribing',()=>{const state=initialState(),dog=state.dogs[0];assert.match(localBauri('Quale dose di farmaco?',state,dog),/non fare diagnosi o indicare dosi/);assert.match(localBauri('Cosa abbiamo in agenda?',state,dog),/non ha promemoria futuri/);assert.match(localBauri('Dammi una missione',state,dog),new RegExp(MISSIONS[0][0]));});
test('PDF text cannot inject markup',()=>{assert.equal(escapeHtml('<script>"&\'</script>'),'&lt;script&gt;&quot;&amp;&#39;&lt;/script&gt;');});
