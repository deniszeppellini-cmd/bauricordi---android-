# Bauricordi Android

Prototipo Expo / React Native dedicato ai ricordi e alla vita dei cani.

## Generare e scaricare l'APK

Il workflow attivo è `.github/workflows/build-android.yml`. Si avvia da Actions oppure al caricamento dei file sorgente sul ramo `main`.

Il workflow verifica le dipendenze Expo, utilizza il secret `EXPO_TOKEN` solo per l'autenticazione EAS, esporta il bundle JavaScript, genera il progetto Android e compila un APK autonomo. L'artefatto `Bauricordi-Android` contiene l'APK, il checksum SHA-256 e la configurazione usata.

L'APK di anteprima usa la firma di test di React Native. Non richiede Expo Go o un server Metro. È destinato alla prova su telefono, non alla pubblicazione su Google Play.

## Stato delle funzioni

Il codice attuale è un prototipo: la navigazione e il nome del cane funzionano, ma ricordi, promemoria e Bauri contengono ancora schermate dimostrative. Il nome modificato non viene ancora salvato tra gli avvii. Non sono implementati backend IA, notifiche, pagamenti o sincronizzazione.

## Sviluppo

Con Node 22:

```sh
npm ci
npx expo install --check
npx expo export --platform android
npx expo prebuild --platform android
```

`eas.json` contiene il profilo `preview` per APK e `production` per AAB. Per le build cloud e la pubblicazione occorre configurare una chiave di firma di produzione; il token non va mai aggiunto ai sorgenti. Il vecchio ZIP e il file workflow alla radice sono archivi storici e non vengono usati dalla build attuale.
