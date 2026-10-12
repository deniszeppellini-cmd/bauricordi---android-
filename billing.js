import { Platform } from 'react-native';
import Purchases from 'react-native-purchases';
import Constants from 'expo-constants';
import { hasPremiumEntitlement } from './domain.mjs';
const KEY = Platform.OS === 'ios' ? process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY : process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY;
export const billingConfigured = Boolean(!Constants.expoConfig?.extra?.premiumPreview && KEY && (Platform.OS === 'ios' ? KEY.startsWith('appl_') : KEY.startsWith('goog_')));
let configured = false;
export async function initializeBilling(listener) {
  if (!billingConfigured) return { premium: false, packages: [], info: null };
  if (!configured) { Purchases.configure({ apiKey: KEY }); configured = true; }
  if (listener) Purchases.addCustomerInfoUpdateListener(listener);
  const info = await Purchases.getCustomerInfo();
  let packages = [];
  try { packages = (await Purchases.getOfferings()).current?.availablePackages ?? []; } catch { /* Access remains based on verified customer info, even if offers are unavailable. */ }
  return { premium: hasPremiumEntitlement(info), packages, info };
}
export function removeBillingListener(listener) { if (configured) Purchases.removeCustomerInfoUpdateListener(listener); }
export async function refreshBilling() { return configured ? Purchases.getCustomerInfo() : null; }
export async function buyPackage(pkg) {
  if (!configured) throw new Error('Gli abbonamenti non sono ancora attivati nello store.');
  return (await Purchases.purchasePackage(pkg)).customerInfo;
}
export async function restoreBilling() {
  if (!configured) throw new Error('Gli abbonamenti non sono ancora attivati nello store.');
  return Purchases.restorePurchases();
}
