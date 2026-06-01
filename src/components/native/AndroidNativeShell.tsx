"use client";

import { useEffect } from "react";
import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { SplashScreen } from "@capacitor/splash-screen";
import { StatusBar, Style } from "@capacitor/status-bar";

export function AndroidNativeShell() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    document.documentElement.classList.add("capacitor-native");
    document.documentElement.style.setProperty("--native-safe-area-top", "32px");
    document.documentElement.style.setProperty("--native-safe-area-bottom", "10px");

    void StatusBar.setOverlaysWebView({ overlay: false }).catch(() => undefined);
    void StatusBar.setBackgroundColor({ color: "#f1f5f9" }).catch(() => undefined);
    void StatusBar.setStyle({ style: Style.Light }).catch(() => undefined);
    void SplashScreen.hide().catch(() => undefined);

    const backButtonListener = App.addListener("backButton", ({ canGoBack }) => {
      if (canGoBack) {
        window.history.back();
        return;
      }

      void App.minimizeApp();
    });

    return () => {
      document.documentElement.classList.remove("capacitor-native");
      document.documentElement.style.removeProperty("--native-safe-area-top");
      document.documentElement.style.removeProperty("--native-safe-area-bottom");
      void backButtonListener.then((listener) => listener.remove());
    };
  }, []);

  return null;
}
