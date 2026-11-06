import * as React from "react";
import MemberJoinButton from "./MemberJoinButton";

/** Homepage announcement only. The membership page and #guides list arrive in Part 2. */
export default function WorkingTennisProBanner() {
  return (
    <section
      aria-labelledby="working-tennis-pro-heading"
      data-testid="working-tennis-pro-banner"
      className="border-b border-white/10 bg-[#0D1B2A] py-10 text-white sm:py-12 lg:py-14"
    >
      <div className="container">
        <div className="max-w-4xl">
          <p className="mb-4 text-[11px] font-semibold uppercase leading-relaxed tracking-[0.16em] text-[#F3C85D] sm:text-xs">
            NEW · A MEMBERSHIP FOR COACHES, BY A COACH
          </p>
          <h2
            id="working-tennis-pro-heading"
            className="mb-5 text-white"
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: "clamp(2.25rem, 5vw, 4rem)",
              fontWeight: 700,
              lineHeight: 1.08,
            }}
          >
            AI for the Working Tennis Pro
          </h2>
          <p className="mb-7 max-w-3xl text-base leading-relaxed text-white/85 sm:text-lg">
            Everything I use AI for at my academy — the app that runs my billing, the daily videos that market it, the assistant that keeps my days straight — written up as step-by-step guides any working pro can follow.
          </p>
          <div className="grid max-w-md grid-cols-2 gap-3 sm:flex sm:max-w-none">
            <MemberJoinButton className="px-3 sm:px-6" />
            <a
              href="/ai-for-the-working-tennis-pro#guides"
              className="inline-flex min-h-12 items-center justify-center rounded-lg border border-white/75 bg-transparent px-3 py-3 text-center text-sm font-semibold text-white transition-colors duration-150 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white sm:px-6 sm:text-base"
            >
              See the guides
            </a>
          </div>
          <p className="mt-4 max-w-3xl text-xs leading-relaxed text-white/70 sm:text-sm">
            For members: every guide, the prompt library, and new guides as I add them. Cancel anytime.
          </p>
        </div>
      </div>
    </section>
  );
}
