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
  Check,
  Code2,
  Cpu,
  FileText,
  Gift,
  Gauge,
  GraduationCap,
  Heart,
  Layers,
  Lock,
  Menu,
  MessageCircle,
  Network,
  Sparkles,
  Star,
  Target,
  Trophy,
  Users,
  X,
  Zap,
} from "@/components/icons";

import { BrandLogo } from "@/components/brand-logo";
import { Chip, ProgressBar, RebyuCard, TactileButton } from "@/components/rebyu/rebyu-ui.jsx";
/* The board's own mark and its own band boundaries, imported rather than
   restated. A landing page that draws its own seal or picks its own red is a
   landing page that drifts away from the product it is advertising. */
import { PrioritySeal } from "@/components/learner/priority-tag.jsx";
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
  MasteryChart,
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
   tournament. `format` is the honest distinction between them, and it is what
   the card leads with: solo runs can be started any time, the World Cup needs
   seven other people.

   `accent` and `surfaceClass` are the same pairings the in-product challenge
   hub uses for each arena, so an arena is the same colour to a visitor as it is
   to a signed-in learner. */
const OLYMPICS_MODES = [
  {
    id: "codestrike",
    name: "codestrike",
    role: "Coding Skills",
    tag: "Practice",
    format: "solo · 10 problems",
    icon: Code2,
    accent: "linear-gradient(135deg, #1B6EF3, #1CB0F6)",
    surfaceClass: "bg-rb-macaw-wash",
    blurb:
      "Ten coding problems back to back, judged against real unit tests as you type and scored on time complexity.",
    points: ["Live judge with split-screen tests", "Scored on Big-O efficiency", "Global and tier ranking"],
    to: "/learner/challenges/codestrike",
  },
  {
    id: "blueprint",
    name: "blueprint arena",
    role: "Design Skills",
    tag: "Design",
    format: "solo · 10 problems",
    icon: Network,
    accent: "linear-gradient(135deg, #B061E6, #CE82FF)",
    surfaceClass: "bg-rb-beetle-wash",
    blurb:
      "Ten UML and system design problems on a drag-and-drop canvas, checked against structural rules rather than opinion.",
    points: ["Pre-loaded architecture components", "Structural validation, not opinion", "Accuracy score and rank tier"],
    to: "/learner/challenges/blueprint-arena",
  },
  {
    id: "worldcup",
    name: "world cup",
    role: "Exam Readiness",
    tag: "Tournament",
    format: "8 players · live bracket",
    icon: Trophy,
    accent: "linear-gradient(135deg, #E08600, #FF9600)",
    surfaceClass: "bg-rb-fox-wash",
    blurb:
      "Queue into an eight-player lobby on your track and fight through quarterfinals, semis, and a grand final.",
    points: ["Track-locked matchmaking", "Timed 1v1 bracket rounds", "MVP and match awards"],
    to: "/learner/challenges/world-cup",
  },
];

/* Priority is derived, not chosen: it ranks how weak the learner is against how
   heavily the exam weights that domain. Shared by the roadmap path and the
   module list so one concept never wears two different looks. Labels stay plain
   words — a learner should never have to decode a badge. */
