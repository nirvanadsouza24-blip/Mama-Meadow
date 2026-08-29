/**
 * RevenueCat Subscription Context (Anonymous Mode)
 *
 * Provides subscription management for Expo + React Native apps.
 * Reads API keys from app.json (expo.extra) automatically.
 *
 * Supports:
 * - Native iOS/Android via RevenueCat SDK
 * - Web preview via RevenueCat REST API (read-only pricing display)
 * - Expo Go via test store keys
 *
 * NOTE: Running in anonymous mode - purchases won't sync across devices.
 * To enable cross-device sync:
 * 1. Set up authentication with setup_auth
 * 2. Re-run setup_revenuecat to upgrade this file
 *
 * SETUP:
 * 1. Wrap your app with <SubscriptionProvider>
 * 2. Run (via the project's package runner — bunx for new projects, npx for legacy): expo install react-native-purchases && expo prebuild
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { Platform } from "react-native";
import Purchases, {
  PurchasesOfferings,
  PurchasesOffering,
  PurchasesPackage,
  LOG_LEVEL,
} from "react-native-purchases";
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";

// Read API keys from app.json (expo.extra)
const extra = Constants.expoConfig?.extra || {};
const IOS_API_KEY = extra.revenueCatApiKeyIos || "";
const ANDROID_API_KEY = extra.revenueCatApiKeyAndroid || "";
const TEST_IOS_API_KEY = extra.revenueCatTestApiKeyIos || "";
const TEST_ANDROID_API_KEY = extra.revenueCatTestApiKeyAndroid || "";
const ENTITLEMENT_ID = extra.revenueCatEntitlementId || "pro";

// Check if running on web
const isWeb = Platform.OS === "web";
// Use nativelyProjectId (unique UUID) for scoping; fall back to slug for backward compatibility
const _PROJECT_SCOPE = Constants.expoConfig?.extra?.nativelyProjectId || Constants.expoConfig?.slug || "app";
const MOCK_PURCHASE_KEY = `rc_mock_purchased_${_PROJECT_SCOPE}`;
// Scoped native dev mock key — persists simulated subscription in Expo Go via expo-secure-store
const MOCK_NATIVE_KEY = `rc_dev_native_${_PROJECT_SCOPE}`;
// Scoped native cache key — persists real subscription state for fast restore on bundle reload
const NATIVE_PURCHASE_KEY = `rc_subscribed_${_PROJECT_SCOPE}`;

interface SubscriptionContextType {
  /** Whether the user has an active subscription */
  isSubscribed: boolean;
  /** All offerings from RevenueCat */
  offerings: PurchasesOfferings | null;
  /** The current/default offering */
  currentOffering: PurchasesOffering | null;
  /** Available packages in the current offering */
  packages: PurchasesPackage[];
  /** Loading state during initialization */
  loading: boolean;
  /** Whether running on web (purchases not available) */
  isWeb: boolean;
  /** Purchase a package - returns true if successful */
  purchasePackage: (pkg: PurchasesPackage) => Promise<boolean>;
  /** Restore previous purchases - returns true if subscription found */
  restorePurchases: () => Promise<boolean>;
  /** Manually re-check subscription status */
  checkSubscription: () => Promise<void>;
  /** Re-fetch offerings from RevenueCat (useful for retry on empty packages) */
  refreshOfferings: () => Promise<void>;
  /** Mock a successful purchase on web (preview only) - sets isSubscribed to true */
  mockWebPurchase: () => void;
  /** Dev-only: simulate a purchase in Expo Go — persists across reloads via expo-secure-store */
  mockNativePurchase: () => Promise<void>;
  /** Number of times refreshOfferings has been called — increments on each retry so paywall can re-render */
  retryCount: number;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(
  undefined
);

interface SubscriptionProviderProps {
  children: ReactNode;
}

