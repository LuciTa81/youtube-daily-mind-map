import JSZip from "jszip";
import type { DateSettings } from "@/types/watch";

type FixtureTakeoutJsonEntry = {
  header: string;
  title?: string;
  titleUrl?: string;
  subtitles?: Array<{
    name: string;
    url?: string;
  }>;
  time?: string;
};

export const TAKEOUT_FIXTURE_DATE_SETTINGS: DateSettings = {
  timezone: "Asia/Seoul",
  boundaryMode: "calendar-day",
  lifestyleBoundaryHour: 4
};

export const TAKEOUT_FIXTURE_JSON_ENTRIES: FixtureTakeoutJsonEntry[] = [
  {
    header: "YouTube",
    title: "Watched Next.js App Router \uAC15\uC758",
    titleUrl: "https://www.youtube.com/watch?v=next01",
    subtitles: [{ name: "\uC0DD\uD65C\uCF54\uB529", url: "https://www.youtube.com/@opentutorials" }],
    time: "2026-05-27T01:30:00Z"
  },
  {
    header: "YouTube",
    title: "Watched React Server Components \uC815\uB9AC",
    titleUrl: "https://www.youtube.com/watch?v=react02",
    subtitles: [{ name: "\uC0DD\uD65C\uCF54\uB529", url: "https://www.youtube.com/@opentutorials" }],
    time: "2026-05-27T02:00:00Z"
  },
  {
    header: "YouTube",
    title: "Watched \uBE44\uD2B8\uCF54\uC778 ETF \uC804\uB9DD",
    titleUrl: "https://www.youtube.com/watch?v=btc03",
    subtitles: [{ name: "\uBA38\uB2C8\uB178\uD2B8", url: "https://www.youtube.com/@moneynote" }],
    time: "2026-05-27T05:00:00Z"
  },
  {
    header: "YouTube",
    title: "Watched Official MV - Summer Night",
    titleUrl: "https://www.youtube.com/watch?v=mv01",
    subtitles: [{ name: "MUSIC LAB", url: "https://www.youtube.com/@musiclab" }],
    time: "2026-05-27T14:30:00Z"
  },
  {
    header: "YouTube",
    title: "Watched \uBC1C\uB85C\uB780\uD2B8 \uD558\uC774\uB77C\uC774\uD2B8",
    titleUrl: "https://www.youtube.com/watch?v=game04",
    subtitles: [{ name: "Game Arena", url: "https://www.youtube.com/@gamearena" }],
    time: "2026-05-27T16:30:00Z"
  },
  {
    header: "YouTube",
    title: undefined,
    titleUrl: "https://www.youtube.com/watch?v=skip",
    subtitles: [{ name: "Broken Entry" }],
    time: "2026-05-27T18:00:00Z"
  }
];

export const TAKEOUT_FIXTURE_HTML_HISTORY = `
  <html>
    <body>
      <div class="outer-cell mdl-cell">
        <div class="content-cell mdl-cell">
          Watched <a href="https://www.youtube.com/watch?v=mv01">Official MV - Summer Night</a><br>
          <a href="https://www.youtube.com/@musiclab">MUSIC LAB</a><br>
          May 27, 2026, 11:30:00 PM KST
        </div>
      </div>
      <div class="outer-cell mdl-cell">
        <div class="content-cell mdl-cell">
          \uC2DC\uCCAD\uD55C \uB3D9\uC601\uC0C1:
          <a href="https://www.youtube.com/watch?v=short05">YouTube Shorts \uB9AC\uC561\uC158 \uBAA8\uC74C</a><br>
          <a href="https://www.youtube.com/@shortclip">\uC9E7\uC740\uD074\uB9BD</a><br>
          2026. 5. 28. \uC624\uC804 2:10:00 KST
        </div>
      </div>
    </body>
  </html>
`;

async function toArrayBuffer(zip: JSZip): Promise<ArrayBuffer> {
  return zip.generateAsync({ type: "arraybuffer" });
}

export async function buildJsonTakeoutFixtureZip(): Promise<ArrayBuffer> {
  const zip = new JSZip();
  zip.file("Takeout/archive_browser.html", "<html><body>Takeout index</body></html>");
  zip.file("Takeout/YouTube and YouTube Music/subscriptions/subscriptions.json", "[]");
  zip.file(
    "Takeout/YouTube and YouTube Music/history/watch-history.json",
    JSON.stringify(TAKEOUT_FIXTURE_JSON_ENTRIES, null, 2)
  );
  zip.file("Takeout/YouTube and YouTube Music/playlists/playlists.json", "[]");

  return toArrayBuffer(zip);
}

export async function buildHtmlTakeoutFixtureZip(): Promise<ArrayBuffer> {
  const zip = new JSZip();
  zip.file("Takeout/archive_browser.html", "<html><body>Takeout index</body></html>");
  zip.file("Takeout/YouTube and YouTube Music/comments/comments.json", "[]");
  zip.file("Takeout/YouTube and YouTube Music/history/watch-history.html", TAKEOUT_FIXTURE_HTML_HISTORY);

  return toArrayBuffer(zip);
}

export async function buildFallbackHtmlTakeoutFixtureZip(): Promise<ArrayBuffer> {
  const zip = new JSZip();
  zip.file("Takeout/YouTube and YouTube Music/comments/comments.json", "[]");
  zip.file("Takeout/YouTube and YouTube Music/history/watch-history.json", "{ not valid json");
  zip.file("Takeout/YouTube and YouTube Music/history/watch-history.html", TAKEOUT_FIXTURE_HTML_HISTORY);
  zip.file("Takeout/YouTube and YouTube Music/video metadata/video-metadata.csv", "title,channel\n");

  return toArrayBuffer(zip);
}

export async function buildNoWatchHistoryFixtureZip(): Promise<ArrayBuffer> {
  const zip = new JSZip();
  zip.file("Takeout/archive_browser.html", "<html><body>Takeout index</body></html>");
  zip.file("Takeout/YouTube and YouTube Music/subscriptions/subscriptions.json", "[]");
  zip.file("Takeout/YouTube and YouTube Music/comments/comments.json", "[]");
  zip.file("Takeout/YouTube and YouTube Music/playlists/playlists.json", "[]");

  return toArrayBuffer(zip);
}
