import { Platform } from "react-native";
import Purchases from "react-native-purchases";
import RevenueCatUI from "react-native-purchases-ui";

export const PRO_ENTITLEMENT = "suisseai_pro";

export async function isProActive(): Promise<boolean> {
  if (Platform.OS !== "ios" && Platform.OS !== "android") return false;
  try {
    if (!(await Purchases.isConfigured())) return false;
    const info = await Purchases.getCustomerInfo();
    return !!info.entitlements.active[PRO_ENTITLEMENT];
  } catch {
    return false;
  }
}

/** "Upgrade" butonuna basınca RevenueCat'in hazır paywall ekranını açar. */
export async function presentUpgradePaywall(): Promise<boolean> {
  if (Platform.OS !== "ios" && Platform.OS !== "android") return false;
  try {
    if (!(await Purchases.isConfigured())) return false;
    const result = await RevenueCatUI.presentPaywall();
    // RESTORED | PURCHASED => kullanıcı artık aktif abone
    return result === "PURCHASED" || result === "RESTORED";
  } catch {
    return false;
  }
}

export async function restorePurchases(): Promise<boolean> {
  if (Platform.OS !== "ios" && Platform.OS !== "android") return false;
  try {
    if (!(await Purchases.isConfigured())) return false;
    const info = await Purchases.restorePurchases();
    return !!info.entitlements.active[PRO_ENTITLEMENT];
  } catch {
    return false;
  }
}