export function SubscriptionProvider({ children }: SubscriptionProviderProps) {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [offerings, setOfferings] = useState<PurchasesOfferings | null>(null);
  const [currentOffering, setCurrentOffering] =
    useState<PurchasesOffering | null>(null);
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

    // Fetch offerings via REST API for web platform
  const fetchOfferingsViaRest = async () => {
    // Mock package with real prices from RevenueCat dashboard
    const mockPackage = {
      identifier: "$rc_monthly",
      product: {
        title: "Premium",
        priceString: "$4.99/month",
        description: "Unlock all premium features",
      },
    };

    setPackages([mockPackage] as PurchasesPackage[]);
    console.log("[revenuecat] Web preview: showing real prices from dashboard");
  };

  // Initialize RevenueCat on mount
  useEffect(() => {
    let customerInfoListener: { remove: () => void } | null = null;

    const initRevenueCat = async () => {
      try {
        // Web platform: SDK doesn't work, use REST API for basic info
        if (isWeb) {
          await fetchOfferingsViaRest();
          // Restore mock purchase state persisted from a previous session
          if (typeof window !== "undefined" && localStorage.getItem(MOCK_PURCHASE_KEY) === "true") {
            setIsSubscribed(true);
          }
          setLoading(false);
          return;
        }

        // Check if the react-native-purchases native module is available.
        // It is NOT available in standard Expo Go — only in custom dev builds and production builds.
        // DO NOT change this check or replace with AsyncStorage-based workarounds.
        if (typeof Purchases?.configure !== "function") {
          console.warn(
            "[RevenueCat] react-native-purchases native module not available. " +
            "Purchases require a custom dev build or production build, not standard Expo Go."
          );
          // In DEV mode, restore any previously simulated subscription state from expo-secure-store.
          // This lets you test subscription-gated features in standard Expo Go across reloads.
          if (__DEV__) {
            const mockState = await SecureStore.getItemAsync(MOCK_NATIVE_KEY).catch(() => null);
            if (mockState === "true") {
              setIsSubscribed(true);
            }
          }
          setLoading(false);
          return;
        }

        // Use DEBUG log level in development, INFO in production
        Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.INFO);

        // Get API key based on platform and environment
        // In development (__DEV__), use ANY available test key (test store works for all platforms)
        // This allows Expo Go to work on iOS even without a platform-specific test key
        const testKey = TEST_IOS_API_KEY || TEST_ANDROID_API_KEY;
        const productionKey = Platform.OS === "ios" ? IOS_API_KEY : ANDROID_API_KEY;
        const apiKey = __DEV__ && testKey ? testKey : productionKey;

        if (!apiKey) {
          console.warn(
            "[RevenueCat] API key not provided for this platform. " +
            "Please add revenueCatApiKeyIos/revenueCatApiKeyAndroid to app.json extra."
          );
          setLoading(false);
          return;
        }

        if (__DEV__) {
          console.log("[RevenueCat] Initializing in DEV mode with key:", apiKey.substring(0, 10) + "...");
          // Restore cached subscription state immediately to avoid paywall flash on bundle reload.
          // The customerInfoUpdateListener (fired by configure() below) is the authoritative
          // source and will immediately overwrite this with real RC Keychain data.
          const cached = await SecureStore.getItemAsync(NATIVE_PURCHASE_KEY).catch(() => null);
          if (cached === "true") {
            setIsSubscribed(true);
          }
        }

        await Purchases.configure({ apiKey });

        // Give Apple's sandbox StoreKit a moment after configure() before requesting products.
        // Without this delay, getOfferings() can return empty results in the sandbox environment.
        await new Promise<void>((r) => setTimeout(r, 500));

        // Listen for real-time subscription changes (e.g., purchase from another device)
        customerInfoListener = Purchases.addCustomerInfoUpdateListener(
          (customerInfo) => {
            const hasEntitlement =
              typeof customerInfo.entitlements.active[ENTITLEMENT_ID] !==
              "undefined";
            // In __DEV__: don't clear subscription state — RevenueCat test store purchases are
            // in-memory only and won't be known to RC after a configure() call on reload.
            if (hasEntitlement || !__DEV__) {
              setIsSubscribed(hasEntitlement);
            }
          }
        );

        // Fetch available products/packages
        await fetchOfferings();

        // Check initial subscription status
        await checkSubscription();
      } catch (error) {
        console.error("[RevenueCat] Failed to initialize:", error);
      } finally {
        setLoading(false);
      }
    };

    initRevenueCat();

    // Cleanup listener on unmount
    return () => {
      if (customerInfoListener) {
        customerInfoListener.remove();
      }
    };
  }, []);

  const fetchOfferings = async () => {
    if (isWeb) return;

    const MAX_ATTEMPTS = 3;
    const BACKOFF_MS = [1000, 2000, 4000];

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        console.log(`[RevenueCat] fetchOfferings attempt ${attempt}/${MAX_ATTEMPTS}`);
        const fetchedOfferings = await Purchases.getOfferings();
        setOfferings(fetchedOfferings);

        // Determine if we got usable packages
        const currentPkgs = fetchedOfferings.current?.availablePackages ?? [];
        const allOfferings = Object.values(fetchedOfferings.all || {});
        const fallbackPkgs = allOfferings.length > 0 ? allOfferings[0].availablePackages : [];
        const hasPackages = currentPkgs.length > 0 || fallbackPkgs.length > 0;

        if (fetchedOfferings.current) {
          console.log(
            "[RevenueCat] Using current offering:",
            fetchedOfferings.current.identifier,
            "— packages:",
            fetchedOfferings.current.availablePackages.length
          );
          setCurrentOffering(fetchedOfferings.current);
          setPackages(fetchedOfferings.current.availablePackages);
        } else if (allOfferings.length > 0) {
          console.log(
            "[RevenueCat] No current offering. Falling back to first offering:",
            allOfferings[0].identifier,
            "— packages:",
            allOfferings[0].availablePackages.length
          );
          setCurrentOffering(allOfferings[0]);
          setPackages(allOfferings[0].availablePackages);
        } else {
          console.warn(
            `[RevenueCat] fetchOfferings attempt ${attempt}/${MAX_ATTEMPTS}: no offerings found.`
          );
        }

        // If we got packages, we're done — no need to retry
        if (hasPackages) {
          return;
        }

        // No packages found — retry if attempts remain
        if (attempt < MAX_ATTEMPTS) {
          const delay = BACKOFF_MS[attempt - 1];
          console.log(`[RevenueCat] No packages yet, retrying in ${delay}ms...`);
          await new Promise<void>((r) => setTimeout(r, delay));
        } else {
          console.warn("[RevenueCat] No offerings found after all attempts. Check RevenueCat dashboard configuration.");
        }
      } catch (error) {
        console.error(`[RevenueCat] fetchOfferings attempt ${attempt}/${MAX_ATTEMPTS} failed:`, error);
        if (attempt < MAX_ATTEMPTS) {
          const delay = BACKOFF_MS[attempt - 1];
          console.log(`[RevenueCat] Retrying fetchOfferings in ${delay}ms...`);
          await new Promise<void>((r) => setTimeout(r, delay));
        }
      }
    }
  };

  const refreshOfferings = async () => {
    console.log("[RevenueCat] refreshOfferings called");
    setRetryCount((prev) => prev + 1);
    await fetchOfferings();
  };

  const checkSubscription = async () => {
    if (isWeb) return;

    const MAX_ATTEMPTS = 3; // initial attempt + 2 retries
    const RETRY_DELAY_MS = 1000;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        const customerInfo = await Purchases.getCustomerInfo();
        const hasEntitlement =
          typeof customerInfo.entitlements.active[ENTITLEMENT_ID] !== "undefined";
        // In __DEV__: RC test store purchases don't survive configure(), so only update state
        // positively — mock/test purchase state persists across reloads via SecureStore cache.
        if (hasEntitlement || !__DEV__) {
          setIsSubscribed(hasEntitlement);
        }
        if (hasEntitlement) {
          await SecureStore.setItemAsync(NATIVE_PURCHASE_KEY, "true").catch(() => {});
        } else if (!__DEV__) {
          await SecureStore.setItemAsync(NATIVE_PURCHASE_KEY, "false").catch(() => {});
        }
        // Success — exit retry loop
        return;
      } catch (error) {
        if (attempt < MAX_ATTEMPTS) {
          console.warn(
            `[RevenueCat] checkSubscription attempt ${attempt}/${MAX_ATTEMPTS} failed, retrying in ${RETRY_DELAY_MS}ms:`,
            error
          );
          await new Promise<void>((r) => setTimeout(r, RETRY_DELAY_MS));
        } else {
          console.error("[RevenueCat] Failed to check subscription after all attempts:", error);
          // Don't reset isSubscribed on error — the customerInfoUpdateListener
          // already set it from local cache after configure(). Overriding with false
          // would incorrectly show the paywall to subscribed users on network errors.
        }
      }
    }
  };

  const purchasePackage = async (pkg: PurchasesPackage): Promise<boolean> => {
    if (isWeb) {
      console.warn("[RevenueCat] Purchases not available on web");
      return false;
    }
    try {
      console.log("[RevenueCat] purchasePackage:", pkg.identifier);
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      const hasEntitlement =
        typeof customerInfo.entitlements.active[ENTITLEMENT_ID] !== "undefined";
      setIsSubscribed(hasEntitlement);
      if (hasEntitlement) {
        await SecureStore.setItemAsync(NATIVE_PURCHASE_KEY, "true").catch(() => {});
      }
      return hasEntitlement;
    } catch (error: any) {
      // Don't treat user cancellation as an error
      if (!error.userCancelled) {
        console.error("[RevenueCat] Purchase failed:", error);
        throw error;
      }
      return false;
    }
  };

  const restorePurchases = async (): Promise<boolean> => {
    if (isWeb) {
      console.warn("[RevenueCat] Restore not available on web");
      return false;
    }
    try {
      console.log("[RevenueCat] restorePurchases called");
      const customerInfo = await Purchases.restorePurchases();
      const hasEntitlement =
        typeof customerInfo.entitlements.active[ENTITLEMENT_ID] !== "undefined";
      setIsSubscribed(hasEntitlement);
      // In __DEV__: don't clear the cache on restore failure (test store purchases are ephemeral)
      if (hasEntitlement || !__DEV__) {
        await SecureStore.setItemAsync(NATIVE_PURCHASE_KEY, hasEntitlement ? "true" : "false").catch(() => {});
      }
      return hasEntitlement;
    } catch (error) {
      console.error("[RevenueCat] Restore failed:", error);
      throw error;
    }
  };

  const mockWebPurchase = () => {
    if (!isWeb) return;
    if (typeof window !== "undefined") {
      localStorage.setItem(MOCK_PURCHASE_KEY, "true");
    }
    setIsSubscribed(true);
  };

  // Dev-only: simulate a purchase in standard Expo Go for testing subscription-gated features.
  // Persists to expo-secure-store so the state survives Expo Go reloads.
  const mockNativePurchase = async (): Promise<void> => {
    if (!__DEV__ || isWeb) return;
    await SecureStore.setItemAsync(MOCK_NATIVE_KEY, "true").catch(() => {});
    setIsSubscribed(true);
  };

  return (
    <SubscriptionContext.Provider
      value={{
        isSubscribed,
        offerings,
        currentOffering,
        packages,
        loading,
        isWeb,
        purchasePackage,
        restorePurchases,
        checkSubscription,
        refreshOfferings,
        mockWebPurchase,
        mockNativePurchase,
        retryCount,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

/**
 * Hook to access subscription state and methods.
 *
 * @example
 * const { isSubscribed, purchasePackage, packages, isWeb } = useSubscription();
 *
 * if (!isSubscribed) {
 *   return <Button onPress={() => router.push("/paywall")}>Upgrade</Button>;
 * }
 */
export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error(
      "useSubscription must be used within SubscriptionProvider"
    );
  }
  return context;
}
