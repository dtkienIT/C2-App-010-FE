import { useCallback, useEffect, useState } from "react";
import { registerPushSubscription } from "./notificationApi";
import type { PushPermissionState } from "./notificationTypes";
import {
  getOrCreatePushSubscription,
  getPermissionState,
  isWebPushEnabledByConfig,
  serializeSubscription,
  supportsWebPush,
} from "./webPushService";

export function usePushSubscription() {
  const [state, setState] = useState<PushPermissionState>(() => getPermissionState());
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const registerExistingPermission = useCallback(async () => {
    if (!isWebPushEnabledByConfig()) {
      setState("disabled_by_config");
      return;
    }
    if (!supportsWebPush()) {
      setState("unsupported");
      return;
    }
    if (Notification.permission !== "granted") {
      setState(Notification.permission);
      return;
    }
    setIsLoading(true);
    setMessage("");
    try {
      const subscription = await getOrCreatePushSubscription();
      await registerPushSubscription(serializeSubscription(subscription));
      setState("registered");
    } catch (error) {
      setState("registration_error");
      setMessage(error instanceof Error ? error.message : "Khong dang ky duoc thong bao.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!supportsWebPush() || Notification.permission !== "granted") {
      setState(getPermissionState());
      return;
    }
    void registerExistingPermission();
  }, [registerExistingPermission]);

  const requestAndRegister = useCallback(async () => {
    if (!isWebPushEnabledByConfig()) {
      setState("disabled_by_config");
      return;
    }
    if (!supportsWebPush()) {
      setState("unsupported");
      return;
    }

    setIsLoading(true);
    setMessage("");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState(permission);
        return;
      }
      const subscription = await getOrCreatePushSubscription();
      await registerPushSubscription(serializeSubscription(subscription));
      setState("registered");
    } catch (error) {
      setState("registration_error");
      setMessage(error instanceof Error ? error.message : "Khong dang ky duoc thong bao.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    message,
    refresh: registerExistingPermission,
    requestAndRegister,
    state,
  };
}
