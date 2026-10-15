import React,{useEffect,useRef,useState} from 'react';
import {Alert,AppState,Image,ScrollView,StyleSheet,Text,TextInput,TouchableOpacity,View} from 'react-native';
import {manipulateAsync,SaveFormat} from 'expo-image-manipulator';
import {cloud,subscribeZone,publishCloudReport,closeCloudReport,zoneAlerts} from './community';
import {cityKey} from './community-validation.mjs';
const Button=({title,onPress,disabled})=><TouchableOpacity accessibilityRole="button" disabled={disabled} onPress={onPress} style={[s.button,disabled&&{opacity:.4}]}><Text style={s.buttonText}>{title}</Text></TouchableOpacity>;
export default function Community({dog,reports,premium,preview,onPublished,onClosed}){
 const environment=preview?'preview':'live';
 const [session,setSession]=useState(null),[email,setEmail]=useState(''),[password,setPassword]=useState(''),[city,setCity]=useState('Bolzano'),[subscription,setSubscription]=useState(null),[alerts,setAlerts]=useState([]),[busy,setBusy]=useState(false),[error,setError]=useState(''),[connection,setConnection]=useState('Non attivo');
 const alive=useRef(true),working=useRef(false);
 async function action(fn){if(working.current)return;working.current=true;setBusy(true);setError('');try{await fn();}catch(e){setError(e.message||'Servizio non raggiungibile. Riprova.');}finally{working.current=false;if(alive.current)setBusy(false);}}
 useEffect(()=>{alive.current=true;cloud.auth.getSession().then(({data})=>{if(alive.current)setSession(data.session);});const {data:{subscription:auth}}=cloud.auth.onAuthStateChange((_event,value)=>{setSession(value);if(!value){setAlerts([]);setSubscription(null);}});return()=>{alive.current=false;auth.unsubscribe();};},[]);
 useEffect(()=>{
  if(!session?.user)return;let active=true;
  cloud.from('bauri_subscriptions').select('*').eq('user_id',session.user.id).eq('environment',environment).maybeSingle().then(({data,error})=>{if(!active)return;if(error)setError(error.message);setSubscription(data);if(data)setCity(data.city_key);});
  return()=>{active=false;};
 },[session?.user?.id,environment]);
 async function reload(){if(!subscription?.enabled)return;const data=await zoneAlerts(subscription.city_key,environment);if(alive.current)setAlerts(data);}
 useEffect(()=>{
  if(!session?.user||!subscription?.enabled){setConnection('Non attivo');setAlerts([]);return;}
  let active=true;
  const refresh=()=>zoneAlerts(subscription.city_key,environment).then(rows=>{if(active)setAlerts(rows);}).catch(e=>{if(active)setError(e.message);});
  refresh();
  const channel=cloud.channel('bauri-zone-'+environment+'-'+cityKey(subscription.city_key)).on('postgres_changes',{event:'*',schema:'public',table:'bauri_alerts',filter:'city_key=eq.'+cityKey(subscription.city_key)},()=>{refresh();}).subscribe(status=>{
   if(active)setConnection(status==='SUBSCRIBED'?'In tempo reale':status==='CHANNEL_ERROR'||status==='TIMED_OUT'?'Connessione interrotta · riprova':'Connessione…');
  });
  const timer=setInterval(refresh,30000);const app=AppState.addEventListener('change',state=>{if(state==='active')refresh();});
  return()=>{active=false;clearInterval(timer);app.remove();cloud.removeChannel(channel);};
 },[session?.user?.id,subscription?.city_key,subscription?.enabled,environment]);
 async function authenticate(signup=false){await action(async()=>{
  if(!email.trim()||password.length<8)throw new Error('Inserisci email e password di almeno 8 caratteri.');
  const result=signup?await cloud.auth.signUp({email:email.trim(),password}):await cloud.auth.signInWithPassword({email:email.trim(),password});if(result.error)throw result.error;setPassword('');
  if(signup&&!result.data.session)Alert.alert('Conferma l’email','Apri il link nell’email di conferma, poi torna qui e premi Accedi.');
 });}
 function enable(){Alert.alert('Attivare la comunità?',`Il servizio conserverà il tuo account e la zona ${city.trim()}. Riceverai nell’app gli annunci pubblicati dagli iscritti in quella zona. Il diario e le altre foto restano sul telefono.`,[{text:'Annulla',style:'cancel'},{text:'Attiva',onPress:()=>action(async()=>{const value=await subscribeZone(city,environment,true);setSubscription(value);})}]);}
 function publish(report){if(!premium){setError('Attiva Premium o gli extra dell’anteprima per pubblicare.');return;}if(!subscription?.enabled){setError('Attiva prima la comunità nella zona scelta.');return;}
  Alert.alert('Pubblicare l’annuncio?',`Nome e foto di ${dog.name}, luogo, orario, descrizione e recapito saranno visibili agli iscritti alla comunità nella zona ${subscription.city_key} per massimo 14 giorni.`,[{text:'Annulla',style:'cancel'},{text:'Pubblica',onPress:()=>action(async()=>{
   let photo=null;if(dog.photo){const result=await manipulateAsync(dog.photo,[{resize:{width:500}}],{compress:.5,format:SaveFormat.JPEG,base64:true});photo='data:image/jpeg;base64,'+result.base64;if(photo.length>220000){const small=await manipulateAsync(dog.photo,[{resize:{width:300}}],{compress:.35,format:SaveFormat.JPEG,base64:true});photo='data:image/jpeg;base64,'+small.base64;}}
   const alert=await publishCloudReport(report,dog,subscription.city_key,environment,photo);await onPublished(report.id,alert.id);await reload();Alert.alert('Annuncio pubblicato','Gli iscritti con la comunità attiva nella stessa zona possono vederlo immediatamente nell’app. Le notifiche ad app chiusa non sono ancora configurate.');
  })}]);
 }
 function close(row,status){Alert.alert(status==='found'?'Cane ritrovato?':'Ritirare l’annuncio?',status==='found'?'Il recapito e la foto verranno rimossi dall’annuncio online.':'L’annuncio sarà rimosso dalla comunità.',[{text:'Annulla',style:'cancel'},{text:status==='found'?'Ritrovato':'Ritira',onPress:()=>action(async()=>{await closeCloudReport(row.id,status);await onClosed(row.id,status);await reload();})}]);}
 return <View style={s.card}><Text style={s.title}>Comunità SOS · {connection}</Text><Text style={s.text}>Avvisi immediati nell’app per la zona scelta. Le notifiche ad app chiusa richiedono ancora l’attivazione Android.</Text>{preview&&<Text style={s.note}>Comunità di anteprima: gli annunci sono separati dalla versione normale.</Text>}
 {!session?<><Text style={s.text}>Accedi o crea un account per scegliere chi può vedere gli annunci e gestire quelli che pubblichi.</Text><TextInput accessibilityLabel="Email comunità" autoCapitalize="none" keyboardType="email-address" autoCorrect={false} placeholder="Email" value={email} onChangeText={setEmail} style={s.input}/><TextInput accessibilityLabel="Password comunità" secureTextEntry autoCapitalize="none" autoCorrect={false} placeholder="Password (almeno 8 caratteri)" value={password} onChangeText={setPassword} style={s.input}/><Button disabled={busy} title="Accedi" onPress={()=>authenticate()}/><Button disabled={busy} title="Crea account" onPress={()=>authenticate(true)}/></>:<>
 <Text style={s.note}>Account: {session.user.email}</Text><TextInput accessibilityLabel="Zona comunità" placeholder="Città o zona, es. Bolzano" value={city} maxLength={80} onChangeText={setCity} style={s.input}/><Button disabled={busy} title={subscription?.enabled?'Cambia zona':'Attiva comunità nella zona'} onPress={enable}/>{subscription?.enabled&&<><Button disabled={busy} title="Aggiorna annunci" onPress={()=>action(reload)}/><Button disabled={busy} title="Disattiva avvisi della zona" onPress={()=>action(async()=>setSubscription(await subscribeZone(subscription.city_key,environment,false)))}/></>}
 {reports.filter(r=>r.status==='missing'&&!r.cloudId).map(report=><Button key={report.id} disabled={busy||!subscription?.enabled} title={'Pubblica annuncio: '+dog.name+' · '+report.area} onPress={()=>publish(report)}/>)}
 {alerts.map(row=><View key={row.id} style={s.alert}><Text style={s.title}>{row.status==='found'?'RITROVATO':'SMARRITO'} · {row.dog_name}</Text>{row.photo_data&&<Image source={{uri:row.photo_data}} style={s.photo}/>}<Text style={s.text}>{row.area}{'\n'}{row.last_seen}{'\n'}{row.description}</Text>{Boolean(row.contact)&&<Text selectable style={s.text}>Recapito: {row.contact}</Text>}{row.owner_id===session.user.id&&<>{row.status==='missing'&&<Button disabled={busy} title="Segna ritrovato" onPress={()=>close(row,'found')}/>}<Button disabled={busy} title="Ritira annuncio" onPress={()=>close(row,'withdrawn')}/></>}</View>)}
 {subscription?.enabled&&!alerts.length&&<Text style={s.text}>Nessun annuncio attivo nella zona. Gli avvisi arrivano agli iscritti: il servizio non contatta automaticamente veterinari, canili o autorità.</Text>}<Button disabled={busy} title="Esci dall’account" onPress={()=>action(async()=>{const {error}=await cloud.auth.signOut();if(error)throw error;})}/>
 </>}{Boolean(error)&&<Text accessibilityRole="alert" style={s.error}>{error}</Text>}<Text style={s.note}>Solo ciò che pubblichi viene condiviso. Puoi ritirare un annuncio. Foto e recapito vengono rimossi alla chiusura; gli annunci scadono dopo 14 giorni.</Text></View>;
}
const s=StyleSheet.create({card:{backgroundColor:'white',borderRadius:23,padding:20,marginTop:14},title:{fontSize:18,fontWeight:'800',color:'#49301f'},text:{fontSize:15,lineHeight:22,color:'#4b3c2d',marginTop:10},note:{fontSize:12,lineHeight:19,color:'#8a7661',marginTop:12},input:{borderWidth:1,borderColor:'#e2d5c4',borderRadius:15,padding:14,fontSize:16,marginTop:12},button:{backgroundColor:'#754622',borderRadius:16,padding:14,marginTop:12},buttonText:{color:'#fff8ea',fontSize:14,fontWeight:'700',textAlign:'center'},error:{color:'#9a2020',fontSize:14,marginTop:12},alert:{borderTopWidth:1,borderColor:'#e2d5c4',paddingTop:15,marginTop:20},photo:{width:'100%',height:200,borderRadius:15,marginTop:12}});
