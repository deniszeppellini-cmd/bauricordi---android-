# Bauricordi 1.2 — Gratis e Premium

App Expo / React Native per il diario del cane. Foto e dati sono conservati localmente sul telefono; nessun cloud o modello IA online è attivo.

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

**Limite attuale:** non vengono pubblicati annunci su un cloud e non vengono inviate notifiche automatiche agli utenti vicini. Il progetto Supabase Bauricordi è stato ripristinato, ma il suo schema pubblico è vuoto. Per il servizio di avvisi occorrono account e consenso dei destinatari, iscrizione per zona, autorizzazione Premium lato server, archivio condiviso e consegna push verificata su due dispositivi. Nessun testo dell’app afferma che questo servizio sia già attivo.
