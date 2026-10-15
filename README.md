# Bauricordi 1.3 — Gratis e Premium

App Expo / React Native per il diario del cane. Diario, foto e conversazioni sono locali. Gli annunci SOS vengono inviati al cloud solo dopo conferma esplicita. L’IA online non è attiva.

## Funzioni

- Gratis: un cane, 20 ricordi con foto e testo, ricerca, promemoria con notifiche locali, nove missioni, scheda Dog Sitter PDF e backup completo con immagini.
- Premium: più profili cane, ricordi oltre il limite gratuito e album PDF degli ultimi 40 ricordi.
- Bauri locale: risponde con regole sul diario, i promemoria e le missioni del cane selezionato. Non è un modello IA e non fornisce diagnosi o dosaggi.

Gli avvisi contengono il titolo e la nota del promemoria. La consegna dipende dai permessi e dal risparmio energetico Android. È disponibile una notifica di prova a 10 secondi. Se i permessi vengono negati, il promemoria resta nel diario con stato notifica non attiva. Dopo il ripristino di un backup, salvare nuovamente i promemoria per programmare le notifiche su quel telefono.

Il backup completo è limitato a 35 MB di immagini codificate. I file importati sono verificati, le foto vengono copiate nella directory privata dell'app e gli identificativi delle notifiche del vecchio telefono non vengono riutilizzati. In caso di dati illeggibili l'app non sovrascrive l'archivio.

## APK e anteprima Premium

Il workflow `.github/workflows/build-android.yml` genera due artefatti:

- `Bauricordi-Free-Premium`: pacchetto `com.bauricordi.app`. Premium è sbloccato solo da un entitlement RevenueCat `premium` attivo e non scaduto.
- `Bauricordi-Premium-Anteprima`: pacchetto `com.bauricordi.app.preview`. Mostra sempre il banner Anteprima e consente di provare gli extra senza acquisti. Il client RevenueCat è disattivato in questa variante.

Entrambi gli APK utilizzano la chiave di test React Native e contengono il bundle JS. Sono destinati alle prove d'installazione, non alla pubblicazione su Play Store. La variante di anteprima è un'app distinta; i dati non si trasferiscono automaticamente tra i due pacchetti. Si può usare il backup per trasferirli.

## Abbonamenti reali: integrazione presente, attivazione esterna necessaria

La libreria `react-native-purchases` è integrata. Offerte, prezzi, acquisti e ripristino provengono dallo store via RevenueCat; non esistono acquisti simulati nella variante normale e nessuna variabile locale persistita concede Premium.

Prima di vendere:

1. Configurare l'app con lo stesso package su Google Play Console e App Store Connect e predisporre la firma di produzione.
2. Collegare gli store a RevenueCat; creare entitlement `premium`, prodotti di abbonamento e un'offering corrente con pacchetti mensile/annuale e prezzi definiti dal titolare.
3. Impostare in GitHub la variabile `REVENUECAT_ANDROID_PUBLIC_KEY` (`goog_...`) e ricompilare. Per iOS usare `EXPO_PUBLIC_REVENUECAT_IOS_KEY` (`appl_...`) nella build EAS iOS. Sono chiavi SDK pubbliche, non chiavi segrete server.
4. Verificare su traccia di test degli store acquisto, ripristino, rinnovo, scadenza e annullamento. Pubblicare termini, privacy e contatti reali del titolare.

Se la chiave o i prodotti mancano, la schermata Premium spiega che gli abbonamenti non sono attivi e non presenta un pagamento finto. La build Android non dimostra il funzionamento di un acquisto reale né verifica la build iOS.

## Sviluppo e verifiche

Con Node 22:

```sh
npm ci
npm test
npx expo install --check
npx expo export --platform android
npx expo prebuild --platform android
```

I test verificano archivio, backup foto, recupero dopo errori di scrittura, isolamento tra profili, appuntamenti, limite gratuito ed entitlement Premium scaduti. Le notifiche, i picker, la condivisione PDF e gli acquisti necessitano anche di una prova su dispositivi/store reali.

