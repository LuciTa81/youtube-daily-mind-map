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
      void backButtonListener.then((listener) => listener.remove());
    };
  }, []);

  return null;
}
