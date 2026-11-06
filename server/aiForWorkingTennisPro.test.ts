import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { describe, expect, it, vi } from "vitest";
vi.mock("../client/src/components/MemberJoinButton", () => ({ default: () => createElement("button", { type: "button" }, "Join — $20/month") }));

import AIForWorkingTennisPro, {
  scrollToMembershipGuides,
} from "../client/src/pages/AIForWorkingTennisPro";

const root = new URL("../", import.meta.url);
const html = renderToStaticMarkup(createElement(AIForWorkingTennisPro));
const text = html.replace(/<[^>]+>/g, " ").replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/\s+/g, " ");

describe("AI for the Working Tennis Pro membership page", () => {
  it("renders the five requested sections in order", () => {
    expect(html.match(/<section\b/g)).toHaveLength(5);
    const positions = [
      'id="membership-heading"',
      'id="working-coach-heading"',
      'id="guides-heading"',
      'id="how-it-works-heading"',
      'aria-label="Membership questions"',
    ].map(id => html.indexOf(id));
    expect(positions.every(position => position >= 0)).toBe(true);
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
    expect(text).toContain("AI for the Working Tennis Pro");
    expect(text).toContain("From a working coach, not a tech company");
    expect(text).toContain("Inside the membership");
    expect(text).toContain("How it works");
  });

  it("preserves the exact supplied introduction, biography, and how-it-works copy", () => {
    for (const paragraph of [
      "Step-by-step PDF guides for tennis coaches who want AI to do the heavy lifting off the court — written by a working coach, from a real academy.",
      "I'm Mario Llano — 25 years running RI Tennis Academy in Rhode Island, and junior coach of Jared Donaldson before he reached ATP No. 48. Two years ago I started learning AI properly. It now runs my academy's attendance and billing (149 students), produces my daily teaching videos, and helps me stay on top of payments, email, and scheduling. This membership is where I teach other pros to do the same — from my own academy, nothing theoretical.",
      "Subscribe once, get the whole library. $20/month — less than one hour of the admin time these guides give back each week. Read a guide on your phone between lessons, follow it step by step, and keep the prompts forever. New guides land as I finish them at the academy. Cancel anytime; the guides you've downloaded are yours to keep.",
    ]) expect(text).toContain(paragraph);
  });

  it("includes exactly six guides with the approved titles, descriptions, and tags", () => {
    expect(html.match(/data-guide-card/g)).toHaveLength(6);
    const guides = [
      ["Build Your Academy App with AI", "Attendance, rosters, balances, invoices — how I built the app that runs my academy with an AI builder, no developer and no code, and how to build yours.", "PDF + templates"],
      ["Make a 30-Second Teaching Drama", "My complete micro-drama method: script first, shot-by-shot AI video prompts, camera moves, voices, and the rules that keep dialogue clean — the whole production recipe.", "PDF + prompt examples"],
      ["Marketing Videos with AI", "Episode ideas from real academy life, thumbnails that stop thumbs, captions and hashtags, and a daily posting rhythm you can actually keep.", "PDF + checklists"],
      ["Your AI Assistant, Every Day", "How I use my AI assistant like a great front-desk hire: checking who paid against who showed up, triaging email, watching the weather for rain-outs, drafting parent messages, and keeping deadlines from slipping.", "PDF + workflows"],
      ["The Prompt Library", "Every prompt I actually use — video generation, parent emails, lesson plans, social posts — organized and ready to copy, paste, and make your own.", "Library, updated monthly"],
      ["New Guides as I Learn Them", "I'm learning AI in public. When a new workflow earns its place at my academy, it becomes a guide here — members get everything, including the mistakes to skip.", "Included in membership"],
    ];
    for (const guide of guides) for (const copy of guide) expect(text).toContain(copy);
    const positions = guides.map(([title]) => text.indexOf(title));
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
  });

  it("offers two Join buttons without initiating payment or advertising fake downloads", () => {
    expect(html.match(/Join — \$20\/month/g)).toHaveLength(2);
    expect(html.match(/<button type="button"/g)).toHaveLength(2);
    expect(html).not.toContain("checkout.stripe.com");
    expect(html).not.toContain("download=");
    const source = readFileSync(new URL("client/src/pages/AIForWorkingTennisPro.tsx", root), "utf8");
    expect(source).toContain("return <MemberJoinButton />;");
  });

  it("supports the homepage See the guides link without scrolling unrelated hashes", () => {
    expect(html).toContain('id="guides"');
    expect(html).toContain("scroll-mt-24");
    const scrollIntoView = vi.fn();
    scrollToMembershipGuides("#guides", { scrollIntoView });
    expect(scrollIntoView).toHaveBeenCalledWith({ block: "start", behavior: "instant" });
    scrollIntoView.mockClear();
    scrollToMembershipGuides("", { scrollIntoView });
    scrollToMembershipGuides("#other", { scrollIntoView });
    expect(scrollIntoView).not.toHaveBeenCalled();
    expect(() => scrollToMembershipGuides("#guides", null)).not.toThrow();
  });

  it("uses the supplied email and telephone details", () => {
    expect(text).toContain("Questions? Email Coach Mario at ritennismario@gmail.com or call/text (401) 965-5873 .");
    expect(html).toContain('href="mailto:ritennismario@gmail.com"');
    expect(html).toContain('href="tel:+14019655873"');
  });

  it("only adds a route, leaving existing routing and global scrolling unchanged", () => {
    const app = readFileSync(new URL("client/src/App.tsx", root), "utf8");
    expect(app).toContain('<Route path="/ai-for-the-working-tennis-pro" component={AIForWorkingTennisPro} />');
    const withoutAddition = app
      .replace('import AIForWorkingTennisPro from "./pages/AIForWorkingTennisPro";\n', "")
      .replace('          <Route path="/ai-for-the-working-tennis-pro" component={AIForWorkingTennisPro} />\n', "")
      .replace('import AIMembers from "./pages/AIMembers";\n', "")
      .replace('import AIMemberSignIn from "./pages/AIMemberSignIn";\n', "")
      .replace('import AdminAIMembers from "./pages/AdminAIMembers";\n', "")
      .replace('          <Route path="/ai-members/sign-in" component={AIMemberSignIn} />\n', "")
      .replace('          <Route path="/ai-members" component={AIMembers} />\n', "")
      .replace('          <Route path="/admin/ai-members" component={AdminAIMembers} />\n', "");
    const original = execFileSync("git", ["show", "98d58635:client/src/App.tsx"], { cwd: root, encoding: "utf8" });
    expect(withoutAddition).toBe(original);
    const home = readFileSync(new URL("client/src/pages/Home.tsx", root), "utf8");
    const originalHome = execFileSync("git", ["show", "98d58635:client/src/pages/Home.tsx"], { cwd: root, encoding: "utf8" });
    expect(home).toBe(originalHome);
  });
});
