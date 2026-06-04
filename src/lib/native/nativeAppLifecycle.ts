import { App } from "@capacitor/app";
import { Capacitor, type PluginListenerHandle } from "@capacitor/core";

export function addNativeAppResumeListener(callback: () => void): () => void {
  if (typeof window === "undefined" || !Capacitor.isNativePlatform()) {
    return () => undefined;
  }

  const listenerHandles: Array<Promise<PluginListenerHandle>> = [
    App.addListener("resume", callback),
    App.addListener("appStateChange", ({ isActive }) => {
      if (isActive) {
        callback();
      }
    })
  ];

  return () => {
    for (const listenerHandle of listenerHandles) {
      void listenerHandle.then((handle) => handle.remove());
    }
  };
}
