import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Bookmark,
  Brain,
  Briefcase,
  Building2,
  ArrowLeft,
  Check,
  Code2,
  Cpu,
  FileText,
  Gift,
  Heart,
  Layers,
  Lock,
  Menu,
  MessageCircle,
  Medal,
  Network,
  Sparkles,
  Star,
  Target,
  Users,
  X,
  Zap,
} from "@/components/icons";

import { BrandLogo } from "@/components/brand-logo";
import { FolderShelf } from "@/components/classroom/folder-shelf.jsx";
import { GradedNotebook } from "@/components/classroom/graded-notebook.jsx";
import { PinBoard } from "@/components/classroom/pin-board.jsx";
import { LaptopSheet } from "@/components/classroom/laptop-sheet.jsx";
import { TraySupplies } from "@/components/classroom/tray-supplies.jsx";
import { RebyuCard, TactileButton } from "@/components/rebyu/rebyu-ui.jsx";
/* The board's own mark and its own band boundaries, imported rather than
   restated. A landing page that draws its own seal or picks its own red is a
   landing page that drifts away from the product it is advertising. */
import { MASTERY_BANDS } from "@/components/charts/rebyu-charts.jsx";
import {
  AnimatePresence,
  EASE,
  HoverLift,
  HoverScale,
  RotatingText,
  Typewriter,
  WordReveal,
  fadeUp,
  motion,
  staggerParent,
  useParallax,
  useScrollSteps,
} from "@/components/motion/rebyu-motion.jsx";
import {
  MASTERY,
  MasteryChart,
  RETENTION,
  RetakeScoreChart,
  RetentionChart,
} from "./landing-charts.jsx";

/* Community is part of the public story again, now that the learner portal
   and admin moderation are both re-registered.

   The flag governs the section alone. It used to carry a nav item and a footer
   link with it, and both are gone: the community is one of the things inside
   the feature run rather than a destination of its own, so the bar and the
   footer each carry a single "features" link that covers it. Flip this to
   false to withdraw the section. */
const SHOW_COMMUNITY = true;

const NAV_ITEMS = [
  { label: "about", href: "#about" },
  { label: "the problem", href: "#problem" },
  { label: "how it works", href: "#how-it-works" },
  { label: "certifications", href: "#certifications" },
  /* One entry for the whole feature run. It points at the run's own header
     rather than at its first section: #ai-tutor landed the visitor on an
     eyebrow reading "ai tutor", so the bar promised a category and the page
     answered with one implementation. #features is the band that names all of
     them. The inner sections keep their ids, so any link already pointing at
     #ai-tutor or #community still resolves.

     The community and the arenas are deliberately not in the bar. They are
     things you do inside the product, not places to go on this page, and
     naming each one turned a five-item bar into a table of contents for a page
     the visitor is going to scroll anyway. */
  { label: "features", href: "#features" },
  /* The one off-page entry: a school or training centre asking for
     institutional access. It is a route, not an anchor, and a plain <a> gets
     there fine -- the request page is its own full load anyway. */
  { label: "get access", href: "/institution/request-access" },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "take the diagnostic",
    body: "A short placement test maps what you already know across every exam domain.",
    tone: "macaw",
  },
  {
    step: "02",
    title: "get your plan",
    body: "Rebyu orders your lessons by what is weakest and what the exam weighs most.",
    tone: "beetle",
  },
  {
    step: "03",
    title: "study in short sets",
    body: "Ten-minute lessons, instant feedback on every answer, flashcards on what you miss.",
    tone: "feather",
  },
  {
    step: "04",
    title: "sit a mock exam",
    body: "Full-length, timed, scored against the real passing mark before you book the date.",
    tone: "fox",
  },
];

/* `wordmark` is set oversized and clipped inside the card header — it does the
   work a photo used to, without the stock-image feel. */
const CERTIFICATIONS = [
  {
    title: "TOPCIT",
    wordmark: "topcit",
    tone: "macaw",
    icon: Code2,
    summary:
      "The Test of Practical Competency in IT. Weighted toward applied software work rather than recall.",
    lessons: 96,
    questions: "1,240",
    topics: [
      "Software development",
      "Databases",
      "Networking",
      "Information systems",
      "Project management",
    ],
  },
  {
    title: "IT Passport",
    wordmark: "passport",
    tone: "bee",
    icon: Briefcase,
    summary:
      "Japan's entry-level national IT qualification. Broad coverage, lighter depth — the usual first certificate.",
    lessons: 64,
    questions: "980",
    topics: ["Strategy", "Management", "Technology"],
  },
  {
    title: "FE Exam",
    wordmark: "fe",
    tone: "beetle",
    icon: Cpu,
    summary:
      "Fundamental Information Technology Engineer. The deepest of the three, and the most computer-science heavy.",
    lessons: 148,
    questions: "1,860",
    topics: [
      "Computer science",
      "Algorithms",
      "Databases",
      "Networks",
      "Security",
      "Software engineering",
      "System architecture",
      "Project management",
      "IT strategy",
    ],
  },
];

/* IT Olympics — two solo endurance modes plus the synchronised 8-player
   tournament, shown as icons with labels. `format` is the honest distinction
   between them: solo runs can be started any time, the World Cup needs seven
   other people. */
/** Wraps the index so the carousel is a ring, not a strip with two dead ends. */
function olympicsOffset(index, activeIndex) {
  let difference = index - activeIndex;
  const total = OLYMPICS_MODES.length;
  const midpoint = Math.floor(total / 2);
  if (difference > midpoint) difference -= total;
  if (difference < -midpoint) difference += total;
  return difference;
}

const OLYMPICS_MODES = [
  {
    id: "codestrike",
    name: "codestrike",
    role: "Coding Skills",
    format: "solo · 10 problems",
    icon: Code2,
    color: "#2f6b4f",
    tag: "Practice",
    accent: "linear-gradient(135deg, var(--color-rb-feather-lip), var(--color-rb-feather))",
    blurb: "Ten stages of coding problems, judged against real unit tests and scored on time complexity.",
    points: ["Live judge with split-screen tests", "Scored on Big-O efficiency", "Global and tier ranking"],
    to: "/learner/challenges/codestrike",
  },
  {
    id: "blueprint",
    name: "blueprint arena",
    role: "Design Skills",
    format: "solo · 10 problems",
    icon: Network,
    color: "#248f4c",
    tag: "Design",
    accent: "linear-gradient(135deg, var(--color-rb-bee-lip), var(--color-rb-bee))",
    blurb: "Ten stages of UML and system design on a drag-and-drop canvas, checked against structural rules.",
    points: ["Pre-loaded architecture components", "Structural validation, not opinion", "Accuracy score and rank tier"],
    to: "/learner/challenges/blueprint-arena",
  },
  {
    id: "worldcup",
    name: "world cup",
    role: "Exam Readiness",
    format: "8 players · live bracket",
    icon: Medal,
    color: "#23a866",
    tag: "Tournament",
    accent: "linear-gradient(135deg, var(--color-rb-leaf-lip), var(--color-rb-leaf))",
    blurb: "An eight-player bracket on one of your certification tracks — quarterfinals, semis, and a timed final.",
    points: ["Live elimination bracket", "Timed final round", "Readiness score at the end"],
    to: "/learner/challenges/world-cup",
  },
];

const INSTITUTION_POINTS = [
  "Request a partnership and select certifications",
  "Configure learner slots and invite participants",
  "Assign certification access and track participation",
  "Receive consolidated institutional invoices",
];

/* Community is a feed, not a group chat: learners post practice sets, notes and
   files that other learners can open, attempt, and save. */
const FEED_POSTS = [
  {
    author: "Rina Delgado",
    initials: "rd",
    avatar: "bg-rb-beetle-wash text-rb-beetle-lip",
    tag: "TOPCIT · Databases",
    when: "2h",
    kind: "practice set",
    kindChip: "bg-rb-macaw-wash text-rb-macaw-lip",
    text: "Built a 15-item set on normalization — 1NF through BCNF, with explanations on every answer.",
    attachIcon: Layers,
    attachTone: "bg-rb-macaw-wash text-rb-macaw-lip",
    attachName: "Normalization drill",
    attachMeta: "15 questions · 12 attempts",
    attachAction: "attempt",
    likes: 34,
    comments: 8,
  },
  {
    author: "Jed Ramos",
    initials: "jr",
    avatar: "bg-rb-fox-wash text-rb-fox-lip",
    tag: "FE Exam · Networks",
    when: "5h",
    kind: "material",
    kindChip: "bg-rb-bee-wash text-rb-bee-ink",
    text: "My subnetting cheat sheet from last week's review. The CIDR table on page 2 is the useful bit.",
    attachIcon: FileText,
    attachTone: "bg-rb-cardinal-wash text-rb-cardinal-lip",
    attachName: "subnetting-cheatsheet.pdf",
    attachMeta: "PDF · 1.2 MB · 96 downloads",
    attachAction: "open",
    likes: 61,
    comments: 14,
  },
];

