import type { Metadata, Viewport } from "next";
import { PwaRegistration } from "@/components/pwa/PwaRegistration";
import "@xyflow/react/dist/style.css";
import "./globals.css";

export const metadata: Metadata = {
  applicationName: "YouTube Daily Mind Map",
  title: "YouTube Daily Mind Map",
  description: "하루 YouTube 시청기록을 날짜별 마인드맵으로 보여주는 웹앱",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Daily Mind Map"
  },
  formatDetection: {
    telephone: false
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { url: "/icons/app-icon.svg", type: "image/svg+xml" }
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }]
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0f172a"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        <PwaRegistration />
        {children}
      </body>
    </html>
  );
}