const LEARNER_POINTS = [
  "Browse certifications and study every lesson free",
  "Unlock analytics, weakness reports, and study plans",
  "Practice with mock exams and learner challenges",
  "Join certification discussions and study circles",
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

function BrandMark() {
  return (
    <span className="flex items-center gap-2.5">
      <BrandLogo className="size-9" />
      <span className="rb-display text-2xl leading-none">rebyu</span>
    </span>
  );
}

/* ---------------------------------------------------------------- navigation */

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

  return (
    <header className="sticky top-0 z-50 w-full">
      <div
        className={`w-full border-b-2 bg-rb-snow transition-colors duration-200 ${
          isScrolled || mobileMenuOpen ? "border-rb-swan" : "border-transparent"
        }`}
      >
        <div className="mx-auto flex h-20 w-full max-w-[1280px] items-center justify-between gap-6 px-5 lg:px-8">
          <Link to="/welcome" onClick={close} className="shrink-0">
            <BrandMark />
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
                  hoveredNav === item.href ? "text-rb-eel" : "text-rb-wolf"
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
            className="grid size-11 place-items-center rounded-rb-tile text-rb-eel transition-colors hover:bg-rb-polar focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-rb-macaw lg:hidden"
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
    <section className="relative isolate flex items-center overflow-hidden lg:h-[calc(100svh-84px)] lg:min-h-[600px]">
      {/* --- the fold: one full-screen sky panel ------------------------------
          The anime sky fills the window edge to edge, and the claim stands
          alone in the middle of it: caption, speech bubble, action. No
          character, no side ornaments, no ticker -- the sky and the words are
          the whole scene. */}
      <div aria-hidden="true" className="rb-hero-sky-art absolute inset-0 -z-10" />
      <div
        aria-hidden="true"
        className="rb-halftone absolute inset-x-0 bottom-0 -z-10 h-1/3 opacity-70 [mask-image:linear-gradient(to_top,black,transparent)]"
      />

      {/* `animate`, not `whileInView`: the fold is on screen before any
          observer could fire. The stagger reads as one sentence being said --
          caption, claim, action. */}
      <motion.div
        className="relative mx-auto flex w-full max-w-4xl flex-col items-center px-5 py-16 text-center lg:py-4"
        initial="hidden"
        animate="show"
        variants={staggerParent(0.09, 0.1)}
      >
        <motion.p variants={fadeUp} className="rb-caption-box">
          <Typewriter text="for topcit, it passport & fe exam candidates" speed={34} startOnMount />
        </motion.p>

        {/* No bubble: the claim is lettered straight onto the sky. A thick
            white stroke under the ink (paint-order puts it behind the fill)
            keeps it readable over any cloud, the way comic lettering sits on
            top of the art. */}
        <motion.div variants={fadeUp} className="mt-6 w-full max-w-4xl">
          {/* `!text-center`: `.rb-display` sets left alignment as a system rule,
              and an unlayered rule outranks a Tailwind utility. */}
          <motion.h1
            variants={staggerParent(0.055)}
            className="rb-display !text-center text-[clamp(3rem,8vw,7.5rem)] !leading-[0.95] [-webkit-text-stroke:3px_#ffffff] [paint-order:stroke_fill] drop-shadow-[3px_3px_0_rgba(23,24,43,0.9)] sm:[-webkit-text-stroke:10px_#ffffff] sm:drop-shadow-[6px_6px_0_rgba(23,24,43,0.9)]"
          >
            <WordReveal text="pass it the first time." inherit />
          </motion.h1>
          <p className="rb-body-lg mx-auto mt-6 max-w-3xl text-balance !font-semibold !text-rb-eel [text-shadow:0_0_14px_#ffffff,0_0_4px_#ffffff]">
            Rebyu finds the topics you are weakest at and builds your study plan around them —
            so nothing on exam day is a surprise.
          </p>
        </motion.div>

        <motion.div
          variants={fadeUp}
          className="mt-9 flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row"
        >
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

        <motion.p variants={fadeUp} className="rb-comic-tag mt-5">
          <span className="size-2 rounded-full bg-rb-leaf" aria-hidden="true" />
          Every lesson is free. Pay only for mock exams and analytics.
        </motion.p>
      </motion.div>
    </section>
  );
}

/* ------------------------------------------------------------------- what it is */

