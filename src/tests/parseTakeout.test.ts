import { describe, expect, it } from "vitest";
import { parseTakeoutFile, parseTakeoutHtml, parseTakeoutJson } from "@/lib/import/parseTakeout";

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
});
