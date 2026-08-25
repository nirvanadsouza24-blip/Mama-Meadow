import { useEffect } from "react";
import { useRouter } from "expo-router";
import { useSubscription } from "@/contexts/SubscriptionContext";

/**
 * Call this at the top of a premium screen.
 * If the user is not subscribed (and subscription has finished loading),
 * redirect them to the paywall.
 */
export function usePremiumGate() {
  const { isSubscribed, loading } = useSubscription();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isSubscribed) {
      console.log("[usePremiumGate] User not subscribed — redirecting to paywall");
      router.replace("/paywall");
    }
  }, [isSubscribed, loading, router]);

  return { isSubscribed, loading };
}
