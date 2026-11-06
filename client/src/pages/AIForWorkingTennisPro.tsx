import * as React from "react";
import { FileText, Clapperboard, Megaphone, CalendarCheck, BookOpen, Lightbulb } from "lucide-react";
import MemberJoinButton from "@/components/MemberJoinButton";

const MARIO_PHOTO = "https://d2xsxph8kpxj0f.cloudfront.net/310519663342968318/kzZFsCRUb4iWMZR8LEwAKz/mario-us-open_68ad2763.jpg";
const headingStyle = { fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700 };

export const membershipGuides = [
  {
    title: "Build Your Academy App with AI",
    description: "Attendance, rosters, balances, invoices — how I built the app that runs my academy with an AI builder, no developer and no code, and how to build yours.",
    tag: "PDF + templates",
    icon: FileText,
  },
  {
    title: "Make a 30-Second Teaching Drama",
    description: "My complete micro-drama method: script first, shot-by-shot AI video prompts, camera moves, voices, and the rules that keep dialogue clean — the whole production recipe.",
    tag: "PDF + prompt examples",
    icon: Clapperboard,
  },
  {
    title: "Marketing Videos with AI",
    description: "Episode ideas from real academy life, thumbnails that stop thumbs, captions and hashtags, and a daily posting rhythm you can actually keep.",
    tag: "PDF + checklists",
    icon: Megaphone,
  },
  {
    title: "Your AI Assistant, Every Day",
    description: "How I use my AI assistant like a great front-desk hire: checking who paid against who showed up, triaging email, watching the weather for rain-outs, drafting parent messages, and keeping deadlines from slipping.",
    tag: "PDF + workflows",
    icon: CalendarCheck,
  },
  {
    title: "The Prompt Library",
    description: "Every prompt I actually use — video generation, parent emails, lesson plans, social posts — organized and ready to copy, paste, and make your own.",
    tag: "Library, updated monthly",
    icon: BookOpen,
  },
  {
    title: "New Guides as I Learn Them",
    description: "I'm learning AI in public. When a new workflow earns its place at my academy, it becomes a guide here — members get everything, including the mistakes to skip.",
    tag: "Included in membership",
    icon: Lightbulb,
  },
];

export function scrollToMembershipGuides(hash: string, target: Pick<HTMLElement, "scrollIntoView"> | null) {
  if (hash === "#guides") target?.scrollIntoView({ block: "start", behavior: "instant" });
}

function JoinButton() {
  return <MemberJoinButton />;
}

export default function AIForWorkingTennisPro() {
  React.useEffect(() => {
    const previousTitle = document.title;
    document.title = "AI for the Working Tennis Pro | Coach Mario Llano";
    // Run after the existing global route scroll effect, without changing it.
    let frame: number | undefined;
    const scheduleScroll = () => {
      if (frame !== undefined) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        scrollToMembershipGuides(window.location.hash, document.getElementById("guides"));
      });
    };
    scheduleScroll();
    window.addEventListener("hashchange", scheduleScroll);
    return () => {
      if (frame !== undefined) cancelAnimationFrame(frame);
      window.removeEventListener("hashchange", scheduleScroll);
      document.title = previousTitle;
    };
  }, []);

  return (
    <article data-testid="ai-working-tennis-pro-page" className="bg-background text-foreground">
      <section aria-labelledby="membership-heading" className="border-b border-white/10 bg-[#0D1B2A] py-14 text-white sm:py-16 lg:py-20">
        <div className="container">
          <div className="max-w-4xl">
            <h1
              id="membership-heading"
              className="mb-6 text-white"
              style={{ ...headingStyle, fontSize: "clamp(2.75rem, 6vw, 5rem)", lineHeight: 1.03 }}
            >
              AI for the Working Tennis Pro
            </h1>
            <p className="mb-8 max-w-2xl text-lg leading-relaxed text-white/85 sm:text-xl">
              Step-by-step PDF guides for tennis coaches who want AI to do the heavy lifting off the court — written by a working coach, from a real academy.
            </p>
            <JoinButton />
          </div>
        </div>
      </section>

      <section aria-labelledby="working-coach-heading" className="py-14 sm:py-16 lg:py-20">
        <div className="container">
          <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-16">
            <div className="max-w-3xl">
              <h2 id="working-coach-heading" className="mb-6 text-3xl leading-tight sm:text-4xl" style={headingStyle}>
                From a working coach, not a tech company
              </h2>
              <p className="text-base leading-8 text-muted-foreground sm:text-lg">
                I'm Mario Llano — 25 years running RI Tennis Academy in Rhode Island, and junior coach of Jared Donaldson before he reached ATP No. 48. Two years ago I started learning AI properly. It now runs my academy's attendance and billing (149 students), produces my daily teaching videos, and helps me stay on top of payments, email, and scheduling. This membership is where I teach other pros to do the same — from my own academy, nothing theoretical.
              </p>
            </div>
            <img
              src={MARIO_PHOTO}
              alt="Coach Mario Llano at the US Open"
              width="280"
              height="320"
              loading="lazy"
              className="aspect-[7/8] w-full max-w-[280px] rounded-2xl object-cover object-top shadow-lg"
            />
          </div>
        </div>
      </section>

      <section id="guides" aria-labelledby="guides-heading" className="scroll-mt-24 border-y border-border bg-muted/30 py-14 sm:py-16 lg:py-20">
        <div className="container">
          <h2 id="guides-heading" className="mb-8 text-3xl sm:mb-10 sm:text-4xl" style={headingStyle}>
            Inside the membership
          </h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {membershipGuides.map((guide, index) => {
              const Icon = guide.icon;
              return (
                <article key={guide.title} data-guide-card className="flex flex-col rounded-2xl border border-border bg-card p-6 text-card-foreground sm:p-7">
                  <div className="mb-5 flex items-center justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F3C85D]/20 text-[#0D1B2A]">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <span className="text-xs font-semibold tracking-widest text-muted-foreground" aria-hidden="true">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <h3 className="mb-3 text-2xl leading-tight" style={headingStyle}>{guide.title}</h3>
                  <p className="mb-6 flex-1 text-sm leading-7 text-muted-foreground">{guide.description}</p>
                  <span className="self-start rounded-md border border-[#F3C85D]/40 bg-[#F3C85D]/15 px-3 py-1.5 text-xs font-medium text-foreground">
                    {guide.tag}
                  </span>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section aria-labelledby="how-it-works-heading" className="bg-[#0D1B2A] py-14 text-white sm:py-16 lg:py-20">
        <div className="container">
          <div className="max-w-3xl">
            <h2 id="how-it-works-heading" className="mb-6 text-3xl text-white sm:text-4xl" style={headingStyle}>
              How it works
            </h2>
            <p className="mb-8 text-base leading-8 text-white/85 sm:text-lg">
              Subscribe once, get the whole library. $20/month — less than one hour of the admin time these guides give back each week. Read a guide on your phone between lessons, follow it step by step, and keep the prompts forever. New guides land as I finish them at the academy. Cancel anytime; the guides you've downloaded are yours to keep.
            </p>
            <JoinButton />
          </div>
        </div>
      </section>

      <section aria-label="Membership questions" className="py-7 sm:py-8">
        <div className="container">
          <p className="text-sm leading-7 text-muted-foreground">
            Questions? Email Coach Mario at <a href="mailto:ritennismario@gmail.com" className="font-medium text-foreground underline underline-offset-4">ritennismario@gmail.com</a> or call/text <a href="tel:+14019655873" className="font-medium text-foreground underline underline-offset-4">(401) 965-5873</a>.
          </p>
        </div>
      </section>
    </article>
  );
}
