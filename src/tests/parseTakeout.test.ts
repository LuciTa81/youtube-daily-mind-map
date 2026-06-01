import { describe, expect, it } from "vitest";
import JSZip from "jszip";
import { parseTakeoutFile, parseTakeoutHtml, parseTakeoutJson, parseTakeoutZip } from "@/lib/import/parseTakeout";

describe("Takeout watch history parser", () => {
  it("parses YouTube Takeout JSON entries", () => {
    const result = parseTakeoutJson(
      JSON.stringify([
        {
          header: "YouTube",
          title: "Watched Next.js App Router 강의",
          titleUrl: "https://www.youtube.com/watch?v=next",
          subtitles: [{ name: "생활코딩", url: "https://www.youtube.com/@opentutorials" }],
          time: "2026-05-27T10:30:00Z"
        }
      ])
    );

    expect(result.source).toBe("takeout-json");
    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({
      title: "Next.js App Router 강의",
      url: "https://www.youtube.com/watch?v=next",
      channelName: "생활코딩",
      source: "takeout-json"
    });
  });

  it("parses English Takeout HTML entries", () => {
    const html = `
      <html><body>
        <div class="outer-cell mdl-cell">
          <div class="content-cell mdl-cell">
            Watched&nbsp;<a href="https://www.youtube.com/watch?v=abc">Official MV</a><br>
            <a href="https://www.youtube.com/@music">MUSIC LAB</a><br>
            May 27, 2026, 10:30:00 PM KST
          </div>
        </div>
      </body></html>
    `;
    const result = parseTakeoutHtml(html);

    expect(result.source).toBe("takeout-html");
    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({
      title: "Official MV",
      channelName: "MUSIC LAB",
      source: "takeout-html"
    });
  });

  it("parses Korean Takeout HTML date text", () => {
    const html = `
      <div class="outer-cell mdl-cell">
        <div class="content-cell mdl-cell">
          시청함 <a href="https://www.youtube.com/watch?v=abc">비트코인 ETF 전망</a><br>
          <a href="https://www.youtube.com/@money">슈카월드</a><br>
          2026. 5. 28. 오전 1:30:00 KST
        </div>
      </div>
    `;
    const result = parseTakeoutFile("watch-history.html", html);

    expect(result.items).toHaveLength(1);
    expect(result.items[0].title).toBe("비트코인 ETF 전망");
    expect(result.items[0].watchedAt).toBe("2026-05-27T16:30:00.000Z");
  });

  it("finds watch-history.json inside a Takeout ZIP", async () => {
    const zip = new JSZip();
    zip.file("Takeout/YouTube and YouTube Music/history/watch-history.json", JSON.stringify([
      {
        header: "YouTube",
        title: "Watched Official MV",
        titleUrl: "https://www.youtube.com/watch?v=mv",
        subtitles: [{ name: "MUSIC LAB" }],
        time: "2026-05-27T12:00:00Z"
      }
    ]));
    zip.file("Takeout/archive_browser.html", "<html></html>");

    const content = await zip.generateAsync({ type: "arraybuffer" });
    const result = await parseTakeoutZip("takeout.zip", content);

    expect(result.source).toBe("takeout-zip");
    expect(result.parserSource).toBe("takeout-json");
    expect(result.matchedFileName).toBe("Takeout/YouTube and YouTube Music/history/watch-history.json");
    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({
      title: "Official MV",
      channelName: "MUSIC LAB",
      source: "takeout-json"
    });
  });

  it("finds localized watch-history.html inside a Takeout ZIP", async () => {
    const zip = new JSZip();
    zip.file(
      "Takeout/YouTube 및 YouTube Music/기록/watch-history.html",
      `
        <div class="outer-cell mdl-cell">
          <div class="content-cell mdl-cell">
            시청함 <a href="https://www.youtube.com/watch?v=abc">Next.js App Router 강의</a><br>
            <a href="https://www.youtube.com/@opentutorials">생활코딩</a><br>
            2026. 5. 28. 오전 1:30:00 KST
          </div>
        </div>
      `
    );

    const content = await zip.generateAsync({ type: "arraybuffer" });
    const result = await parseTakeoutZip("takeout.zip", content);

    expect(result.source).toBe("takeout-zip");
    expect(result.parserSource).toBe("takeout-html");
    expect(result.items).toHaveLength(1);
    expect(result.items[0].title).toBe("Next.js App Router 강의");
  });
});
