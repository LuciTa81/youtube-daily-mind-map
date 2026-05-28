"use client";

import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

const DISMISSED_KEY = "youtube-daily-mind-map-install-dismissed";

function isIosDevice(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isStandaloneMode(): boolean {
  const navigatorWithStandalone = navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || navigatorWithStandalone.standalone === true;
}

function wasDismissed(): boolean {
  try {
    return window.localStorage.getItem(DISMISSED_KEY) === "true";
  } catch {
    return false;
  }
}

function rememberDismissed(): void {
  try {
    window.localStorage.setItem(DISMISSED_KEY, "true");
  } catch {
    // Ignored because localStorage can be unavailable in private modes.
  }
}

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent>();
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    if (isStandaloneMode() || wasDismissed()) {
      return;
    }

    const ios = isIosDevice();
    setIsIos(ios);
    setShowPrompt(ios);

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      return;
    }

    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(undefined);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    rememberDismissed();
    setShowPrompt(false);
  };

  if (!showPrompt) {
    return null;
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">폰에 앱처럼 설치</h2>
          <p className="mt-1 text-xs leading-relaxed text-slate-500">
            홈 화면에서 바로 열 수 있게 추가합니다. 시청 기록 파일은 지금처럼 브라우저 안에서만 읽습니다.
          </p>
        </div>
        <button
          type="button"
          className="rounded-md px-2 py-1 text-xs font-semibold text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          onClick={handleDismiss}
          aria-label="설치 안내 닫기"
        >
          닫기
        </button>
      </div>

      {deferredPrompt ? (
        <button
          type="button"
          className="mt-3 w-full rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-700"
          onClick={handleInstall}
        >
          앱 설치
        </button>
      ) : null}

      {isIos ? (
        <div className="mt-3 rounded-md bg-slate-100 p-3 text-xs leading-relaxed text-slate-600">
          iPhone/iPad에서는 Safari 공유 버튼을 누른 뒤 <span className="font-semibold text-slate-800">홈 화면에 추가</span>를 선택하세요.
        </div>
      ) : null}
    </section>
  );
}
