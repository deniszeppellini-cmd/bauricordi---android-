import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
import * as domain from './domain.mjs';
async function fixture() {
 const context=vm.createContext({console,Promise,JSON,Object,Date,Math,Set});
 const values=new Map(),files=new Map();let fail=false;
 const mockStorage={getItem:async k=>values.get(k)??null,setItem:async(k,v)=>{if(fail){fail=false;throw new Error('Disk full');}values.set(k,v);}};
 const fs={documentDirectory:'file:///docs/',cacheDirectory:'file:///cache/',EncodingType:{Base64:'base64'},makeDirectoryAsync:async()=>{},copyAsync:async({from,to})=>{files.set(to,files.get(from)??'jpeg');},readAsStringAsync:async u=>{if(!files.has(u))throw new Error('Missing file');return files.get(u);},writeAsStringAsync:async(u,t)=>files.set(u,t),getInfoAsync:async u=>({exists:files.has(u),size:files.get(u)?.length??0})};
 const synth=(id,exports)=>new vm.SyntheticModule(Object.keys(exports),function(){for(const [key,value] of Object.entries(exports))this.setExport(key,value);},{context,identifier:id});
 const deps={'@react-native-async-storage/async-storage':synth('storage',{default:mockStorage}),'expo-file-system/legacy':synth('fs',fs),'expo-image-manipulator':synth('images',{SaveFormat:{JPEG:'jpeg'},manipulateAsync:async()=>({uri:'file:///cache/normalized.jpg'})}),'./domain.mjs':synth('domain',domain)};
 const module=new vm.SourceTextModule(await readFile(new URL('./storage.js',import.meta.url),'utf8'),{context});
 await module.link(id=>deps[id]);await module.evaluate();
 return {api:module.namespace,values,files,failNext:()=>{fail=true;}};
}
test('saved data reloads and a failed write does not poison later writes',async()=>{const f=await fixture(),state=domain.initialState();await f.api.saveState(state);f.failNext();await assert.rejects(f.api.saveState({...state,chat:[]}));const updated={...state,dogs:[{...state.dogs[0],name:'Argo'}]};await f.api.saveState(updated);assert.equal((await f.api.loadState()).dogs[0].name,'Argo');});
test('corrupt archive is rejected without overwriting it',async()=>{const f=await fixture();f.values.set('bauricordi-state-v1','broken');await assert.rejects(f.api.loadState());assert.equal(f.values.get('bauricordi-state-v1'),'broken');});
test('backup contains photos and restore relocates them and clears notification IDs',async()=>{
 const f=await fixture(),state=domain.initialState(),photo='file:///docs/photo.jpg';f.files.set(photo,'YWJjZA==');state.dogs[0].photo=photo;
 state.memories=[{id:'m',dogId:state.activeDogId,title:'Primo giorno',note:'Felice',date:'2026-10-13T10:00:00Z',photo}];
 state.reminders=[{id:'r',dogId:state.activeDogId,title:'Appuntamento',note:'Libretto',date:'2026-10-15T10:00:00Z',done:false,notificationId:'old-device-id'}];
 const uri=await f.api.createBackup(state);const restored=await f.api.readBackup(uri);
 assert.notEqual(restored.dogs[0].photo,photo);assert.equal(restored.dogs[0].photo,restored.memories[0].photo);assert.equal(f.files.get(restored.dogs[0].photo),'YWJjZA==');assert.equal(restored.reminders[0].notificationId,null);assert.equal(restored.memories[0].note,'Felice');
});
test('photo is normalized and copied outside cache',async()=>{const f=await fixture();const result=await f.api.keepPhoto('file:///temporary.jpg',2400);assert.match(result,/^file:\/\/\/docs\/bauricordi\//);assert.equal(f.files.has(result),true);});