`app.json` conserva il collegamento EAS verificato; `app.config.js` aggiunge i permessi e seleziona il pacchetto di anteprima. Il secret `EXPO_TOKEN` è usato esclusivamente nel passo EAS del workflow. Non inserire chiavi server IA, token Expo o credenziali store nel client.

Il vecchio ZIP e il workflow alla radice sono archivi storici e non vengono utilizzati dalla nuova build.

## SOS di zampa (1.2)

La Home apre SOS. Tutti possono chiamare il veterinario salvato e cercare pronto soccorso veterinario in Google Maps per città o zona. I risultati sono una ricerca esterna, non un elenco di turni verificati: occorre confermare telefonicamente disponibilità e orari.

Premium e l’anteprima Premium possono salvare annunci di smarrimento con luogo, data e ora, recapito del proprietario e segni particolari. Il testo e il PDF con la foto attuale del Profilo si condividono attraverso il selettore nativo del telefono. Gli annunci sono inclusi nel backup e i vecchi backup restano compatibili. Il pulsante Ritrovato aggiorna lo stato locale; condividere poi l’aggiornamento con chi ha ricevuto l’annuncio. Gli annunci già salvati restano leggibili e condivisibili se Premium scade.

## Comunità SOS (1.3)

Lo schema Supabase `community-schema.sql` è attivo nel progetto Bauricordi. Lettura e pubblicazione richiedono un account email verificato e iscrizione alla stessa zona; non esiste accesso anonimo agli annunci. La sessione viene conservata nel portachiavi del dispositivo e non entra nei backup. Pubblicare invia esclusivamente i campi dell’annuncio e una miniatura del cane, dopo conferma.

Gli aggiornamenti nell’app arrivano via Supabase Postgres Changes; una rilettura ogni 30 secondi e al ritorno in primo piano recupera cambiamenti persi. L’indicatore distingue connessione attiva e interruzioni. La pagina mostra massimo 100 annunci recenti nella zona. In anteprima gli annunci sono separati dalla versione normale. Massimo tre annunci ogni 24 ore per account; durata massima 14 giorni. Ritrovato rimuove recapito, descrizione e foto; Ritira nasconde l’annuncio agli altri iscritti. La cancellazione periodica elimina le righe scadute.

La pubblicazione dal client richiede Premium o l’attivazione degli extra in anteprima. La comunità è in beta: il controllo Premium lato server e l’integrazione RevenueCat devono essere completati prima di vendere abbonamenti con un servizio cloud incluso.

**Notifiche a app chiusa non attive:** il repository non contiene `google-services.json`, non ha impostato un percorso Android Firebase né configurato il servizio FCM V1 in Expo. Non è stata verificata la consegna su dispositivi. L’app descrive correttamente che la ricezione in tempo reale funziona a app aperta e connessa. Non dichiara una consegna push. L’accesso dashboard Expo e Firebase è necessario per configurare e verificare i passaggi rimanenti; non includere chiavi private nel repository.

L’accesso con email usa Supabase Auth e la conferma email. Per registrazioni pubbliche occorre verificare il servizio SMTP, template/redirect di conferma, limiti e documenti del titolare. I test RLS sono stati eseguiti in una transazione annullata: non sono rimasti utenti o annunci di prova. Il controllo sicurezza del progetto non ha rilevato problemi RLS; segnala che la protezione delle password compromesse è disattivata, impostazione da gestire nell’account.

## Reperibilità veterinaria ufficiale

Documento dell’Ordine dei Veterinari di Bolzano consultato il 15/10/2026: per Bolzano, Merano, Val Venosta e Bressanone, sabato/domenica il Centro di contatto regionale della Croce Rossa è raggiungibile al **0471 080808**, in collaborazione con le cliniche veterinarie dell’area di Bolzano. Fonte: https://www.tieraerztekammer.com/it/download/reperibilita-veterinari-per-animali-daffezione-bolzano/ .

L’app conserva questa fonte e la data di controllo, distingue i weekend nel fuso Europe/Rome e invita a controllare gli aggiornamenti e confermare prima di recarsi in clinica. Non presenta il numero come copertura feriale né inventa un veterinario attualmente di turno.
