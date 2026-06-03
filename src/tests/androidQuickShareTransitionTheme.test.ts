import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const stylesPath = join(process.cwd(), "android", "app", "src", "main", "res", "values", "styles.xml");
const noopAnimationPath = join(
  process.cwd(),
  "android",
  "app",
  "src",
  "main",
  "res",
  "anim",
  "quick_share_noop.xml"
);

function readSource(path: string): string {
  return readFileSync(path, "utf8");
}

describe("Android quick share transition theme", () => {
  it("avoids a white launch preview while quick-share completion returns to YouTube", () => {
    const styles = readSource(stylesPath);

    expect(styles).toContain('<item name="windowSplashScreenBackground">#0f172a</item>');
    expect(styles).toContain('<item name="android:windowBackground">#0f172a</item>');
    expect(styles).toContain('<item name="android:windowDisablePreview">true</item>');
    expect(styles).toContain('<item name="android:windowAnimationStyle">@style/AppTheme.NoActionBarLaunch.Animation</item>');
    expect(styles).not.toContain('<item name="windowSplashScreenBackground">#ffffff</item>');
    expect(styles).not.toContain('<item name="android:windowBackground">#ffffff</item>');
  });

  it("keeps MainActivity transitions no-op instead of slide-in animations", () => {
    const styles = readSource(stylesPath);
    const noopAnimation = readSource(noopAnimationPath);

    expect(styles).toContain('<item name="android:activityOpenEnterAnimation">@anim/quick_share_noop</item>');
    expect(styles).toContain('<item name="android:activityOpenExitAnimation">@anim/quick_share_noop</item>');
    expect(styles).toContain('<item name="android:activityCloseEnterAnimation">@anim/quick_share_noop</item>');
    expect(styles).toContain('<item name="android:activityCloseExitAnimation">@anim/quick_share_noop</item>');
    expect(noopAnimation).toContain('android:duration="0"');
    expect(noopAnimation).toContain('android:fromAlpha="1.0"');
    expect(noopAnimation).toContain('android:toAlpha="1.0"');
  });
});
