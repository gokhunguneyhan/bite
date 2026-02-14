import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Platform, Alert } from 'react-native';
import Purchases, { LOG_LEVEL, type CustomerInfo } from 'react-native-purchases';
import RevenueCatUI, { PAYWALL_RESULT } from 'react-native-purchases-ui';
import { useSession } from './SessionProvider';
import { useSettingsStore } from '../stores/settingsStore';

const API_KEY = 'test_CCFpXmRljvviPaDckHGGGPaMJGX';
const ENTITLEMENT_ID = 'bite_pro';

interface RevenueCatContextValue {
  isReady: boolean;
  isPro: boolean;
  showPaywall: () => Promise<PAYWALL_RESULT | undefined>;
  showCustomerCenter: () => Promise<void>;
  restorePurchases: () => Promise<void>;
}

const RevenueCatContext = createContext<RevenueCatContextValue>({
  isReady: false,
  isPro: false,
  showPaywall: async () => undefined,
  showCustomerCenter: async () => {},
  restorePurchases: async () => {},
});

export function useRevenueCat() {
  return useContext(RevenueCatContext);
}

function syncEntitlements(customerInfo: CustomerInfo) {
  const hasPro = customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
  useSettingsStore.getState()._setTier(hasPro ? 'pro' : 'free');
}

export function RevenueCatProvider({ children }: { children: React.ReactNode }) {
  const { user } = useSession();
  const [isReady, setIsReady] = useState(false);
  const [isPro, setIsPro] = useState(false);

  // Initialize SDK
  useEffect(() => {
    async function init() {
      try {
        if (__DEV__) {
          Purchases.setLogLevel(LOG_LEVEL.DEBUG);
        }

        Purchases.configure({ apiKey: API_KEY });

        if (user?.id) {
          await Purchases.logIn(user.id);
        }

        const customerInfo = await Purchases.getCustomerInfo();
        const hasPro = customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
        // In dev mode, grant pro access so the paywall doesn't block testing
        const effectivePro = __DEV__ ? true : hasPro;
        setIsPro(effectivePro);
        useSettingsStore.getState()._setTier(effectivePro ? 'pro' : 'free');
      } catch (error) {
        console.error('[RevenueCat] Init error:', error);
        // In dev mode, still grant access even on SDK failure
        if (__DEV__) {
          setIsPro(true);
          useSettingsStore.getState()._setTier('pro');
        } else {
          useSettingsStore.getState()._setTier('free');
        }
      } finally {
        setIsReady(true);
      }
    }

    init();
  }, [user?.id]);

  // Listen for entitlement changes
  useEffect(() => {
    if (!isReady) return;

    const listener = (customerInfo: CustomerInfo) => {
      const hasPro = customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
      setIsPro(hasPro);
      syncEntitlements(customerInfo);
    };

    Purchases.addCustomerInfoUpdateListener(listener);

    return () => {
      Purchases.removeCustomerInfoUpdateListener(listener);
    };
  }, [isReady]);

  const showPaywall = useCallback(async () => {
    try {
      return await RevenueCatUI.presentPaywallIfNeeded({
        requiredEntitlementIdentifier: ENTITLEMENT_ID,
      });
    } catch (error) {
      console.error('[RevenueCat] Paywall error:', error);
      Alert.alert(
        'Unable to Load Subscriptions',
        'Please check your internet connection and try again.',
      );
      return undefined;
    }
  }, []);

  const showCustomerCenter = useCallback(async () => {
    try {
      await RevenueCatUI.presentCustomerCenter();
    } catch (error) {
      console.error('[RevenueCat] Customer center error:', error);
    }
  }, []);

  const restorePurchases = useCallback(async () => {
    try {
      const customerInfo = await Purchases.restorePurchases();
      const hasPro = customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
      if (hasPro) {
        Alert.alert('Restored', 'Your subscription has been restored.');
      } else {
        Alert.alert('No Purchases Found', 'No previous subscriptions were found.');
      }
    } catch (error) {
      console.error('[RevenueCat] Restore error:', error);
      Alert.alert('Restore Failed', 'Please try again later.');
    }
  }, []);

  return (
    <RevenueCatContext.Provider
      value={{ isReady, isPro, showPaywall, showCustomerCenter, restorePurchases }}>
      {children}
    </RevenueCatContext.Provider>
  );
}
