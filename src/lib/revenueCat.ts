import { Platform } from 'react-native';
import Purchases, {
  CustomerInfo, LOG_LEVEL, PurchasesError, PurchasesOffering, PurchasesPackage,
  PURCHASES_ERROR_CODE,
} from 'react-native-purchases';

// This is RevenueCat's *public* SDK key — safe to ship inside the client
// bundle, the same way a Stripe publishable key is. It cannot authorize
// anything on its own; entitlement checks always go through RevenueCat's
// servers. Do not confuse it with a secret API key.
const REVENUECAT_IOS_API_KEY = 'appl_uKspvGdNMyabikvnlnJXqhgZCVI';

export const REVENUECAT_ENTITLEMENT_ID = 'pro';
export const REVENUECAT_OFFERING_ID = 'default';
export const REVENUECAT_LIFETIME_PRODUCT_ID = 'com.bekircankulluoglu.depo.pro.lifetime';

let configured = false;

/**
 * Configures the SDK exactly once per process. Android has no production key
 * yet, so this deliberately no-ops there rather than crashing — the whole
 * Pro flow degrades to "unavailable" on that platform this sprint.
 */
export function configureRevenueCat(): void {
  if (configured || Platform.OS !== 'ios') return;
  configured = true;
  if (__DEV__) Purchases.setLogLevel(LOG_LEVEL.DEBUG);
  Purchases.configure({ apiKey: REVENUECAT_IOS_API_KEY });
}

export function isRevenueCatAvailable(): boolean {
  return Platform.OS === 'ios';
}

export function isEntitlementActive(info: CustomerInfo): boolean {
  return !!info.entitlements.active[REVENUECAT_ENTITLEMENT_ID];
}

/** Never throws — a boot-time check failing must not block the app. */
export async function fetchCustomerInfoSafe(): Promise<CustomerInfo | null> {
  if (!isRevenueCatAvailable()) return null;
  try {
    return await Purchases.getCustomerInfo();
  } catch (err) {
    if (__DEV__) console.warn('[revenueCat] getCustomerInfo failed', err);
    return null;
  }
}

/**
 * Resolves the configured lifetime package from the current offering.
 * Prefers the dashboard's predefined `lifetime` slot, falling back to
 * scanning `availablePackages` for the exact product id in case the package
 * was set up as a custom identifier instead.
 */
export function findLifetimePackage(offering: PurchasesOffering | null): PurchasesPackage | null {
  if (!offering) return null;
  if (offering.lifetime) return offering.lifetime;
  return offering.availablePackages.find((p) => p.product.identifier === REVENUECAT_LIFETIME_PRODUCT_ID) ?? null;
}

export async function getCurrentOffering(): Promise<PurchasesOffering | null> {
  const offerings = await Purchases.getOfferings();
  return offerings.current ?? offerings.all[REVENUECAT_OFFERING_ID] ?? null;
}

export function isCancelledError(err: unknown): boolean {
  return isPurchasesError(err) && err.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR;
}

export function isAlreadyPurchasedError(err: unknown): boolean {
  return isPurchasesError(err) && err.code === PURCHASES_ERROR_CODE.PRODUCT_ALREADY_PURCHASED_ERROR;
}

function isPurchasesError(err: unknown): err is PurchasesError {
  return !!err && typeof err === 'object' && 'code' in err;
}

/** Shown when RevenueCat has no production key for this platform (Android, this sprint). */
export const PURCHASES_UNAVAILABLE_MESSAGE = {
  title: 'Satın alma şu anda kullanılamıyor.',
  body: 'Biraz sonra tekrar deneyebilirsin.',
} as const;

/** Friendly Turkish copy — never the raw RevenueCat message or code. */
export function purchaseErrorMessage(err: unknown): { title: string; body: string } {
  if (isPurchasesError(err)) {
    switch (err.code) {
      case PURCHASES_ERROR_CODE.NETWORK_ERROR:
      case PURCHASES_ERROR_CODE.OFFLINE_CONNECTION_ERROR:
        return { title: 'Bağlantı kurulamadı.', body: 'İnternet bağlantını kontrol edip tekrar deneyebilirsin.' };
      case PURCHASES_ERROR_CODE.PRODUCT_NOT_AVAILABLE_FOR_PURCHASE_ERROR:
      case PURCHASES_ERROR_CODE.CONFIGURATION_ERROR:
      case PURCHASES_ERROR_CODE.STORE_PROBLEM_ERROR:
        return { title: 'Satın alma şu anda kullanılamıyor.', body: 'Biraz sonra tekrar deneyebilirsin.' };
      default:
        break;
    }
  }
  return { title: 'Satın alma tamamlanamadı.', body: 'Tekrar deneyebilirsin.' };
}

export type { CustomerInfo, PurchasesOffering, PurchasesPackage, PurchasesError };
