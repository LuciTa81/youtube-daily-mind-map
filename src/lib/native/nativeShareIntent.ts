import { Capacitor, registerPlugin, type PluginListenerHandle } from "@capacitor/core";
import type { SharedYouTubePayload } from "@/lib/share/sharedYouTubeVideo";

export const NATIVE_SHARE_EVENT_NAME = "youtubeMindMap:nativeShare";
const NATIVE_SHARE_RECEIVED_EVENT_NAME = "shareReceived";

export type NativeShareIntentDetail = SharedYouTubePayload & {
  action?: string;
};

type NativeShareIntentResult = NativeShareIntentDetail & {
  hasShare?: boolean;
};

type NativeShareIntentPlugin = {
  consumePendingShare: () => Promise<NativeShareIntentResult>;
  completeQuickShare: (options: { message: string }) => Promise<void>;
  addListener: (
    eventName: typeof NATIVE_SHARE_RECEIVED_EVENT_NAME,
    listenerFunc: (detail: NativeShareIntentDetail) => void
  ) => Promise<PluginListenerHandle>;
};

const NativeShareIntent = registerPlugin<NativeShareIntentPlugin>("NativeShareIntent");

function isNativeShareIntentAvailable(): boolean {
  return Capacitor.getPlatform() === "android";
}

export async function consumePendingNativeShareIntent(): Promise<NativeShareIntentDetail | undefined> {
  if (!isNativeShareIntentAvailable()) {
    return undefined;
  }

  const result = await NativeShareIntent.consumePendingShare();
  if (!result.hasShare) {
    return undefined;
  }

  return result;
}

export async function completeNativeQuickShare(message: string): Promise<void> {
  if (!isNativeShareIntentAvailable()) {
    return;
  }

  await NativeShareIntent.completeQuickShare({ message });
}

export function addNativeShareIntentListener(
  callback: (detail: NativeShareIntentDetail) => void
): () => void {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  if (isNativeShareIntentAvailable()) {
    let removed = false;
    let handle: PluginListenerHandle | undefined;

    void NativeShareIntent.addListener(NATIVE_SHARE_RECEIVED_EVENT_NAME, (detail) => {
      void NativeShareIntent.consumePendingShare().catch(() => undefined);
      callback(detail);
    }).then((listenerHandle) => {
      if (removed) {
        void listenerHandle.remove();
        return;
      }

      handle = listenerHandle;
    });

    return () => {
      removed = true;
      void handle?.remove();
    };
  }

  const listener = (event: Event) => {
    const detail = (event as CustomEvent<NativeShareIntentDetail>).detail;
    if (!detail) {
      return;
    }
    callback(detail);
  };

  window.addEventListener(NATIVE_SHARE_EVENT_NAME, listener);
  return () => window.removeEventListener(NATIVE_SHARE_EVENT_NAME, listener);
}