function BrandMark({ light = false }) {
  return (
    <span className="flex items-center gap-2.5">
      <BrandLogo className="size-9" />
      <span
        className={`rb-display text-2xl leading-none transition-colors duration-200 ${
          light ? "text-white! [text-shadow:0_1px_3px_rgba(0,0,0,0.55)]" : ""
        }`}
      >
        rebyu
      </span>
    </span>
  );
}

/* navigation */

function LandingNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  /* Which link the pointer is on, so one shared pill can slide between them
     rather than seven independent backgrounds fading in and out. */
  const [hoveredNav, setHoveredNav] = useState(null);

  useEffect(() => {
    const update = () => setIsScrolled(window.scrollY > 24);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  useEffect(() => {
    if (!mobileMenuOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event) => {
      if (event.key === "Escape") setMobileMenuOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileMenuOpen]);

  const close = () => setMobileMenuOpen(false);

  /* Sits on the hero's classroom photo while the page is at the top, so the
     bar is see-through with light text there. Once scrolled over the white
     sections -- or with the mobile menu open -- it takes its solid background
     back, since white text on white would disappear. */
  const overHero = !isScrolled && !mobileMenuOpen;

  return (
    /* Sticky, not fixed: the route wrapper animates with a transform, and a
       transformed ancestor turns `fixed` into "scrolls with the page". The hero
       pulls itself up under this bar instead (see HeroSection). */
    <header className="sticky top-0 z-50 w-full">
      <div
        className={`w-full border-b-2 transition-colors duration-200 ${
          overHero ? "border-transparent bg-transparent" : "border-rb-swan bg-rb-snow"
        }`}
      >
        <div className="mx-auto flex h-20 w-full max-w-[1280px] items-center justify-between gap-6 px-5 lg:px-8">
          <Link to="/welcome" onClick={close} className="shrink-0">
            <BrandMark light={overHero} />
          </Link>

          {/* The hover background is one element carrying a `layoutId`, so
              moving from "about" to "the problem" animates the same box across
              the gap instead of cross-fading two. `onMouseLeave` sits on the
              <nav> rather than each link: leaving one link for the next would
              otherwise clear and re-set the state on every hop. */}
          <nav
            className="hidden items-center gap-1 lg:flex"
            onMouseLeave={() => setHoveredNav(null)}
          >
            {NAV_ITEMS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onMouseEnter={() => setHoveredNav(item.href)}
                onFocus={() => setHoveredNav(item.href)}
                className={`relative rounded-rb-pill px-4 py-2 font-rb-display text-[0.9375rem] font-extrabold transition-colors focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-rb-macaw ${
                  hoveredNav === item.href
                    ? "text-rb-eel"
                    : overHero
                      ? "text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.55)]"
                      : "text-rb-wolf"
                }`}
              >
                {/* Painted before the label and lifted back with a positive
                    z-index on the text, not a negative one on the pill: the <a>
                    sets `position` without a `z-index`, so it opens no stacking
                    context and a negative layer would sink behind the header's
                    own background. */}
                {hoveredNav === item.href ? (
                  <motion.span
                    layoutId="landing-nav-pill"
                    className="absolute inset-0 rounded-rb-pill bg-rb-polar"
                    transition={{ type: "spring", stiffness: 480, damping: 38, mass: 0.7 }}
                  />
                ) : null}
                <span className="relative z-10">{item.label}</span>
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <TactileButton asChild variant="ghost" size="sm">
              <Link to="/login">log in</Link>
            </TactileButton>
            <TactileButton asChild size="sm">
              <Link to="/register">start learning</Link>
            </TactileButton>
          </div>

          <button
            type="button"
            className={`grid size-11 place-items-center rounded-rb-tile transition-colors hover:bg-rb-polar hover:text-rb-eel focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-rb-macaw lg:hidden ${
              overHero ? "text-white" : "text-rb-eel"
            }`}
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
            aria-controls="landing-mobile-navigation"
            onClick={() => setMobileMenuOpen((open) => !open)}
          >
            {mobileMenuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
        </div>

        {/* Closing used to be instant, because the node left the tree the frame
            the state flipped. AnimatePresence holds it long enough to roll back
            up, and the links stagger on the way in so the panel reads as a list
            arriving rather than a block appearing. `initial={false}` keeps it
            silent on first paint — a menu that is already shut should not
            animate shut. */}
        <AnimatePresence initial={false}>
          {mobileMenuOpen ? (
            <motion.div
              key="mobile-nav"
              id="landing-mobile-navigation"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ height: { duration: 0.32, ease: EASE }, opacity: { duration: 0.2 } }}
              className="overflow-hidden border-t-2 border-rb-swan bg-rb-snow lg:hidden"
            >
              <div className="max-h-[calc(100dvh-5rem)] overflow-y-auto p-5">
                <motion.nav
                  className="flex flex-col gap-1"
                  initial="hidden"
                  animate="show"
                  variants={staggerParent(0.04, 0.06)}
                >
                  {NAV_ITEMS.map((item) => (
                    <motion.a
                      key={item.href}
                      href={item.href}
                      onClick={close}
                      variants={fadeUp}
                      className="rounded-rb-tile px-4 py-3.5 font-rb-display text-lg font-extrabold text-rb-eel transition-colors hover:bg-rb-polar"
                    >
                      {item.label}
                    </motion.a>
                  ))}
                </motion.nav>
                <div className="mt-4 flex flex-col gap-3">
                  <TactileButton asChild>
                    <Link to="/register" onClick={close}>
                      start learning
                    </Link>
                  </TactileButton>
                  <TactileButton asChild variant="ghost">
                    <Link to="/login" onClick={close}>
                      log in
                    </Link>
                  </TactileButton>
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </header>
  );
}

function HeroSection() {
  return (
    /* -mt-[82px]: slides up under the sticky navigation bar (80px + its 2px
       border), so the classroom photo starts at the very top of the window. */
    <section className="relative isolate -mt-[82px] flex min-h-svh items-center overflow-hidden">
      {/* --- the fold: a classroom ----------------------------------------------
          The painted classroom fills the window; the claim is chalked onto a
          wood-framed chalkboard in the middle of it, with pencils resting on the
          chalk tray. The photo and the pencils are ornament (`aria-hidden`). */}
      <div aria-hidden="true" className="rb-classroom-photo absolute inset-0 -z-10" />

      {/* `animate`, not `whileInView`: the fold is on screen before any observer
          could fire. The stagger reads as one sentence being said. */}
      <motion.div
        /* pt-28 clears the 80px navigation bar, which now floats over the photo. */
        className="relative mx-auto w-full max-w-[1360px] px-4 pb-16 pt-28 sm:px-8"
        initial="hidden"
        animate="show"
        variants={staggerParent(0.09, 0.1)}
      >
        <div className="rb-chalkboard rb-hero-board px-6 pb-16 pt-12 text-center sm:px-16 sm:pb-24 sm:pt-16">
          <motion.p variants={fadeUp} className="rb-chalk-label mx-auto">
            <Typewriter text="for TOPCIT, IT Passport & FE exam candidates" speed={34} startOnMount />
          </motion.p>

          <motion.h1
            variants={staggerParent(0.055)}
            className="rb-chalk mt-6 text-[clamp(3rem,8.5vw,8rem)] leading-[1.02]"
          >
            <WordReveal text="Pass it the first time." inherit />
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="rb-chalk-body mx-auto mt-6 max-w-4xl text-balance text-xl sm:text-2xl"
          >
            Rebyu finds the topics you are weakest at and builds your study plan around them — so
            nothing on exam day is a surprise.
          </motion.p>

          <motion.div variants={fadeUp} className="mt-11 flex flex-col justify-center gap-4 sm:flex-row">
            <TactileButton asChild size="lg">
              <Link to="/register">
                start learning
                <ArrowRight className="size-5" />
              </Link>
            </TactileButton>
            <TactileButton asChild size="lg" variant="ghost">
              <a href="#certifications">see what&apos;s covered</a>
            </TactileButton>
          </motion.div>

          <TraySupplies className="hidden sm:block" />
        </div>
      </motion.div>
    </section>
  );
}

/* what it is */

function AboutSection() {
  return (
    <section id="about" className="scroll-mt-24 bg-white px-5 py-20 lg:px-8 lg:py-28">
      <div className="mx-auto max-w-[1280px]">
        <div data-landing-reveal className="max-w-3xl">
          <p className="rb-eyebrow">what rebyu is</p>
          <WordReveal
            as="h2"
            className="rb-display rb-display-lg mt-3"
            text="one place to prepare for one exam."
          />
          <p className="rb-body-lg mt-5">
            Rebyu is a certification review platform for TOPCIT, IT Passport, and the FE exam. It
            holds the whole preparation cycle — a diagnostic that finds your gaps, lessons ordered
            around them, real assessments with code and diagram work, timed mock exams, and a
            mastery level per topic you can actually act on.
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            [Layers, "Structured curriculum", "Ten units per certification, unlocked in order."],
            [Code2, "Real assessments", "Write code against test cases, build diagrams on a canvas."],
            [BarChart3, "Mastery tracking", "Every answer updates a per-topic estimate."],
            [Users, "Built for both", "Study on your own, or through your institution."],
          ].map(([Icon, title, body]) => (
            /* Lift on the wrapper, reveal on the card. The scroll reveal is the
               CSS layer's `rb-reveal`, which animates a transform of its own —
               driving both from one element would leave motion and the
               stylesheet writing the same property. */
            <HoverLift key={title} className="h-full">
              <RebyuCard raised data-landing-reveal className="h-full">
                <span className="grid size-12 place-items-center rounded-2xl bg-rb-feather-wash text-rb-feather-ink">
                  <Icon className="size-6" aria-hidden="true" />
                </span>
                <h3 className="rb-display rb-display-sm mt-4">{title}</h3>
                <p className="rb-body mt-2 text-[0.9375rem]">{body}</p>
              </RebyuCard>
            </HoverLift>
          ))}
        </div>
      </div>
    </section>
  );
}

/* problem */

function ProblemSection() {
  return (
    <section id="problem" className="relative scroll-mt-24 overflow-hidden bg-rb-polar px-5 py-20 lg:px-8 lg:py-28">
      <div className="mx-auto grid max-w-[1280px] items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div data-landing-reveal>
          <p className="rb-eyebrow">the problem</p>
          <WordReveal
            as="h2"
            className="rb-display rb-display-lg mt-3"
            text="cramming feels productive. it isn't."
          />
          <p className="rb-body-lg mt-5">
            Most people prepare by reading everything once, a few weeks before the date. A month
            later almost none of it is left — and there was never a signal telling them which parts
            had already gone.
          </p>

          <ul className="mt-8 space-y-4">
            {[
              ["Material is scattered", "PDFs, videos, and past papers with nothing connecting them."],
              ["No feedback loop", "You find out what you did not know on exam day."],
              ["Effort goes to the wrong place", "Time is spent on comfortable topics, not weak ones."],
              ["Weak spots stay hidden", "Nothing tells you which topics are actually weak."],
            ].map(([title, body]) => (
              <li key={title} className="flex gap-3">
                <span className="mt-1 grid size-6 shrink-0 place-items-center rounded-full bg-rb-cardinal-wash">
                  <X className="size-3.5 text-rb-cardinal-lip" aria-hidden="true" />
                </span>
                <div>
                  <div className="font-bold text-rb-eel">{title}</div>
                  <p className="rb-body text-[0.9375rem]">{body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div data-landing-reveal>
          <LaptopSheet
            file="retention-after-one-session.xlsx"
            formula="=C7-B7"
            cell="C7"
            sheet="retention"
            headers={["day", "cram %", "spaced %"]}
            rows={RETENTION.map((r) => [r.day, r.cram, r.spaced])}
          >
            <p className="rb-sheet-chart-title">What you keep, 30 days later</p>
            <p className="rb-sheet-chart-sub">Retention after one study session</p>
            <RetentionChart />
          </LaptopSheet>
          <p className="rb-body mt-6 text-center text-sm">
            Crammed material decays to roughly a seventh of what you started with. Reviewed on a
            schedule, it holds.
          </p>
        </div>
      </div>
    </section>
  );
}

/* solution */

function SolutionSection() {
  return (
    <section id="solution" className="relative scroll-mt-24 overflow-hidden bg-white px-5 py-20 lg:px-8 lg:py-28">
      <div className="mx-auto grid max-w-[1280px] items-center gap-12 lg:grid-cols-2 lg:gap-16">
        {/* Chart left, copy right. The card already leads in source order, so
            the columns fall this way on their own -- the order utilities that
            used to flip them back were the only thing putting it on the right. */}
        <div data-landing-reveal>
          <LaptopSheet
            file="mastery-per-domain.xlsx"
            formula="=MIN(B7:E7)"
            cell="E7"
            sheet="mastery"
            headers={["week", "prog", "OS", "net", "db"]}
            rows={MASTERY.map((r) => [r.week, r.programming, r.os, r.networks, r.databases])}
          >
            <p className="rb-sheet-chart-title">Six weeks of tracked study</p>
            <p className="rb-sheet-chart-sub">Mastery per domain</p>
            <MasteryChart />
          </LaptopSheet>
          <p className="rb-body mt-6 text-center text-sm">
            Every answer updates the estimate. Databases is still the weakest domain, so it stays at
            the top of the study plan.
          </p>
        </div>

        <div data-landing-reveal>
          <p className="rb-eyebrow">the solution</p>
          <WordReveal
            as="h2"
            className="rb-display rb-display-lg mt-3"
            text="measure what you know. study what you don't."
          />
          <p className="rb-body-lg mt-5">
            Rebyu turns preparation into a loop: answer, get corrected immediately, and let the
            result change what you see next. Nothing is left to memory or willpower.
          </p>

          <ul className="mt-8 space-y-4">
            {[
              [Layers, "Everything in one track", "Lessons, quizzes, code tasks, diagrams, and mock exams under one curriculum."],
              [Zap, "Feedback on every answer", "Right or wrong is shown instantly, with the correction attached."],
              [Target, "Effort follows the data", "Modules are ranked by mastery against exam weight."],
              [BarChart3, "Mastery is measured", "A level per topic, with a confidence showing how sure it is."],
            ].map(([Icon, title, body]) => (
              <li key={title} className="flex gap-3">
                <span className="mt-1 grid size-6 shrink-0 place-items-center rounded-full bg-rb-feather-wash">
                  <Icon className="size-3.5 text-rb-feather-ink" aria-hidden="true" />
                </span>
                <div>
                  <div className="font-bold text-rb-eel">{title}</div>
                  <p className="rb-body text-[0.9375rem]">{body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/* how it works */

function HowItWorksSection() {
  const TONE_CLASSES = {
    macaw: "bg-rb-macaw-wash text-rb-macaw-lip",
    beetle: "bg-rb-beetle-wash text-rb-beetle-lip",
    feather: "bg-rb-feather-wash text-rb-feather-ink",
    fox: "bg-rb-fox-wash text-rb-fox-lip",
  };

  /* The line that joins one step to the next, in the colour of the step it
     leads into. Only the DS tone faces — the wash is the tile, the face is the
     thread. */
  const TONE_LINE = {
    macaw: "bg-rb-macaw",
    beetle: "bg-rb-beetle",
    feather: "bg-rb-feather",
    fox: "bg-rb-fox",
  };

  /* The heading promises an order — "in this order, every time" — and a row of
     four cards that all arrive together is the one layout that contradicts it.
     The scroll through the section is the progress through the method: each
     step turns on as it is reached. See `useScrollSteps`.

     There is no separate stepper strip above the cards. One was tried: it put
     a second set of numbers on screen directly above the card tiles that
     already number themselves, in a single flat blue that ignored the tone each
     step carries — the loudest element in the section, saying nothing the cards
     were not already saying. The progress lives on the cards instead, and the
     only new mark is a short thread in the gutter between them. */
  const trackRef = useRef(null);
  const { active } = useScrollSteps(trackRef, HOW_IT_WORKS.length);

  return (
    <section id="how-it-works" className="scroll-mt-24 bg-rb-polar px-5 py-20 lg:px-8 lg:py-28">
      <div className="mx-auto max-w-[1280px]">
        <div data-landing-reveal>
          <p className="rb-eyebrow">how it works</p>
          <WordReveal
            as="h2"
            className="rb-display rb-display-lg mt-3 max-w-2xl"
            text="four steps, in this order, every time."
          />
        </div>

        <div ref={trackRef} className="mt-12">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {HOW_IT_WORKS.map((item, i) => {
              const reached = i < active;
              const current = i === active - 1;

              return (
                /* `relative` for the thread, which hangs outside the card. */
                <div key={item.step} className="relative h-full">
                  {/* Sits in the gutter only — from the previous card's edge to
                      this one's — at exactly the height of the tiles it joins:
                      2px border + 24px card padding + half of a 48px tile. It
                      never crosses a card, so it reads as a join rather than a
                      rule drawn over the layout. Single-row widths only; where
                      the cards wrap, a thread would leave one row and reappear
                      at the start of the next. */}
                  {i > 0 ? (
                    <span
                      aria-hidden="true"
                      /* Carries the card's own 10px offset while the step is
                         still ahead, so the thread stays on the tile's centre
                         line through the reveal instead of sitting 10px proud
                         of it. Transform rather than `top` — same reason
                         everything else here animates on transform. */
                      style={{
                        top: "50px",
                        transform: `translateY(calc(-50% + ${reached ? 0 : 10}px))`,
                        transitionProperty: "transform",
                        transitionDuration: "420ms",
                      }}
                      className="absolute right-full hidden h-1 w-5 overflow-hidden rounded-full bg-rb-swan lg:block"
                    >
                      <span
                        className={`block h-full origin-left rounded-full transition-[scale] duration-500 ease-out ${
                          TONE_LINE[item.tone]
                        } ${reached ? "scale-x-100" : "scale-x-0"}`}
                      />
                    </span>
                  ) : null}

                  <HoverLift className="h-full">
                    {/* Dimmed rather than hidden. A step that is not there yet
                        cannot be read ahead of; a step that is merely quiet
                        can, and someone skimming the section for step four
                        should not have to scroll for it. */}
                    <motion.div
                      className="h-full"
                      /* `initial={false}`: take the dimmed state on the first
                         commit instead of animating into it, so the section
                         does not flash four bright cards and then dim them on
                         mount. */
                      initial={false}
                      animate={{ opacity: reached ? 1 : 0.45, y: reached ? 0 : 10 }}
                      transition={{ duration: 0.42, ease: EASE }}
                    >
                      <RebyuCard raised className="flex h-full flex-col">
                        <span
                          /* The tile is the step marker: grey until reached,
                             then its own tone, with a ring on the one the
                             reader is on. This is the whole progress display —
                             it is already numbered, already coloured per step,
                             and already exactly where the eye is. */
                          className={`grid size-12 place-items-center rounded-2xl font-rb-display text-base font-extrabold transition-colors duration-300 ${
                            reached ? TONE_CLASSES[item.tone] : "bg-rb-swan text-rb-hare"
                          } ${current ? "ring-2 ring-current ring-offset-2 ring-offset-rb-snow" : ""}`}
                        >
                          {item.step}
                        </span>
                        <h3 className="rb-display rb-display-sm mt-5">{item.title}</h3>
                        <p className="rb-body mt-2 text-[0.9375rem]">{item.body}</p>
                      </RebyuCard>
                    </motion.div>
                  </HoverLift>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

/* certifications */

function CertificationSection() {
  /* A showcase, not a comparison: full-width bands that put each certification's
     actual topic list on the page. What a reader wants here is "what is in the
     system", and that is the topics. Each certification is a paper folder that
     opens like a book onto its topic list. */
  /* One folder colour per certification: manila, sage and a dusty blue. */
  const FOLDER = {
    macaw: { face: "#ecd29a", edge: "#d5b06b" },
    bee: { face: "#d3e2c4", edge: "#aec79c" },
    beetle: { face: "#efd2c2", edge: "#d9ab93" },
  };

  return (
    <section id="certifications" className="relative scroll-mt-24 overflow-hidden bg-white px-5 py-20 lg:px-8 lg:py-28">
      <div className="mx-auto max-w-[1280px]">
        <div data-landing-reveal>
          {/* The eyebrow names the section, the tag beside it cycles the three
              exams — the same three the cards below spell out. It rotates
              because the claim in the heading is "three", and a slot that keeps
              changing is the cheapest way to show a count. */}
          <p className="rb-eyebrow flex flex-wrap items-center gap-2">
            certifications
            <RotatingText
              words={CERTIFICATIONS.map((c) => c.title)}
              itemClassName="rounded-rb-pill bg-rb-macaw-wash px-2.5 py-1 text-rb-macaw-lip"
            />
          </p>
          <WordReveal
            as="h2"
            className="rb-display rb-display-lg mt-3 max-w-2xl"
            text="three certifications, fully built out."
          />
          <p className="rb-body-lg mt-4 max-w-xl">
            Every topic below has lessons, practice questions, and assessments already in the
            system — not a syllabus we plan to fill in later.
          </p>
        </div>

        <div className="mt-12">
          <FolderShelf
            items={CERTIFICATIONS.map((c) => ({
              key: c.title,
              tab: c.wordmark,
              title: c.title,
              meta: `${c.lessons} lessons · ${c.questions} questions`,
              icon: c.icon,
              color: FOLDER[c.tone],
              left: (
                <>
                  <p className="rb-eyebrow">certification</p>
                  <h3 className="rb-display rb-display-md mt-2">{c.title}</h3>
                  <p className="rb-body mt-3 max-w-md">{c.summary}</p>
                  <div className="mt-6 flex gap-8">
                    <span className="text-sm font-bold">
                      <span className="rb-numeric block text-2xl">{c.lessons}</span>
                      lessons
                    </span>
                    <span className="text-sm font-bold">
                      <span className="rb-numeric block text-2xl">{c.questions}</span>
                      questions
                    </span>
                  </div>
                  <TactileButton asChild size="sm" className="mt-8 w-fit">
                    <Link to="/register">
                      start {c.title.toLowerCase()}
                      <ArrowRight className="size-4" />
                    </Link>
                  </TactileButton>
                </>
              ),
              right: (
                <>
                  <p className="rb-spread-line rb-spread-heading">topics covered</p>
                  <ol className="rb-spread-list">
                    {c.topics.map((topic, i) => (
                      <li key={topic} className="rb-spread-line">
                        <span>{i + 1}.</span>
                        {topic}
                      </li>
                    ))}
                  </ol>
                </>
              ),
            }))}
          />
        </div>
      </div>
    </section>
  );
}

/* roadmap */
/* olympics */

function OlympicsSection() {
  /* The same mode-select carousel the signed-in challenge hub uses: one arena
     at full size with the other two racked behind it, rather than three equal
     boxes. Picking a competitive format is a choice, and the carousel puts the
     choice itself on screen — a visitor sees the arena exactly as it will look
     once they are inside the product. */
  const [activeIndex, setActiveIndex] = useState(0);
  const activeMode = OLYMPICS_MODES[activeIndex];

  const move = (direction) =>
    setActiveIndex(
      (current) => (current + direction + OLYMPICS_MODES.length) % OLYMPICS_MODES.length
    );

  return (
    <section id="roadmap" className="scroll-mt-24 overflow-hidden bg-white px-5 py-20 lg:px-8 lg:py-28">
      <div className="mx-auto max-w-[1280px]">
        <div data-landing-reveal className="max-w-2xl">
          <p className="rb-eyebrow">it olympics</p>
          <WordReveal
            as="h2"
            className="rb-display rb-display-lg mt-3"
            text="revision, but competitive."
          />
          <p className="rb-body-lg mt-4">
            Three arenas built on the same question banks you study from. Two you can run solo any
            time; the World Cup needs seven other people.
          </p>
        </div>
      </div>

      <div
        data-landing-reveal
        className="mx-auto mt-12 max-w-[1280px]"
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft") move(-1);
          if (event.key === "ArrowRight") move(1);
        }}
        tabIndex={0}
        aria-label="Arena carousel"
      >
        {/* Drag anywhere on the deck to change arenas. `dragConstraints` are
            pinned to zero on both sides with `dragElastic` supplying the give,
            so the deck rubber-bands back to centre and the offset is only ever
            read as an intent — the cards themselves are positioned by state,
            never by where the pointer stopped. Velocity is folded in so a
            decisive flick counts even if it travelled less than 60px. */}
        <motion.div
          className="relative h-[470px] cursor-grab active:cursor-grabbing sm:h-[490px]"
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.16}
          onDragEnd={(_event, info) => {
            const intent = info.offset.x + info.velocity.x * 0.12;
            if (intent < -60) move(1);
            else if (intent > 60) move(-1);
          }}
        >
          {OLYMPICS_MODES.map((mode, index) => {
            const position = olympicsOffset(index, activeIndex);
            const isActive = position === 0;

            return (
              <motion.button
                key={mode.id}
                type="button"
                onClick={() => (isActive ? undefined : setActiveIndex(index))}
                /* Centred with `inset-0 m-auto` rather than the usual
                   `left-1/2 -translate-x-1/2`. `x` and `translateX` are the
                   same transform key to motion, so a centring half-offset in
                   `style` and a springing `x` in `animate` would be one
                   property written twice — auto margins centre the card
                   without spending the transform at all, leaving the whole of
                   it to the spring. */
                className={`absolute inset-0 isolate m-auto h-[430px] w-[280px] overflow-hidden rounded-rb-card border-2 text-left [backface-visibility:hidden] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-rb-feather sm:w-[320px] ${
                  isActive
                    ? "border-rb-feather shadow-[0_26px_65px_-18px_rgba(17,138,87,0.45)]"
                    : "border-rb-swan shadow-[0_22px_55px_-18px_rgba(15,23,42,0.35)]"
                }`}
                style={{ zIndex: 10 - Math.abs(position) }}
                /* `initial={false}` because these values are the deck's layout,
                   not an entrance. Left to animate in from the transform
                   defaults, all three cards paint stacked dead centre at full
                   size until the first frame lands, and on a slow first frame
                   that stack is what a visitor sees. Off-centre is the resting
                   state; only *changing* arenas is an animation.

                   A spring rather than the duration this used to carry: it is a
                   deck of cards being thumbed through, and a fixed duration
                   cannot move the card with furthest to go any differently
                   from the one already nearly in place. */
                initial={false}
                animate={{
                  x: position * 230,
                  scale: isActive ? 1 : Math.abs(position) === 1 ? 0.82 : 0.66,
                }}
                transition={{ type: "spring", stiffness: 260, damping: 30, mass: 0.9 }}
                whileHover={isActive ? undefined : { scale: 0.87 }}
                aria-current={isActive ? "true" : undefined}
                aria-label={`${mode.name}${isActive ? ", selected" : ", select"}`}
              >
                <div
                  className="relative flex h-40 items-center justify-center overflow-hidden"
                  style={{ background: mode.accent }}
                >
                  <div className="absolute left-3 right-3 top-3 z-10 flex items-center justify-between gap-2">
                    <span className="rounded-rb-pill bg-white/90 px-2.5 py-1 font-rb-display text-[10px] font-extrabold uppercase tracking-wide text-rb-eel backdrop-blur-sm">
                      {mode.tag}
                    </span>
                    <span className="rounded-rb-pill bg-black/35 px-2.5 py-1 font-rb-display text-[10px] font-extrabold uppercase tracking-wide text-white backdrop-blur-sm">
                      {mode.format}
                    </span>
                  </div>

                  <div className="absolute -right-8 -top-8 size-28 rounded-full bg-white/10" />
                  <div className="absolute -bottom-10 -left-7 size-32 rounded-full bg-white/10" />

                  <span
                    className={`grid size-24 place-items-center rounded-full bg-white/20 text-white transition-transform duration-500 ${
                      isActive ? "scale-100" : "scale-90"
                    }`}
                  >
                    <mode.icon className="size-12" strokeWidth={1.7} aria-hidden="true" />
                  </span>
                </div>

                <div className="h-[286px] bg-white p-5 text-center">
                  <p className="font-rb-display text-[10px] font-extrabold uppercase tracking-[0.16em] text-rb-feather-lip">
                    {mode.role}
                  </p>
                  <span className="rb-display rb-display-md mt-1 block">{mode.name}</span>
                  <p className="mt-2 text-xs leading-5 text-rb-wolf">{mode.blurb}</p>

                  <span className="mt-3 flex flex-col items-start gap-1.5">
                    {mode.points.map((point) => (
                      <span
                        key={point}
                        className="flex items-start gap-2 text-left text-[11px] font-semibold text-rb-eel"
                      >
                        <Check className="mt-0.5 size-3.5 shrink-0 text-rb-feather-lip" aria-hidden="true" />
                        {point}
                      </span>
                    ))}
                  </span>

                  <span
                    className={`mx-auto mt-4 block h-1 rounded-full transition-all ${
                      isActive ? "w-14 bg-rb-feather" : "w-6 bg-rb-swan"
                    }`}
                    aria-hidden="true"
                  />
                </div>
              </motion.button>
            );
          })}
        </motion.div>

        <div className="flex items-center justify-center gap-4">
          <motion.button
            type="button"
            onClick={() => move(-1)}
            aria-label="Previous arena"
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            transition={{ type: "spring", stiffness: 500, damping: 24 }}
            className="grid size-11 place-items-center rounded-rb-pill border-2 border-rb-swan bg-rb-snow text-rb-eel transition-colors hover:border-rb-feather focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-rb-feather"
          >
            <ArrowLeft className="size-5" aria-hidden="true" />
          </motion.button>

          <div className="flex items-center gap-1.5" aria-hidden="true">
            {OLYMPICS_MODES.map((mode, index) => (
              <motion.span
                key={mode.id}
                className={`h-1.5 rounded-full ${
                  index === activeIndex ? "bg-rb-feather" : "bg-rb-swan"
                }`}
                initial={false}
                animate={{ width: index === activeIndex ? 28 : 6 }}
                transition={{ type: "spring", stiffness: 420, damping: 34, mass: 0.7 }}
              />
            ))}
          </div>

          <motion.button
            type="button"
            onClick={() => move(1)}
            aria-label="Next arena"
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            transition={{ type: "spring", stiffness: 500, damping: 24 }}
            className="grid size-11 place-items-center rounded-rb-pill border-2 border-rb-swan bg-rb-snow text-rb-eel transition-colors hover:border-rb-feather focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-rb-feather"
          >
            <ArrowRight className="size-5" aria-hidden="true" />
          </motion.button>
        </div>

        {/* The hub's footer row: what is selected, and the one way in. Here the
            way in is registration — the arenas are behind a learner account. */}
        <div className="mx-auto mt-8 flex max-w-3xl flex-col items-center justify-between gap-3 text-center sm:flex-row sm:text-left">
          {/* `mode="wait"` so the outgoing arena name is gone before the next
              one arrives — overlapping them cross-fades two different words
              through each other, which at display size is unreadable. The
              wrapper is min-height'd because the row is empty for the ~220ms
              between them, and the CTA beside it must not step sideways. */}
          <div className="min-h-[3.75rem]">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={activeMode.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.22, ease: EASE }}
              >
                <p className="rb-display rb-display-md">{activeMode.name}</p>
                <p className="mt-1 text-sm text-rb-wolf">{activeMode.format}</p>
              </motion.div>
            </AnimatePresence>
          </div>

          <TactileButton asChild variant="feather">
            <Link to="/register">
              enter arena
              <ArrowRight className="size-5" />
            </Link>
          </TactileButton>
        </div>
      </div>
    </section>
  );
}

/* ai lab */

/**
 * The scripted exchange the tutor preview plays.
 *
 * Deliberately inside one lesson: the tutor is scope-limited to the lesson the
 * learner is on, so a preview where it answers anything at all would advertise
 * a product that does not exist. `parts` exists so the reply can be typed out
 * character by character and still carry emphasis — the typewriter reveals a
 * character count across the segments rather than a plain string.
 */
const TUTOR_CHAT = [
  {
    from: "learner",
    parts: [{ text: "What's the difference between 2NF and 3NF?" }],
  },
  {
    from: "tutor",
    parts: [
      { text: "2NF removes " },
      { text: "partial", strong: true },
      { text: " dependencies on a composite key. 3NF goes further and removes " },
      { text: "transitive", strong: true },
      { text: " ones — where a non-key column depends on another non-key column." },
    ],
    footer: "Want to practise this before moving on?",
    chips: ["make a quiz", "make flashcards"],
  },
  {
    from: "learner",
    parts: [{ text: "make a quiz" }],
  },
  {
    from: "tutor",
    parts: [
      { text: "Built you a five-question quiz on normalization, drawn from this lesson." },
    ],
    // The tutor hands back a quiz to open, not questions in the chat — asking
    // them inline here would show a flow the product does not have.
    action: { label: "take the quiz", icon: Zap },
  },
  {
    from: "learner",
    parts: [{ text: "make flashcards too" }],
  },
  {
    from: "tutor",
    parts: [
      { text: "24 cards, same lesson — the terms you have missed most come up first." },
    ],
    action: { label: "open the deck", icon: Layers },
  },
]

const CHAT_TIMING = {
  afterLearner: 800,
  typingIndicator: 1200,
  perCharacter: 16,
  afterTutor: 1800,
  beforeReplay: 3200,
}

function messageLength(message) {
  return message.parts.reduce((total, part) => total + part.text.length, 0)
}

/** Renders `parts` truncated to `revealed` characters, keeping the emphasis. */
function TypedParts({ parts, revealed }) {
  let consumed = 0
  return (
    <>
      {parts.map((part, partIndex) => {
        const start = consumed
        consumed += part.text.length
        const slice = part.text.slice(0, Math.max(0, revealed - start))
        if (!slice) return null
        return part.strong ? (
          <strong key={partIndex}>{slice}</strong>
        ) : (
          <span key={partIndex}>{slice}</span>
        )
      })}
    </>
  )
}

/** The tutor's pen: a ballpoint whose tip sits on the end of the line being written. */
function InkPen() {
  return (
    <span className="rb-ink-pen" aria-hidden="true">
      <svg viewBox="0 0 120 20">
        <polygon points="0,10 15,5.5 15,14.5" fill="#b8bec4" />
        <circle cx="1.6" cy="10" r="1.6" fill="#2b4a3e" />
        <rect x="15" y="5" width="16" height="10" rx="1" fill="#6f777f" />
        <rect x="31" y="4" width="89" height="12" rx="3" fill="#8b939b" />
        <rect x="31" y="6" width="89" height="3" rx="1.5" fill="#dfe3e6" opacity="0.85" />
        <rect x="44" y="4" width="2.5" height="12" fill="#eef0f2" />
        <rect x="50" y="4" width="2.5" height="12" fill="#eef0f2" />
        <rect x="84" y="1.5" width="32" height="3.5" rx="1.75" fill="#5c636a" />
      </svg>
    </span>
  )
}

/** The tutor thinking: the pen resting on the line, dots appearing. */
function TypingIndicator() {
  return (
    <div className="rb-ink-tutor">
      <p>
        <span className="rb-ink-dots">...</span>
        <InkPen />
      </p>
    </div>
  )
}

/* One turn, handwritten: the learner's question in pencil, the tutor's answer
   in blue ink with the pen on the line while it is still being written. */
function ChatBubble({ message, revealed, showChips }) {
  const isLearner = message.from === "learner"
  const writing = revealed < messageLength(message)

  return (
    <div className={`rb-pop-in ${isLearner ? "rb-ink-learner" : "rb-ink-tutor"}`}>
      <p>
        <TypedParts parts={message.parts} revealed={revealed} />
        {writing ? <InkPen /> : null}
      </p>

      {message.footer && showChips ? <p className="rb-ink-footer">{message.footer}</p> : null}

      {message.chips && showChips ? (
        <div className="mt-1 flex flex-wrap gap-3">
          {message.chips.map((chip) => (
            <span key={chip} className="rb-ink-box">
              {chip}
            </span>
          ))}
        </div>
      ) : null}

      {/* What the tutor actually returns once it has generated something: a way
          into the quiz or the deck, not the questions themselves. */}
      {message.action && showChips ? (
        <span className="rb-pop-in rb-ink-action">
          <message.action.icon className="size-4" aria-hidden="true" />
          {message.action.label}
          <ArrowRight className="size-4" aria-hidden="true" />
        </span>
      ) : null}
    </div>
  )
}

/**
 * The tutor preview, played rather than posed.
 *
 * A static transcript showed the shape of a conversation but not the thing that
 * makes a tutor feel like one — that it answers you while you wait. So the
 * exchange runs: the learner's message lands, the tutor thinks, types its reply
 * out, offers the quiz, and the learner takes it. Then it replays.
 *
 * Under `prefers-reduced-motion` the whole transcript is shown at once, with no
 * timers running at all.
 */
function TutorConversation() {
  const [reducedMotion, setReducedMotion] = useState(false)
  // How many messages are finished, and how far through the next one we are.
  const [done, setDone] = useState(0)
  const [revealed, setRevealed] = useState(0)
  const [thinking, setThinking] = useState(false)

  useEffect(() => {
    setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches)
  }, [])

  useEffect(() => {
    if (reducedMotion) return undefined

    const current = TUTOR_CHAT[done]

    // Past the last message: hold the finished transcript, then replay.
    if (!current) {
      const replay = window.setTimeout(() => {
        setDone(0)
        setRevealed(0)
      }, CHAT_TIMING.beforeReplay)
      return () => window.clearTimeout(replay)
    }

    if (current.from === "learner") {
      setThinking(false)
      setRevealed(messageLength(current))
      const next = window.setTimeout(
        () => setDone((n) => n + 1),
        CHAT_TIMING.afterLearner
      )
      return () => window.clearTimeout(next)
    }

    // Tutor: think first, then type. Advancing to the next message is left to
    // the effect below rather than done from inside the state updater — React
    // may call an updater more than once, and a timer scheduled in there gets
    // scheduled twice with it.
    setThinking(true)
    setRevealed(0)
    const total = messageLength(current)
    let typer = null

    const startTyping = window.setTimeout(() => {
      setThinking(false)
      typer = window.setInterval(() => {
        setRevealed((count) => (count >= total ? count : count + 1))
      }, CHAT_TIMING.perCharacter)
    }, CHAT_TIMING.typingIndicator)

    return () => {
      window.clearTimeout(startTyping)
      if (typer) window.clearInterval(typer)
    }
  }, [done, reducedMotion])

  // A tutor message that has finished typing holds, then hands over.
  useEffect(() => {
    if (reducedMotion) return undefined
    const current = TUTOR_CHAT[done]
    if (!current || current.from !== "tutor") return undefined
    if (thinking || revealed < messageLength(current)) return undefined

    const next = window.setTimeout(
      () => setDone((n) => n + 1),
      CHAT_TIMING.afterTutor
    )
    return () => window.clearTimeout(next)
  }, [done, revealed, thinking, reducedMotion])

  const visible = reducedMotion ? TUTOR_CHAT : TUTOR_CHAT.slice(0, done + 1)

  return (
    <div data-landing-reveal className="rb-tutor-paper">
      <div className="rb-tutor-head">
        <Sparkles className="size-6 shrink-0 text-[#2b4a3e]" aria-hidden="true" />
        <div className="min-w-0">
          <div className="rb-tutor-name">rebyu tutor</div>
          <div className="rb-tutor-sub">Databases · Normalization</div>
        </div>

        {/* Scoped, and says so: the tutor answers inside the lesson you are on. */}
        <span className="rb-tutor-stamp">in this lesson</span>
      </div>

      {/* Bottom-anchored at a fixed height: the page fills upward as a real
          one does, it never changes size mid-conversation, and the earliest
          turns clip off the top. */}
      <div
        className="rb-tutor-body flex h-[392px] flex-col justify-end gap-2 overflow-hidden"
        aria-live="polite"
        aria-atomic="false"
      >
        {visible.map((message, messageIndex) => {
          const isLast = messageIndex === visible.length - 1
          const settled = reducedMotion || !isLast
          if (!settled && thinking && message.from === "tutor") {
            return <TypingIndicator key={messageIndex} />
          }
          return (
            <ChatBubble
              key={messageIndex}
              message={message}
              revealed={settled ? messageLength(message) : revealed}
              showChips={settled || revealed >= messageLength(message)}
            />
          )
        })}
      </div>
    </div>
  )
}

/**
 * The ground the feature run stands on.
 *
 * One background across the run, not one per section. The tutor was
 * beetle-wash and the community macaw-wash, and two saturated bands stacked
 * directly on each other read as two unrelated pages rather than as two parts
 * of one answer. The sections keep their own ids, headings and padding; only
 * the colour moved out here, so the run is a single block that the plain
 * section after it closes.
 *
 * It carries no header of its own. One was tried -- a "features" eyebrow over
 * a heading naming the three -- and it restated in a paragraph what the three
 * sections beneath it each say better with a working demo beside them. The
 * band is the grouping; it does not also need to be announced.
 */
function FeaturesBand({ children }) {
  /* The id lives here rather than on a header of its own, so the nav's
     "features" link still lands at the top of the run with nothing between the
     bar and the first section. */
  return (
    <div id="features" className="scroll-mt-24 bg-rb-feather-wash">
      {children}
    </div>
  );
}

function AiTutorSection() {
  return (
    <section id="ai-tutor" className="scroll-mt-24 px-5 py-20 lg:px-8 lg:py-28">
      <div className="mx-auto grid max-w-[1280px] items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div data-landing-reveal>
          <p className="rb-eyebrow">ai tutor</p>
          <WordReveal
            as="h2"
            className="rb-display rb-display-lg mt-3"
            text="a tutor that sits with you in the lesson."
          />
          <p className="rb-body-lg mt-4 max-w-lg">
            Stuck on something mid-lesson? Ask. The tutor explains the concept you are on, in the
            lesson's own vocabulary — then turns it into a quiz or a flashcard deck so it sticks.
          </p>

          <div className="mt-8 space-y-3">
            {[
              [Brain, "Explains any concept while you are studying the lesson"],
              [Zap, "Turns what you just read into a practice quiz"],
              [Layers, "Builds a flashcard deck from the same lesson"],
            ].map(([Icon, text]) => (
              <div key={text} className="flex items-start gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-rb-snow text-rb-beetle-lip">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <p className="pt-1.5 text-[0.9375rem] font-medium text-rb-eel">{text}</p>
              </div>
            ))}
          </div>

          <TactileButton asChild variant="beetle" className="mt-8">
            <Link to="/register">
              try the ai tutor
              <ArrowRight className="size-5" />
            </Link>
          </TactileButton>
        </div>

        <TutorConversation />
      </div>
    </section>
  );
}

/* gamification */

/* What the mastery service actually returns per topic: an estimate, and a
   confidence in that estimate driven by how much evidence sits behind it. Both
   are shown — 40% mastery from three answers means something different from 40%
   from forty, and hiding that would overstate what the system knows. */
/* Shaped like the rows the dashboard's own "mastery by topic" tile renders:
   a title, the category it sits under, the mastery estimate, how many answers
   are behind that estimate, and the BKT priority tag the seal is drawn from.
   The tags are the real vocabulary (`SEAL_CONFIG` in components/learner/
   priority-tag.jsx), not a marketing paraphrase of it -- NOT_ENOUGH_DATA on
   Cryptography basics is exactly what seven answers earns you, and it is the
   tag a learner would actually see there. */
const TOPICS = [
  { name: "Normalization", domain: "Databases", mastery: 31, answers: 42, priorityTag: "CRITICAL_PRIORITY" },
  { name: "Subnetting", domain: "Networks", mastery: 38, answers: 36, priorityTag: "HIGH_PRIORITY" },
  { name: "Deadlock handling", domain: "Operating systems", mastery: 44, answers: 18, priorityTag: "HIGH_PRIORITY" },
  { name: "Process scheduling", domain: "Operating systems", mastery: 57, answers: 51, priorityTag: "MEDIUM_PRIORITY" },
  { name: "Cryptography basics", domain: "Security", mastery: 62, answers: 7, priorityTag: "NOT_ENOUGH_DATA" },
  { name: "Sorting algorithms", domain: "Programming", mastery: 79, answers: 64, priorityTag: "STRONG" },
];

/* The dashboard's own three mastery bands, so a bar on the landing page is the
   colour the same number would be inside the product. `MASTERY_BANDS` is
   weak < 25, developing < 50, strong above -- red, orange, green. */
function masteryTone(value) {
  if (value < MASTERY_BANDS.weak) return "cardinal";
  if (value < MASTERY_BANDS.developing) return "fox";
  return "feather";
}

function WeaknessSection() {

  return (
    <section className="bg-rb-polar px-5 py-20 lg:px-8 lg:py-28">
      <div className="mx-auto max-w-[1280px]">
        <div data-landing-reveal className="max-w-2xl">
          <p className="rb-eyebrow">mastery &amp; weak topics</p>
          <WordReveal
            as="h2"
            className="rb-display rb-display-lg mt-3"
            text="it knows which topics you are weak at."
          />
          <p className="rb-body-lg mt-4">
            Every answer updates a mastery level for the topic behind it, and the number of answers
            behind that level is shown next to it — an estimate from seven answers is not the same
            claim as one from fifty. Weakest first, so your next hour is already decided.
          </p>
        </div>

        {/* An open notebook the teacher has marked: the ranked topic list on
            the left, the teacher's notes (study-first topic, readiness, the
            retake scores taped in) on the right. */}
        <div data-landing-reveal className="mt-12">
          <GradedNotebook topics={TOPICS} notAssessed={4} readiness={68} tone={masteryTone}>
            <LaptopSheet laptop={false} file="retakes.xlsx" formula="=B5-B2" cell="B5" sheet="retakes">
              <p className="rb-sheet-chart-title">Score across retakes</p>
              <p className="rb-sheet-chart-sub">
                Each assessment&apos;s attempts in order — a rising line is a score you moved.
              </p>
              <RetakeScoreChart />
            </LaptopSheet>
          </GradedNotebook>
        </div>
      </div>
    </section>
  );
}

/* community */

function CommunitySection() {
  return (
    <section id="community" className="scroll-mt-24 px-5 py-20 lg:px-8 lg:py-28">
      <div className="mx-auto grid max-w-[1280px] items-center gap-12 lg:grid-cols-2 lg:gap-16">
        {/* A feed, not a chat: posts carry real attachments — practice sets,
            notes, files — which is what the community is actually for. */}
        <div data-landing-reveal className="space-y-4">
          {FEED_POSTS.map((post) => (
            <RebyuCard key={post.author} raised className="!p-0">
              <div className="flex items-center gap-3 px-5 pt-5">
                <span
                  className={`grid size-10 shrink-0 place-items-center rounded-full font-rb-display text-sm font-extrabold lowercase ${post.avatar}`}
                  aria-hidden="true"
                >
                  {post.initials}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-rb-eel">{post.author}</div>
                  <div className="text-xs font-semibold text-rb-hare">
                    {post.tag} · {post.when}
                  </div>
                </div>
                <span className={`rb-chip !px-2.5 !py-1 !text-[0.6875rem] ${post.kindChip}`}>
                  {post.kind}
                </span>
              </div>

              <p className="px-5 pt-3 text-[0.9375rem] leading-6 text-rb-eel">{post.text}</p>

              {/* the attachment is the point of the post */}
              <div className="mx-5 mt-4 flex items-center gap-3 rounded-rb-tile border-2 border-rb-swan bg-rb-polar p-3">
                <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${post.attachTone}`}>
                  <post.attachIcon className="size-5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <div className="truncate text-sm font-bold text-rb-eel">{post.attachName}</div>
                  <div className="text-xs font-semibold text-rb-wolf">{post.attachMeta}</div>
                </div>
                <span className="ml-auto shrink-0 rounded-full bg-rb-snow px-3 py-1.5 text-xs font-bold text-rb-macaw-lip">
                  {post.attachAction}
                </span>
              </div>

              <div className="mt-4 flex items-center gap-5 border-t-2 border-rb-swan px-5 py-3 text-sm font-bold text-rb-wolf">
                <span className="flex items-center gap-1.5">
                  <Heart className="size-4" aria-hidden="true" />
                  {post.likes}
                </span>
                <span className="flex items-center gap-1.5">
                  <MessageCircle className="size-4" aria-hidden="true" />
                  {post.comments}
                </span>
                <span className="ml-auto flex items-center gap-1.5">
                  <Bookmark className="size-4" aria-hidden="true" />
                  save
                </span>
              </div>
            </RebyuCard>
          ))}
        </div>

        <div data-landing-reveal>
          <p className="rb-eyebrow">community</p>
          <WordReveal
            as="h2"
            className="rb-display rb-display-lg mt-3"
            text="the best reviewer is another student."
          />
          <p className="rb-body-lg mt-4 max-w-lg">
            A feed built for revision. Post a practice set you made, upload your notes, ask the
            question you're stuck on — and attempt, download, or save what everyone else shares.
          </p>

          <div className="mt-8 space-y-3">
            {[
              [Layers, "Share practice sets other learners can actually attempt"],
              [FileText, "Upload notes, reviewers, and past papers as real files"],
              [MessageCircle, "Ask a question and get answered by someone who just sat it"],
              [Bookmark, "Save anything useful straight into your own library"],
            ].map(([Icon, text]) => (
              <div key={text} className="flex items-start gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-rb-snow text-rb-macaw-lip">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <p className="pt-1.5 text-[0.9375rem] font-medium text-rb-eel">{text}</p>
              </div>
            ))}
          </div>

          <TactileButton asChild variant="macaw" className="mt-8">
            <Link to="/register">
              join a study circle
              <ArrowRight className="size-5" />
            </Link>
          </TactileButton>
        </div>
      </div>
    </section>
  );
}

/* access */

function AccessCard({ icon: Icon, title, description, points, cta, to, tone }) {
  return (
    <article className={`rb-sticky ${tone === "feather" ? "rb-sticky-yellow" : "rb-sticky-mint"}`}>
      <span className="rb-pushpin" aria-hidden="true" />

      <div className="flex items-center gap-3">
        <Icon className="size-8 shrink-0 text-[#4a3a12]" aria-hidden="true" />
        <h3 className="rb-sticky-title">{title}</h3>
      </div>
      <p className="rb-sticky-body mt-3">{description}</p>

      <ul className="mt-5 flex-1 space-y-2.5">
        {points.map((point) => (
          <li key={point} className="flex items-start gap-3">
            <Check className="mt-0.5 size-5 shrink-0 text-rb-feather" aria-hidden="true" />
            <span className="text-[0.9375rem] text-[#3a2d0c]">{point}</span>
          </li>
        ))}
      </ul>

      <TactileButton
        asChild
        variant={tone === "feather" ? "feather" : "macaw"}
        className="mt-7 w-full"
      >
        <Link to={to}>
          {cta}
          <ArrowRight className="size-5" />
        </Link>
      </TactileButton>
    </article>
  );
}

function AccessSection() {
  return (
    <section id="get-access" className="scroll-mt-24 bg-white px-5 py-20 lg:px-8 lg:py-28">
      <div className="mx-auto max-w-[1280px]">
        <div data-landing-reveal className="max-w-2xl">
          <p className="rb-eyebrow">get access</p>
          <WordReveal
            as="h2"
            className="rb-display rb-display-lg mt-3"
            text="bring your school onto rebyu."
          />
        </div>

        <PinBoard className="mt-12 grid gap-12">
          <AccessCard
            icon={Building2}
            title="for institutions"
            description="Give your learners certification access through a managed partnership."
            points={INSTITUTION_POINTS}
            cta="request partnership"
            to="/institution/request-access"
            tone="humpback"
          />
        </PinBoard>
      </div>
    </section>
  );
}

/* footer */

function Footer() {
  const footerRef = useRef(null);
  /* The wordmark rises as the footer is scrolled into, so the last thing on the
     page settles rather than simply being there. Short travel — it is already
     24vw tall, and anything more turns a full stop into a swipe. */
  const wordmarkY = useParallax(footerRef, 34);

  const COLUMNS = [
    {
      title: "platform",
      links: [
        ["Certifications", "#certifications"],
        /* One link for the feature run, the same way the navbar carries one.
           The arenas and the community are inside it -- naming them here as
           separate destinations is the table of contents the bar already
           stopped being. */
        ["Features", "#features"],
      ],
    },
    {
      title: "access",
      links: [
        ["Learner login", "/login"],
        ["Create account", "/register"],
        ["Institution access", "/institution/request-access"],
      ],
    },
    {
      title: "discover",
      links: [
        ["How it works", "#how-it-works"],
      ],
    },
    {
      title: "legal",
      links: [
        ["Terms of use", "/terms"],
        ["Privacy policy", "/privacy"],
        ["Guidelines", "/guidelines"],
      ],
    },
  ];

  return (
    <footer
      ref={footerRef}
      className="overflow-hidden border-t-2 border-rb-swan bg-rb-snow px-5 pt-16 lg:px-8"
    >
      <div className="mx-auto max-w-[1280px]">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_2fr]">
          <div>
            <BrandMark />
            <p className="rb-body mt-4 max-w-xs text-sm">
              Certification review for TOPCIT, IT Passport, and the FE exam.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {COLUMNS.map((column) => (
              <div key={column.title}>
                <h3 className="font-rb-display text-sm font-extrabold lowercase tracking-wide text-rb-eel">
                  {column.title}
                </h3>
                <ul className="mt-3 space-y-1">
                  {column.links.map(([label, href]) => (
                    <li key={href}>
                      {/* inline-block + padding keeps the tap target above the
                          24px pointer-target minimum on mobile */}
                      {/* Scale, not lift: these sit in a tight column, and a
                          link that travels upward on hover lands on the one
                          above it. `origin-left` so the row grows away from the
                          column edge instead of drifting across it. */}
                      <HoverScale as="a" scale={1.045} className="origin-left" href={href}>
                        <span className="inline-block py-1.5 text-sm font-medium text-rb-wolf underline-offset-4 transition-colors hover:text-rb-feather hover:underline">
                          {label}
                        </span>
                      </HoverScale>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <p className="mt-12 border-t-2 border-rb-swan py-6 text-sm text-rb-hare">
          © {new Date().getFullYear()} Rebyu. All rights reserved.
        </p>
      </div>

      {/* oversized wordmark — the only decorative element on the page */}
      <motion.div
        aria-hidden="true"
        style={{ y: wordmarkY }}
        className="pointer-events-none flex select-none justify-center overflow-hidden leading-[0.72]"
      >
        <span className="font-rb-display text-[24vw] font-black lowercase tracking-tight text-rb-polar">
          rebyu
        </span>
      </motion.div>
    </footer>
  );
}

/* page */

export default function LandingPage() {
  const rootRef = useRef(null);

  /**
   * Scroll reveals via IntersectionObserver rather than a scroll-position
   * library: this route is lazy-loaded behind Suspense and its images settle
   * late, so anything measuring document offsets on mount reads a stale
   * layout and never fires. The observer needs no measurement, and because
   * the hiding class is added here in JS the page stays visible if this
   * effect never runs at all.
   */
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;

    const targets = Array.from(root.querySelectorAll("[data-landing-reveal]"));
    const reveal = (element) => element.classList.add("rb-revealed");

    if (
      typeof IntersectionObserver === "undefined" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return undefined;
    }

    targets.forEach((element) => element.classList.add("rb-reveal"));

    let delivered = false;
    const observer = new IntersectionObserver(
      (entries) => {
        delivered = true;
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          reveal(entry.target);
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -8% 0px" },
    );

    targets.forEach((element) => observer.observe(element));

    /* A working observer always delivers an initial callback for its targets,
       intersecting or not. If nothing arrives, the environment is not running
       the rendering loop — reveal everything rather than leave the page blank.
       Hidden marketing copy is a far worse outcome than a skipped animation. */
    const safetyNet = window.setTimeout(() => {
      if (!delivered) targets.forEach(reveal);
    }, 1200);

    return () => {
      window.clearTimeout(safetyNet);
      observer.disconnect();
      targets.forEach((element) => element.classList.remove("rb-reveal", "rb-revealed"));
    };
  }, []);

  return (
    /* `overflow-x-clip`, never `overflow-x-hidden`: `hidden` on one axis
       computes the other to `auto`, which makes this div a scroll container —
       and a sticky header then sticks to *it* rather than to the viewport, so
       the navbar scrolled away. `clip` does the same horizontal trimming (the
       hero's rotated cards and offscreen blobs need it) without creating a
       scroll container. */
    <div ref={rootRef} className="rebyu-ds rb-light-only rb-classroom-landing min-h-screen overflow-x-clip">
      <LandingNavbar />
      <main>
        <HeroSection />
        <AboutSection />
        <ProblemSection />
        <SolutionSection />
        <HowItWorksSection />
        <CertificationSection />
        {/* The feature run, grouped under the section the nav calls
            "features". Each is a thing a learner does in the product rather
            than a claim about it: the tutor answers you alone, the community
            answers you with other learners, the arenas set you against them.
            WeaknessSection follows the run because it is about what the
            platform measures, not about what you do in it. */}
        <FeaturesBand>
          <AiTutorSection />
          {SHOW_COMMUNITY ? <CommunitySection /> : null}
        </FeaturesBand>
        <OlympicsSection />
        <WeaknessSection />
        <AccessSection />
      </main>
      <Footer />
    </div>
  );
}
