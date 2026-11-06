import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import WorkingTennisProBanner from "../client/src/components/WorkingTennisProBanner";

const root = new URL("../", import.meta.url);
const home = readFileSync(new URL("client/src/pages/Home.tsx", root), "utf8");

function renderBanner() {
  return renderToStaticMarkup(createElement(WorkingTennisProBanner));
}

describe("working tennis pro homepage announcement", () => {
  it("includes exactly the approved copy, with no dictated aside", () => {
    const html = renderBanner();
    for (const text of [
      "NEW · A MEMBERSHIP FOR COACHES, BY A COACH",
      "AI for the Working Tennis Pro",
      "Everything I use AI for at my academy — the app that runs my billing, the daily videos that market it, the assistant that keeps my days straight — written up as step-by-step guides any working pro can follow.",
      "Join — $20/month",
      "See the guides",
      "For members: every guide, the prompt library, and new guides as I add them. Cancel anytime.",
    ]) {
      expect(html).toContain(text);
    }
    expect(html).not.toContain("let&#x27;s do this");
    expect(html.match(/<a\s/g)).toHaveLength(2);
  });

  it("links to the Part 2 membership page and its guides anchor", () => {
    const html = renderBanner();
    expect(html).toContain('href="/ai-for-the-working-tennis-pro"');
    expect(html).toContain('href="/ai-for-the-working-tennis-pro#guides"');
  });

  it("places the announcement before the original Elevate Your Game hero", () => {
    const bannerIndex = home.indexOf("<WorkingTennisProBanner />");
    expect(bannerIndex).toBeGreaterThan(0);
    expect(bannerIndex).toBeLessThan(home.indexOf("HERO SECTION"));
    expect(bannerIndex).toBeLessThan(home.indexOf("ELEVATE YOUR GAME."));
    const app = readFileSync(new URL("client/src/App.tsx", root), "utf8");
    expect(app.indexOf("<Navbar />")).toBeLessThan(app.indexOf('<Route path="/" component={Home} />'));
  });

  it("preserves every original homepage byte apart from the new import and banner insertion", () => {
    // Last saved homepage before the announcement; retained as a regression baseline.
    const original = execFileSync("git", ["show", "6b65cef5:client/src/pages/Home.tsx"], {
      cwd: root,
      encoding: "utf8",
    });
    const withoutBanner = home
      .replace('import WorkingTennisProBanner from "@/components/WorkingTennisProBanner";\n', "")
      .replace("      <WorkingTennisProBanner />\n", "");
    expect(withoutBanner).toBe(original);
  });

  it("uses an accessible heading and side-by-side mobile buttons", () => {
    const html = renderBanner();
    expect(html).toContain('aria-labelledby="working-tennis-pro-heading"');
    expect(html).toContain('id="working-tennis-pro-heading"');
    expect(html).toContain("grid-cols-2");
    expect(html).toContain("bg-[#0D1B2A]");
    expect(html).toContain("bg-[#F3C85D]");
    expect(html).toContain("border-white/75");
  });
});
