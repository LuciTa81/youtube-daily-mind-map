import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.lucita81.youtubedailymindmap",
  appName: "YouTube Daily Mind Map",
  webDir: "out",
  server: {
    androidScheme: "https"
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: false,
      backgroundColor: "#0f172a",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP"
    },
    StatusBar: {
      style: "LIGHT",
      backgroundColor: "#f1f5f9"
    }
  }
};

export default config;
