import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium } from "playwright";

const DEFAULT_APP_URL = "http://127.0.0.1:3001";
const DEFAULT_OUTPUT_DIR = ".codex/import-surface-smoke";
const DEFAULT_WIDTH = 390;
const DEFAULT_HEIGHT = 844;

function parseInteger(value, fallback) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

async function clickFirstVisible(locator, label) {
  const count = await locator.count();
  for (let index = 0; index < count; index += 1) {
    const candidate = locator.nth(index);
    if (await candidate.isVisible().catch(() => false)) {
      await candidate.click({ timeout: 15_000 });
      return;
    }
  }

  throw new Error(`${label} was not visible.`);
}

async function main() {
  const appUrl = process.env.APP_URL ?? process.argv[2] ?? DEFAULT_APP_URL;
  const outputDir = resolve(process.env.SMOKE_OUTPUT_DIR ?? DEFAULT_OUTPUT_DIR);
  const viewport = {
    width: parseInteger(process.env.SMOKE_VIEWPORT_WIDTH, DEFAULT_WIDTH),
    height: parseInteger(process.env.SMOKE_VIEWPORT_HEIGHT, DEFAULT_HEIGHT)
  };

  await mkdir(outputDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport });
    await page.goto(appUrl, { waitUntil: "domcontentloaded", timeout: 45_000 });
    await page.waitForLoadState("networkidle", { timeout: 5_000 }).catch(() => undefined);

    await clickFirstVisible(page.locator("button").filter({ hasText: /^설정$/ }), "Settings button");
    await page.getByRole("heading", { name: "가져오기와 설정" }).first().waitFor({
      state: "visible",
      timeout: 15_000
    });

    const importSection = page.locator("section").filter({ hasText: "Takeout 가져오기" }).first();
    await importSection.waitFor({ state: "visible", timeout: 15_000 });

    const primaryAction = importSection
      .getByRole("button", { name: /ZIP\/파일 선택|Google Drive ZIP 선택/ })
      .first();
    await primaryAction.waitFor({ state: "visible", timeout: 15_000 });

    const fullPagePath = resolve(outputDir, "import-page-390.png");
    const sectionPath = resolve(outputDir, "import-section-390.png");
    const reportPath = resolve(outputDir, "import-surface-390.json");

    await page.screenshot({ path: fullPagePath, fullPage: true });
    await importSection.screenshot({ path: sectionPath });

    const sectionBox = await importSection.boundingBox();
    const primaryActionBox = await primaryAction.boundingBox();
    const hasHorizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    const hasLocalFirstCopy = await importSection.getByText("서버로 업로드하지 않습니다.").count();
    const hasTakeoutLink = await importSection.getByRole("link", { name: "Drive로 Takeout 만들기" }).count();
    const hasHelpDisclosure = await importSection.getByText("도움말 보기").count();
    const primaryActionText = (await primaryAction.textContent())?.trim() ?? "";

    const report = {
      appUrl,
      viewport,
      evidence: {
        fullPageScreenshot: fullPagePath,
        importSectionScreenshot: sectionPath
      },
      checks: {
        importSectionVisible: Boolean(sectionBox),
        primaryActionVisible: Boolean(primaryActionBox),
        primaryActionText,
        primaryActionTopWithinViewport:
          primaryActionBox?.y !== undefined ? primaryActionBox.y < viewport.height : false,
        noHorizontalOverflow: !hasHorizontalOverflow,
        hasLocalFirstCopy: hasLocalFirstCopy > 0,
        hasTakeoutLink: hasTakeoutLink > 0,
        hasHelpDisclosure: hasHelpDisclosure > 0
      },
      geometry: {
        importSection: sectionBox,
        primaryAction: primaryActionBox
      }
    };

    await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

    if (!report.checks.importSectionVisible || !report.checks.primaryActionVisible) {
      throw new Error("Import surface smoke failed: import section or primary action was not visible.");
    }
    if (!report.checks.primaryActionTopWithinViewport) {
      throw new Error("Import surface smoke failed: primary action is not visible in the first viewport.");
    }
    if (!report.checks.noHorizontalOverflow) {
      throw new Error("Import surface smoke failed: 390px viewport has horizontal overflow.");
    }
    if (!report.checks.hasLocalFirstCopy || !report.checks.hasTakeoutLink || !report.checks.hasHelpDisclosure) {
      throw new Error("Import surface smoke failed: expected import guidance was missing.");
    }

    console.log(JSON.stringify(report, null, 2));
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