function AboutSection() {
  return (
    <section id="about" className="scroll-mt-24 bg-rb-sun rb-halftone rb-band px-5 py-20 lg:px-8 lg:py-28">
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

/* --------------------------------------------------------------------- problem */

function ProblemSection() {
  return (
    <section id="problem" className="relative scroll-mt-24 overflow-hidden bg-rb-polar rb-halftone px-5 py-20 lg:px-8 lg:py-28">
      <img src="/brand/comic/no.webp" alt="" aria-hidden="true" className="pointer-events-none absolute hidden select-none drop-shadow-[4px_4px_0_rgba(23,24,43,0.35)] lg:block right-[3%] top-4 w-44 -rotate-6" />
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

        <RebyuCard raised data-landing-reveal>
          <p className="rb-eyebrow">Retention after one study session</p>
          <h3 className="rb-display rb-display-sm mt-2">
            what you keep, 30 days later
          </h3>
          <div className="mt-5">
            <RetentionChart />
          </div>
          <p className="rb-body mt-4 text-sm">
            Crammed material decays to roughly a seventh of what you started with. Reviewed on a
            schedule, it holds.
          </p>
        </RebyuCard>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------- solution */

function SolutionSection() {
  return (
    <section id="solution" className="relative scroll-mt-24 overflow-hidden bg-rb-cyan rb-halftone rb-band px-5 py-20 lg:px-8 lg:py-28">
      <img src="/brand/comic/pow.webp" alt="" aria-hidden="true" className="pointer-events-none absolute hidden select-none drop-shadow-[4px_4px_0_rgba(23,24,43,0.35)] lg:block right-[3%] top-4 w-48 rotate-6" />
      <div className="mx-auto grid max-w-[1280px] items-center gap-12 lg:grid-cols-2 lg:gap-16">
        {/* Chart left, copy right. The card already leads in source order, so
            the columns fall this way on their own -- the order utilities that
            used to flip them back were the only thing putting it on the right. */}
        <RebyuCard raised data-landing-reveal>
          <p className="rb-eyebrow">Mastery per domain</p>
          <h3 className="rb-display rb-display-sm mt-2">six weeks of tracked study</h3>
          <div className="mt-5">
            <MasteryChart />
          </div>
          <p className="rb-body mt-4 text-sm">
            Every answer updates the estimate. Databases is still the weakest domain, so it stays at
            the top of the study plan.
          </p>
        </RebyuCard>

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

/* --------------------------------------------------------------- how it works */

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
    <section id="how-it-works" className="scroll-mt-24 bg-rb-polar rb-halftone px-5 py-20 lg:px-8 lg:py-28">
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

/* ------------------------------------------------------------- certifications */

function CertificationSection() {
  /* A showcase, not a comparison: full-width bands that put each certification's
     actual topic list on the page. What a reader wants here is "what is in the
     system", and that is the topics — not a spec sheet of exam trivia. */
  const TONE = {
    macaw: { face: "bg-rb-macaw", chip: "bg-rb-macaw-wash text-rb-macaw-lip", btn: "macaw" },
    bee: { face: "bg-rb-bee", chip: "bg-rb-bee-wash text-rb-bee-ink", btn: "fox" },
    beetle: { face: "bg-rb-beetle", chip: "bg-rb-beetle-wash text-rb-beetle-lip", btn: "beetle" },
  };

  return (
    <section id="certifications" className="relative scroll-mt-24 overflow-hidden bg-rb-purple rb-halftone-light rb-band-dark px-5 py-20 lg:px-8 lg:py-28">
      <img src="/brand/comic/bang.webp" alt="" aria-hidden="true" className="pointer-events-none absolute hidden select-none drop-shadow-[4px_4px_0_rgba(23,24,43,0.35)] lg:block right-[4%] top-6 w-52 -rotate-3" />
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

        <div className="mt-12 space-y-6">
          {CERTIFICATIONS.map((c) => (
            /* A gentler lift than the small cards get: these bands run the full
               width of the page, and travel that reads as a nudge on a 280px
               tile reads as the whole section jumping on one of these. */
            <HoverLift key={c.title} lift={-4} scale={1.004}>
              <article
                data-landing-reveal
                className="grid overflow-hidden rounded-rb-card border-2 border-rb-swan bg-rb-snow shadow-[var(--comic-shadow-sm)] lg:grid-cols-[300px_1fr]"
              >
                {/* colour panel carries identity; the wordmark bleeds off it */}
                <div className={`relative overflow-hidden p-7 ${TONE[c.tone].face}`}>
                  <span className="pointer-events-none absolute -bottom-7 -right-3 select-none font-rb-display text-[5rem] font-black lowercase leading-none text-white/20">
                    {c.wordmark}
                  </span>
                  <c.icon className="relative size-9 text-white" aria-hidden="true" />
                  <h3 className="relative mt-4 font-rb-display text-3xl font-extrabold lowercase leading-none text-white">
                    {c.title}
                  </h3>
                  <div className="relative mt-5 flex gap-4 text-white">
                    <span className="text-sm font-bold">
                      <span className="rb-numeric block text-xl text-white">{c.lessons}</span>
                      lessons
                    </span>
                    <span className="text-sm font-bold">
                      <span className="rb-numeric block text-xl text-white">{c.questions}</span>
                      questions
                    </span>
                  </div>
                </div>

                <div className="flex flex-col p-7">
                  <p className="rb-body max-w-2xl">{c.summary}</p>

                  <div className="mt-6 flex-1">
                    <p className="rb-eyebrow">Topics covered</p>
                    <ul className="mt-3 flex flex-wrap gap-2">
                      {/* The chips are the only place on the card where the
                          pointer can land on an individual fact, so they are
                          the only place that answers it. A small scale and
                          nothing else — these wrap onto several rows, and
                          anything that moves a chip off its baseline shifts the
                          row it shares. */}
                      {c.topics.map((topic) => (
                        <HoverScale
                          as="li"
                          key={topic}
                          scale={1.05}
                          className={`rounded-rb-pill px-3.5 py-2 text-sm font-bold ${TONE[c.tone].chip}`}
                        >
                          {topic}
                        </HoverScale>
                      ))}
                    </ul>
                  </div>

                  <TactileButton
                    asChild
                    variant={TONE[c.tone].btn}
                    size="sm"
                    className="mt-7 w-fit"
                  >
                    <Link to="/register">
                      start {c.title.toLowerCase()}
                      <ArrowRight className="size-4" />
                    </Link>
                  </TactileButton>
                </div>
              </article>
            </HoverLift>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------- roadmap */
/* ----------------------------------------------------------------- olympics */

function OlympicsSection() {
  /* Three arenas, three cards, side by side. They replaced a drag-to-browse
     carousel that hid two of the three arenas behind the first at any moment;
     a visitor comparing formats should see all of them at once. */
  return (
    <section id="roadmap" className="relative scroll-mt-24 overflow-hidden bg-rb-sun rb-halftone rb-band px-5 py-20 lg:px-8 lg:py-28">
      {/* Versus frame: the arenas are head-to-head, so this section wears the VS. */}
      <img src="/brand/comic/versus.webp" alt="" aria-hidden="true" className="pointer-events-none absolute right-[5%] top-12 hidden w-80 rotate-2 select-none rounded-md border-4 border-[#17182b] shadow-[6px_6px_0_#17182b] lg:block" />
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

        <div className="mt-14 grid gap-7 md:grid-cols-3">
          {OLYMPICS_MODES.map((mode) => (
            <HoverLift key={mode.id} className="h-full">
              <article
                data-landing-reveal
                className={`flex h-full flex-col overflow-hidden rounded-rb-card border-[3px] border-[#17182b] shadow-[6px_6px_0_#17182b] ${mode.surfaceClass}`}
              >
                <div
                  className="relative flex h-36 items-center justify-center overflow-hidden border-b-[3px] border-[#17182b]"
                  style={{ background: mode.accent }}
                >
                  <div className="absolute left-3 right-3 top-3 z-10 flex items-center justify-between gap-2">
                    <span className="rounded-rb-pill border-2 border-[#17182b] bg-white px-2.5 py-0.5 font-rb-sfx text-xs uppercase tracking-wide text-[#17182b]">
                      {mode.tag}
                    </span>
                    <span className="rounded-rb-pill bg-black/40 px-2.5 py-0.5 font-rb-sfx text-xs uppercase tracking-wide text-white">
                      {mode.format}
                    </span>
                  </div>
                  <span className="grid size-20 place-items-center rounded-full border-[3px] border-[#17182b] bg-white/25 text-white">
                    <mode.icon className="size-10" strokeWidth={1.7} aria-hidden="true" />
                  </span>
                </div>

                <div className="flex flex-1 flex-col p-6">
                  <p className="font-rb-sfx text-sm uppercase tracking-[0.12em] text-rb-macaw-lip">{mode.role}</p>
                  <h3 className="rb-display rb-display-md mt-1">{mode.name}</h3>
                  <p className="rb-body mt-3 text-[0.9375rem]">{mode.blurb}</p>

                  <ul className="mt-4 space-y-2">
                    {mode.points.map((point) => (
                      <li key={point} className="flex items-start gap-2 text-sm font-semibold text-rb-eel">
                        <Check className="mt-0.5 size-4 shrink-0 text-rb-macaw-lip" aria-hidden="true" />
                        {point}
                      </li>
                    ))}
                  </ul>

                  <TactileButton asChild variant="macaw" size="sm" className="mt-6 w-fit">
                    <Link to="/register">
                      enter {mode.name}
                      <ArrowRight className="size-4" />
                    </Link>
                  </TactileButton>
                </div>
              </article>
            </HoverLift>
          ))}
        </div>
      </div>
    </section>
  );
}

/* --------------------------------------------------------------------- ai lab */

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

/** Three dots, while the tutor is composing. */
function TypingIndicator() {
  return (
    <div className="flex w-fit items-center gap-1.5 rounded-rb-tile rounded-bl-md bg-rb-beetle-wash px-4 py-3.5">
      {[0, 1, 2].map((dot) => (
        <span
          key={dot}
          className="size-2 animate-bounce rounded-full bg-rb-beetle"
          style={{ animationDelay: `${dot * 0.16}s` }}
        />
      ))}
    </div>
  )
}

function ChatBubble({ message, revealed, showChips }) {
  const isLearner = message.from === "learner"

  return (
    <div
      className={
        "rb-pop-in " +
        (isLearner
          ? "ml-auto max-w-[85%] rounded-rb-tile rounded-br-md bg-rb-polar px-4 py-3 text-[0.9375rem] text-rb-eel"
          : "max-w-[92%] rounded-rb-tile rounded-bl-md bg-rb-beetle-wash px-4 py-3 text-[0.9375rem] text-rb-eel")
      }
    >
      <p>
        <TypedParts parts={message.parts} revealed={revealed} />
        {revealed < messageLength(message) ? (
          <span
            aria-hidden="true"
            className="ml-0.5 inline-block h-4 w-[2px] translate-y-0.5 animate-pulse bg-rb-beetle"
          />
        ) : null}
      </p>

      {message.footer && showChips ? (
        <p className="mt-2 text-sm text-rb-wolf">{message.footer}</p>
      ) : null}

      {message.chips && showChips ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {message.chips.map((chip) => (
            <Chip key={chip} tone="beetle">
              {chip}
            </Chip>
          ))}
        </div>
      ) : null}

      {/* What the tutor actually returns once it has generated something: a way
          into the quiz or the deck, not the questions themselves. */}
      {message.action && showChips ? (
        <span className="rb-pop-in mt-3 inline-flex items-center gap-2 rounded-rb-pill bg-rb-beetle px-4 py-2.5 font-rb-display text-sm font-extrabold lowercase text-rb-snow shadow-[var(--comic-shadow-sm)]">
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
    <RebyuCard raised data-landing-reveal className="!p-0">
      <div className="flex items-center gap-3 border-b-2 border-rb-swan px-5 py-4">
        <span className="grid size-10 place-items-center rounded-full bg-rb-beetle text-rb-snow">
          <Sparkles className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <div className="font-rb-display text-base font-extrabold lowercase text-rb-eel">
            rebyu tutor
          </div>
          <div className="text-xs font-semibold text-rb-hare">Databases · Normalization</div>
        </div>

        {/* Scoped, and says so: the tutor answers inside the lesson you are on. */}
        <span className="ml-auto flex shrink-0 items-center gap-1.5 rounded-rb-pill bg-rb-feather-wash px-2.5 py-1 text-[0.6875rem] font-bold text-rb-feather-ink">
          <span className="size-1.5 animate-pulse rounded-full bg-rb-feather" aria-hidden="true" />
          in this lesson
        </span>
      </div>

      {/* Bottom-anchored at a fixed height: the transcript grows upward as a
          real one does, the card never changes size mid-conversation, and the
          earliest turns clip off the top the way a scrolled thread would. */}
      <div
        className="flex h-[392px] flex-col justify-end gap-4 overflow-hidden p-5"
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
    </RebyuCard>
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
    <div id="features" className="scroll-mt-24 bg-rb-lime rb-halftone rb-band">
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

/* --------------------------------------------------------------- gamification */

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
    <section className="bg-rb-polar rb-halftone px-5 py-20 lg:px-8 lg:py-28">
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

        <div className="mt-12 grid gap-5 lg:grid-cols-[1.35fr_1fr]">
          {/* the ranked module list — the core of the feature */}
          <RebyuCard raised data-landing-reveal className="!p-0">
            {/* The tile's own chrome, down to the hint line and the
                not-yet-assessed count. That pill is not decoration: topics
                with no answers behind them carry no estimate and are left out
                of the list, and the dashboard says so rather than letting the
                learner assume the list is everything. */}
            <div className="flex items-start justify-between gap-3 border-b-2 border-rb-swan px-5 py-4">
              <div>
                <div className="font-rb-display text-lg font-extrabold lowercase text-rb-eel">
                  mastery by topic
                </div>
                <p className="mt-1 max-w-sm text-xs font-semibold text-rb-wolf">
                  Weakest first — every topic with enough answers behind it to score.
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-rb-polar px-2.5 py-1 text-[11px] font-bold text-rb-wolf">
                4 not yet assessed
              </span>
            </div>

            <ul className="divide-y-2 divide-rb-swan">
              {/* One row per topic, laid out the way `MasteryRow` lays it out
                  on the dashboard: the priority seal on the left, the title and
                  its category beside it, the estimate on the right, and the
                  evidence count under the bar. The seal replaced a coloured
                  text pill -- the pill was this page's own invention, and a
                  stack of them reads as chatter rather than as an order to
                  study in. */}
              {TOPICS.map((topic) => (
                <li key={topic.name} className="flex items-start gap-3 px-5 py-4">
                  <PrioritySeal tag={topic.priorityTag} size={36} />

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-rb-eel">{topic.name}</span>
                      <span className="rb-numeric ml-auto text-sm text-rb-eel">
                        {topic.mastery}%
                      </span>
                    </div>

                    <ProgressBar
                      value={topic.mastery}
                      tone={masteryTone(topic.mastery)}
                      label={`${topic.name} mastery`}
                      className="mt-2"
                    />

                    <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-semibold text-rb-wolf">
                      <span>{topic.domain}</span>
                      <span className="text-rb-hare" aria-hidden="true">·</span>
                      <span>{topic.answers} answers</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </RebyuCard>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
            {/* The dashboard's focus tile. It names one topic rather than
                counting several, and the copy is the board's own: the label
                changes with the mastery band, and under it sits the topic you
                would open next. A "3 topics currently weak" tally stood here
                before -- a figure the board does not carry, answering a
                question ("how bad is it overall") the board deliberately
                refuses in favour of "start here". */}
            <RebyuCard raised data-landing-reveal className="!bg-rb-cardinal-wash">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-bold text-rb-cardinal-lip">Study this first</p>
                <PrioritySeal tag={TOPICS[0].priorityTag} size={36} />
              </div>

              <p className="mt-4 font-rb-display text-4xl font-extrabold leading-[0.9] tracking-tight tabular-nums text-rb-cardinal-lip sm:text-5xl">
                {TOPICS[0].mastery}%
              </p>
              <p className="mt-2 font-bold text-rb-eel">{TOPICS[0].name}</p>
              <p className="mt-1 text-sm font-semibold text-rb-wolf">
                Your weakest topic — start here.
              </p>
            </RebyuCard>

            {/* Also on the board, and the one figure a learner opens it for. */}
            <RebyuCard raised data-landing-reveal>
              <div className="flex items-center gap-4">
                <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-rb-feather-wash text-rb-feather-ink">
                  <Gauge className="size-6" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <div className="rb-numeric text-2xl leading-none">68%</div>
                  <div className="mt-1 text-sm font-semibold text-rb-wolf">Exam readiness</div>
                </div>
              </div>
              <p className="rb-body mt-4 text-sm">
                Your estimated chance of passing, from mastery across every domain the paper
                weights — not from how much of the course you have clicked through.
              </p>
            </RebyuCard>

            {/* The third of the board's headline tiles. Mastery says where you
                are, readiness says whether that is enough, and this says
                whether it is moving -- which is the only one of the three a
                single sitting can show you. */}
            <RebyuCard raised data-landing-reveal className="sm:col-span-2 lg:col-span-1">
              <div className="font-rb-display text-lg font-extrabold lowercase text-rb-eel">
                score across retakes
              </div>
              <p className="mt-1 text-xs font-semibold text-rb-wolf">
                Each assessment's attempts in order — a rising line is a score you moved.
              </p>
              <div className="mt-3">
                <RetakeScoreChart />
              </div>
            </RebyuCard>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ community */

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

/* --------------------------------------------------------------------- access */

function AccessCard({ icon: Icon, title, description, points, cta, to, tone }) {
  return (
    <RebyuCard raised data-landing-reveal className="flex flex-col">
      <span
        className={`grid size-14 place-items-center rounded-2xl ${
          tone === "feather"
            ? "bg-rb-feather-wash text-rb-feather-ink"
            : "bg-rb-humpback/10 text-rb-humpback"
        }`}
      >
        <Icon className="size-7" aria-hidden="true" />
      </span>

      <h3 className="rb-display rb-display-md mt-5">{title}</h3>
      <p className="rb-body mt-3">{description}</p>

      <div className="mt-6 flex-1 space-y-3 border-t-2 border-rb-swan pt-6">
        {points.map((point) => (
          <div key={point} className="flex items-start gap-3">
            <Check
              className={`mt-0.5 size-5 shrink-0 ${
                tone === "feather" ? "text-rb-feather" : "text-rb-humpback"
              }`}
              aria-hidden="true"
            />
            <span className="text-[0.9375rem] text-rb-eel">{point}</span>
          </div>
        ))}
      </div>

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
    </RebyuCard>
  );
}

function AccessSection() {
  return (
    <section id="get-access" className="scroll-mt-24 bg-rb-cyan rb-halftone rb-band px-5 py-20 lg:px-8 lg:py-28">
      <div className="mx-auto max-w-[1280px]">
        <div data-landing-reveal className="max-w-2xl">
          <p className="rb-eyebrow">get access</p>
          <WordReveal
            as="h2"
            className="rb-display rb-display-lg mt-3"
            text="start on your own, or bring your school."
          />
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          <AccessCard
            icon={GraduationCap}
            title="for learners"
            description="Study every lesson free. Upgrade when you want mock exams, analytics, and study plans."
            points={LEARNER_POINTS}
            cta="start reviewing"
            to="/register"
            tone="feather"
          />
          <AccessCard
            icon={Building2}
            title="for institutions"
            description="Give your learners certification access through a managed partnership."
            points={INSTITUTION_POINTS}
            cta="request partnership"
            to="/institution/request-access"
            tone="humpback"
          />
        </div>
      </div>
    </section>
  );
}

/* --------------------------------------------------------------------- footer */

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

/* ----------------------------------------------------------------------- page */

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
    <div ref={rootRef} className="rebyu-ds rb-light-only rb-landing-comic min-h-screen overflow-x-clip">
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
