import test from 'node:test';
import assert from 'node:assert/strict';
import {cityKey,validateCommunityPayload,isRomeWeekend,VET_DUTY} from './community-validation.mjs';
const valid=()=>({localId:'local-1',city:'Bolzano',dogName:'Maia',breed:'',area:'Parco',lastSeen:'15 ottobre, ore 18',contact:'recapito proprietario',description:'Collare rosso',photoData:null,consent:true});
test('zone normalization preserves boundaries and accents are comparable',()=>{assert.equal(cityKey('  Bólzano  Centro '),'bolzano centro');assert.notEqual(cityKey('Bolzano'),cityKey('Merano'));});
test('cloud publishing requires explicit consent, complete fields and bounded photos',()=>{
 assert.equal(validateCommunityPayload(valid()).city,'bolzano');
 for(const patch of [{consent:false},{contact:''},{city:'x'},{photoData:'file:///private/photo'},{photoData:'data:image/jpeg;base64,'+'A'.repeat(220000)},{dogName:'x'.repeat(81)}])assert.throws(()=>validateCommunityPayload({...valid(),...patch}));
});
test('weekend labels use Italian local time across UTC boundary',()=>{
 assert.equal(isRomeWeekend('2026-10-16T22:30:00Z'),true);assert.equal(isRomeWeekend('2026-10-18T22:30:00Z'),false);assert.equal(isRomeWeekend('2026-10-15T12:00:00Z'),false);
 assert.equal(VET_DUTY.phone,'0471080808');assert.equal(new URL(VET_DUTY.source).hostname,'www.tieraerztekammer.com');
});
