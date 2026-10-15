import 'react-native-url-polyfill/auto';
import { AppState } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { createClient, processLock } from '@supabase/supabase-js';
import { cityKey, validateCommunityPayload } from './community-validation.mjs';
const URL='https://ogbijrcxtcrcodczswoy.supabase.co';
const KEY='sb_publishable_JvwboSElui8bgJS9p1kL7A_rFW7F2qo';
// Chunk large sessions for platform Keychain limits. A backup never contains the session.
const secureStorage={
 async getItem(key){const count=Number(await SecureStore.getItemAsync(key+'.count')||0);if(!count)return null;const chunks=await Promise.all(Array.from({length:count},(_,i)=>SecureStore.getItemAsync(key+'.'+i)));return chunks.every(x=>x!==null)?chunks.join(''):null;},
 async setItem(key,value){const old=Number(await SecureStore.getItemAsync(key+'.count')||0),parts=value.match(/[\s\S]{1,1500}/g)||[];for(let i=0;i<parts.length;i++)await SecureStore.setItemAsync(key+'.'+i,parts[i]);await SecureStore.setItemAsync(key+'.count',String(parts.length));for(let i=parts.length;i<old;i++)await SecureStore.deleteItemAsync(key+'.'+i);},
 async removeItem(key){const count=Number(await SecureStore.getItemAsync(key+'.count')||0);await SecureStore.deleteItemAsync(key+'.count');for(let i=0;i<count;i++)await SecureStore.deleteItemAsync(key+'.'+i);}
};
export const cloud=createClient(URL,KEY,{auth:{storage:secureStorage,autoRefreshToken:true,persistSession:true,detectSessionInUrl:false,lock:processLock}});
AppState.addEventListener('change',state=>state==='active'?cloud.auth.startAutoRefresh():cloud.auth.stopAutoRefresh());
export async function cloudUser(){const {data,error}=await cloud.auth.getUser();if(error||!data.user)throw new Error('Accedi alla comunità per pubblicare un annuncio.');return data.user;}
export async function subscribeZone(city,environment,enabled){
 const user=await cloudUser(),key=cityKey(city);if(enabled&&key.length<2)throw new Error('Inserisci la città o zona.');
 const {data,error}=await cloud.from('bauri_subscriptions').upsert({user_id:user.id,environment,city_key:key,enabled},{onConflict:'user_id,environment'}).select().single();if(error)throw error;return data;
}
export async function publishCloudReport(report,dog,city,environment,photoData){
 const user=await cloudUser();const value=validateCommunityPayload({localId:report.id,city,dogName:dog.name,breed:dog.breed||'',area:report.area,lastSeen:report.when,contact:report.contact,description:report.description||'',photoData,consent:true});
 const {data:existing,error:readError}=await cloud.from('bauri_alerts').select('*').eq('owner_id',user.id).eq('local_id',report.id).maybeSingle();if(readError)throw readError;if(existing)return existing;
 const {data,error}=await cloud.from('bauri_alerts').insert({owner_id:user.id,local_id:value.localId,environment,city_key:value.city,dog_name:value.dogName,breed:value.breed,area:value.area,last_seen:value.lastSeen,contact:value.contact,description:value.description,photo_data:value.photoData}).select().single();if(error)throw error;return data;
}
export async function closeCloudReport(id,status='found'){
 const {data,error}=await cloud.from('bauri_alerts').update({status}).eq('id',id).select('id,status').maybeSingle();if(error)throw error;if(!data)throw new Error('Accedi con l’account che ha pubblicato l’annuncio.');return data;
}
export async function zoneAlerts(city,environment){
 const {data,error}=await cloud.from('bauri_alerts').select('*').eq('city_key',cityKey(city)).eq('environment',environment).in('status',['missing','found']).gt('expires_at',new Date().toISOString()).order('created_at',{ascending:false}).limit(100);if(error)throw error;return data;
}
