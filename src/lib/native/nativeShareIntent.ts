import { Capacitor, registerPlugin, type PluginListenerHandle } from "@capacitor/core";
import type { SharedYouTubePayload } from "@/lib/share/sharedYouTubeVideo";

export const NATIVE_SHARE_EVENT_NAME = "youtubeMindMap:nativeShare";
const NATIVE_SHARE_RECEIVED_EVENT_NAME = "shareReceived";

export type NativeShareIntentDetail = SharedYouTubePayload & {
  action?: string;
  pendingShareId?: string;
  source?: string;
};

type NativeShareIntentDrainResult = {
  shares?: NativeShareIntentDetail[];
};

type NativeShareIntentPlugin = {
  drainPendingShares: () => Promise<NativeShareIntentDrainResult>;
  ackPendingShares: (options: { ids: string[] }) => Promise<void>;
  clearPendingShares: () => Promise<void>;
  setQuickShareSaveEnabled: (options: { enabled: boolean }) => Promise<void>;
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

export async function drainPendingNativeShareIntents(): Promise<NativeShareIntentDetail[]> {
  if (!isNativeShareIntentAvailable()) {
    return [];
  }

  const result = await NativeShareIntent.drainPendingShares();
  return Array.isArray(result.shares) ? result.shares : [];
}

export async function ackPendingNativeShareIntents(ids: string[]): Promise<void> {
  if (!isNativeShareIntentAvailable() || ids.length === 0) {
    return;
  }

  await NativeShareIntent.ackPendingShares({ ids });
}

export async function clearNativePendingShareIntents(): Promise<void> {
  if (!isNativeShareIntentAvailable()) {
    return;
  }

  await NativeShareIntent.clearPendingShares();
}

export async function setNativeQuickShareSaveEnabled(enabled: boolean): Promise<void> {
  if (!isNativeShareIntentAvailable()) {
    return;
  }

  await NativeShareIntent.setQuickShareSaveEnabled({ enabled });
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
