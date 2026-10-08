import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  ArrowUp,
  Award,
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
  Flame,
  Gift,
  Heart,
  Layers,
  Lock,
  Menu,
  MessageCircle,
  Medal,
  Network,
  Shield,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  ChevronDown,
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


const SHOW_COMMUNITY = true;

const NAV_ITEMS = [
  { label: "about", href: "#about" },
  { label: "the problem", href: "#problem" },
  { label: "how it works", href: "#how-it-works" },
  { label: "certifications", href: "#certifications" },

  { label: "features", href: "#features" },
  { label: "get access", href: "#get-access" },
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

const DEPARTMENTS = [
  { id: "all", name: "All Departments", code: "ALL", description: "All technical & industry certifications across colleges" },
  { id: "ccs", name: "College of Computer Studies", code: "CCS", description: "Information Technology & Computer Science" },
  { id: "cba", name: "College of Business Administration and Accountancy", code: "CBAA", description: "BSA, BSMA, BSBA & Professional Certifications" },
  { id: "coe", name: "College of Engineering", code: "COE", description: "Computer, Electronics, Electrical, Mechanical & Civil Engineering" },
  { id: "cms", name: "College of Maritime Studies", code: "CMS", description: "STCW Mandatory Training & Maritime Competency Certificates" },
  { id: "chtm", name: "College of Hospitality and Tourism Management", code: "CHTM", description: "UCLM TETAC TESDA National Competency (NC II) Credentials" },
  { id: "con", name: "College of Nursing", code: "CON", description: "AHA Healthcare BLS/ACLS & TESDA Competencies" },
];

const CERTIFICATIONS = [
  {
    department: "ccs",
    departmentName: "Computer Studies",
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
    department: "ccs",
    departmentName: "Computer Studies",
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
    department: "ccs",
    departmentName: "Computer Studies",
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

  {
    department: "cba",
    departmentName: "Business Administration",
    title: "Certified Bookkeeper (CB)",
    wordmark: "bookkeeper",
    tone: "bee",
    icon: BarChart3,
    summary:
      "National Institute of Accounting Technicians (NIAT) credential for computerized double-entry accounting, payroll, and tax compliance.",
    lessons: 58,
    questions: "760",
    topics: [
      "Double-entry bookkeeping & journalizing",
      "Bank reconciliations & adjusting entries",
      "Payroll administration & statutory deductions",
      "Preparation of trial balance & financial reports",
    ],
  },
  {
    department: "cba",
    departmentName: "Business Administration",
    title: "Certified Tax Technician (CTT)",
    wordmark: "tax-tech",
    tone: "honey",
    icon: FileText,
    summary:
      "Philippine Institute of Certified Tax Technicians (PICAT) / NIAT credential for corporate taxation, withholding taxes, and TRAIN law compliance.",
    lessons: 62,
    questions: "820",
    topics: [
      "Income taxation & corporate tax returns",
      "Value-Added Tax (VAT) & percentage taxes",
      "Withholding tax administration & remittances",
      "Tax compliance, audit documentation & BIR rules",
    ],
  },
  {
    department: "cba",
    departmentName: "Business Administration",
    title: "Certified Tax Bookkeeper (CTB)",
    wordmark: "tax-book",
    tone: "fox",
    icon: BarChart3,
    summary:
      "NIAT recognized professional credential blending commercial corporate bookkeeping with Philippine regulatory tax filings.",
    lessons: 54,
    questions: "710",
    topics: [
      "Tax accounting & general ledger reconciliations",
      "BIR monthly, quarterly & annual filing preparation",
      "Allowable business deductions & tax liabilities",
      "Financial statement compilation for tax compliance",
    ],
  },
  {
    department: "cba",
    departmentName: "Business Administration",
    title: "Registered Cost Accountant (RCA)",
    wordmark: "rca",
    tone: "sea",
    icon: Layers,
    summary:
      "Institute of Certified Management Accountants (ICMA) & NIAT certification in manufacturing cost systems, budgeting, and variance analysis.",
    lessons: 70,
    questions: "940",
    topics: [
      "Job order & process costing systems",
      "Activity-Based Costing (ABC) & overhead allocation",
      "Cost-Volume-Profit (CVP) & breakeven analysis",
      "Standard costing & budgetary variance control",
    ],
  },

  {
    department: "chtm",
    departmentName: "Hospitality & Tourism",
    title: "Cookery NC II",
    wordmark: "cookery",
    tone: "fox",
    icon: Flame,
    summary:
      "TESDA National Certificate assessed via UCLM TETAC for commercial hot and cold food preparation, culinary fundamentals, and HACCP safety.",
    lessons: 72,
    questions: "920",
    topics: [
      "Workplace hygiene & safe food handling",
      "Mise en place, knife skills & kitchen safety",
      "Stocks, soups, mother sauces & appetizers",
      "Meat, poultry, seafood & vegetable cookery",
      "Portion control, food plating & temperature standards",
    ],
  },
  {
    department: "chtm",
    departmentName: "Hospitality & Tourism",
    title: "Front Office Services NC II",
    wordmark: "front-office",
    tone: "bee",
    icon: Star,
    summary:
      "TESDA credential assessed at UCLM TETAC for hotel Property Management Systems (PMS), reservations, guest relations, and night audit.",
    lessons: 56,
    questions: "740",
    topics: [
      "Hotel PMS reservations & booking management",
      "Guest arrival, registration, check-in & check-out",
      "Concierge services, inquiries & local tour guidance",
      "Guest billing, cash handling & night audit procedures",
    ],
  },
  {
    department: "chtm",
    departmentName: "Hospitality & Tourism",
    title: "Housekeeping NC II",
    wordmark: "housekeeping",
    tone: "fern",
    icon: Award,
    summary:
      "TESDA standard covering hotel guestroom staging, sanitization standards, public area maintenance, and linen/fabric care.",
    lessons: 50,
    questions: "680",
    topics: [
      "Guestroom servicing, bed making & turndown service",
      "Public area deep sanitization & housekeeping inspection",
      "Commercial laundry operations & fabric care",
      "Safe handling of cleaning chemicals & equipment maintenance",
    ],
  },
  {
    department: "chtm",
    departmentName: "Hospitality & Tourism",
    title: "Bartending NC II",
    wordmark: "bartending",
    tone: "honey",
    icon: Sparkles,
    summary:
      "TESDA credential assessed at UCLM TETAC for professional beverage preparation, cocktail mixology, wine service, and bar management.",
    lessons: 52,
    questions: "700",
    topics: [
      "Bar station preparation & glassware maintenance",
      "Classic & contemporary cocktail mixology techniques",
      "Wine classification, decanting & formal table service",
      "Responsible service of alcohol & bar inventory control",
    ],
  },
  {
    department: "chtm",
    departmentName: "Hospitality & Tourism",
    title: "Food & Beverage Services NC II",
    wordmark: "fnb-service",
    tone: "macaw",
    icon: Medal,
    summary:
      "TESDA qualification for dining room banquet setup, formal table service sequences (American, Russian, French), and customer hospitality.",
    lessons: 58,
    questions: "780",
    topics: [
      "Dining area preparation & formal table cover layout",
      "Welcoming guests, seating & taking food orders",
      "Food and beverage service styles & clearing techniques",
      "Banquet service workflows & guest check settlement",
    ],
  },

  {
    department: "cms",
    departmentName: "Maritime Studies",
    title: "Basic Training (BT)",
    wordmark: "bt-stcw",
    tone: "sea",
    icon: ShieldCheck,
    summary:
      "Mandatory STCW maritime safety foundation covering Personal Survival Techniques (PST), Fire Prevention, Elementary First Aid, and PSSR.",
    lessons: 80,
    questions: "1,100",
    topics: [
      "Personal Survival Techniques (PST) & life-saving appliances",
      "Fire Prevention & Fire Fighting (FPFF) at sea",
      "Elementary First Aid (EFA) & emergency triage",
      "Personal Safety & Social Responsibilities (PSSR)",
    ],
  },
  {
    department: "cms",
    departmentName: "Maritime Studies",
    title: "Ship Security Awareness (SSA)",
    wordmark: "ssa-isps",
    tone: "beetle",
    icon: Shield,
    summary:
      "STCW and ISPS Code mandatory training in recognizing maritime security risks, anti-piracy countermeasures, and ship security protocols.",
    lessons: 44,
    questions: "580",
    topics: [
      "ISPS Code framework & security levels (1, 2, 3)",
      "Threat identification, reconnaissance & reporting",
      "Access control, searches & contraband detection",
      "Anti-piracy protocols & shipboard emergency procedures",
    ],
  },
  {
    department: "cms",
    departmentName: "Maritime Studies",
    title: "Ratings Forming Part of a Navigational Watch (RFPNW)",
    wordmark: "rfpnw",
    tone: "macaw",
    icon: Target,
    summary:
      "STCW Regulation II/4 certification for lookout watchkeeping, magnetic and gyro compass steering commands, and bridge bridge-to-engine handovers.",
    lessons: 64,
    questions: "840",
    topics: [
      "Bridge watchkeeping duties & COLREGs lookout rules",
      "Steering orders, rudder commands & gyro/magnetic heading",
      "Internal bridge communication & emergency alarms",
      "IALA buoyage recognition & navigational handover checklist",
    ],
  },
  {
    department: "cms",
    departmentName: "Maritime Studies",
    title: "Radar Simulator Training",
    wordmark: "radar",
    tone: "plum",
    icon: Network,
    summary:
      "STCW simulator training in marine radar operation, automatic radar plotting aids (ARPA), collision avoidance, and restricted visibility navigation.",
    lessons: 60,
    questions: "800",
    topics: [
      "Radar operational controls, tuning & clutter rejection",
      "Manual plotting, CPA and TCPA calculation",
      "ARPA target acquisition, tracking & vector displays",
      "Navigation and collision avoidance in heavy sea & fog",
    ],
  },

  {
    department: "coe",
    departmentName: "College of Engineering",
    title: "Cisco Certified Network Associate (CCNA)",
    wordmark: "ccna",
    tone: "sea",
    icon: Network,
    summary:
      "Cisco Networking Academy industry certification covering IP routing, Ethernet switching, cybersecurity basics, and network automation.",
    lessons: 98,
    questions: "1,320",
    topics: [
      "Network fundamentals & IPv4/IPv6 subnetting",
      "VLANs, trunking & inter-VLAN routing",
      "OSPF routing & IP services (DHCP/DNS/NAT)",
      "Network security concepts & access control lists (ACLs)",
      "Automation, REST APIs & software-defined networking",
    ],
  },
  {
    department: "coe",
    departmentName: "Engineering",
    title: "Electrical Installation & Maintenance NC II",
    wordmark: "eim-ncii",
    tone: "honey",
    icon: Zap,
    summary:
      "TESDA certification covering residential and commercial building wiring, conduit bending, electrical load calculations, and PEC compliance.",
    lessons: 66,
    questions: "880",
    topics: [
      "Electrical blueprints & schematic diagrams",
      "Conduit bending (EMT & PVC) & cable raceway installation",
      "Wiring devices, circuit breakers & distribution panels",
      "System testing, troubleshooting & Philippine Electrical Code",
    ],
  },
  {
    department: "coe",
    departmentName: "Engineering",
    title: "Mechatronics Servicing NC II / NC III",
    wordmark: "mechatronics",
    tone: "beetle",
    icon: Cpu,
    summary:
      "TESDA qualification in industrial automation, electro-pneumatic systems, PLC ladder programming, and robotic machinery servicing.",
    lessons: 74,
    questions: "960",
    topics: [
      "Electro-pneumatic circuits & hydraulic actuator systems",
      "Programmable Logic Controllers (PLC) ladder logic",
      "Industrial sensors, signal conditioning & servo motors",
      "Diagnostic testing & automated system commissioning",
    ],
  },

  {
    department: "con",
    departmentName: "College of Nursing",
    title: "Basic Life Support (BLS)",
    wordmark: "bls",
    tone: "beetle",
    icon: Heart,
    summary:
      "Standard healthcare provider life-saving certification required for clinical rotations, covering CPR, AED use, and airway emergencies.",
    lessons: 48,
    questions: "640",
    topics: [
      "High-quality adult, child & infant CPR techniques",
      "Automated External Defibrillator (AED) rapid operation",
      "Barrier devices, bag-valve-mask (BVM) ventilations",
      "Relief of foreign-body airway obstruction (choking)",
    ],
  },
  {
    department: "con",
    departmentName: "College of Nursing",
    title: "Advanced Cardiovascular Life Support (ACLS)",
    wordmark: "acls",
    tone: "fox",
    icon: Activity,
    summary:
      "Advanced clinical emergency resuscitation covering cardiac rhythm recognition, code team dynamics, airway management, and pharmacology.",
    lessons: 66,
    questions: "860",
    topics: [
      "Systematic clinical assessment & high-performance team dynamics",
      "Recognition & management of acute arrhythmias & ECG analysis",
      "Defibrillation, synchronized cardioversion & transcutaneous pacing",
      "Cardiac arrest pharmacology & post-cardiac arrest care",
    ],
  },
  {
    department: "con",
    departmentName: "College of Nursing",
    title: "Health Care Services NC II",
    wordmark: "healthcare",
    tone: "fern",
    icon: Award,
    summary:
      "TESDA national certification in clinical patient care, vital signs monitoring, bedside assistance, infection control, and sterile protocol.",
    lessons: 60,
    questions: "790",
    topics: [
      "Accurate vital signs monitoring & clinical charting",
      "Patient bed mobility, safe transfer techniques & positioning",
      "Clinical infection prevention & biomedical waste disposal",
      "Bedside personal care, bathing & comfort measures",
    ],
  },
];

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
    name: "champions cup",
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
        className={`rb-wordmark rb-display text-2xl leading-none transition-colors duration-200 ${
          light ? "text-white! [text-shadow:0_1px_3px_rgba(0,0,0,0.55)]" : ""
        }`}
      >
        rebyu
      </span>
    </span>
  );
}


function LandingNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState(null);
  const [hoveredNav, setHoveredNav] = useState(null);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsScrolled(scrollY > 24);

      if (scrollY < window.innerHeight * 0.45) {
        setActiveSection(null);
        return;
      }

      const sectionIds = [
        "about",
        "problem",
        "how-it-works",
        "certifications",
        "features",
        "get-access",
      ];

      const headerOffset = 140;
      let current = null;

      for (let i = sectionIds.length - 1; i >= 0; i--) {
        const id = sectionIds[i];
        const el = document.getElementById(id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= headerOffset) {
            current = `#${id}`;
            break;
          }
        }
      }

      setActiveSection(current);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
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

  const handleBrandClick = (e) => {
    close();
    if (window.location.pathname === "/" || window.location.pathname === "/welcome") {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleNavClick = (e, href) => {
    if (href.startsWith("#")) {
      e.preventDefault();
      close();
      const targetId = href.slice(1);
      const targetEl = document.getElementById(targetId);
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: "smooth", block: "start" });
        window.history.pushState(null, "", href);
      }
    }
  };

  const overHero = !isScrolled && !mobileMenuOpen;

  return (
    <header className="sticky top-0 z-50 w-full">
      <div
        className={`w-full border-b-2 transition-colors duration-200 ${
          overHero ? "border-transparent bg-transparent" : "border-rb-swan bg-rb-snow"
        }`}
      >
        <div className="mx-auto flex h-20 w-full max-w-[1280px] items-center justify-between gap-6 px-5 lg:px-8">
          <Link to="/" onClick={handleBrandClick} className="shrink-0" aria-label="Rebyu Home">
            <BrandMark light={overHero} />
          </Link>

          <nav
            className="hidden items-center gap-1 lg:flex"
            onMouseLeave={() => setHoveredNav(null)}
          >
            {NAV_ITEMS.map((item) => {
              const isActive = !overHero && activeSection === item.href;
              const isHovered = hoveredNav === item.href;

              return (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={(e) => handleNavClick(e, item.href)}
                  onMouseEnter={() => setHoveredNav(item.href)}
                  onFocus={() => setHoveredNav(item.href)}
                  className={`relative rounded-rb-pill px-4 py-2 font-rb-display text-[0.9375rem] transition-colors focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-rb-macaw ${
                    isActive ? "font-bold text-rb-eel" : "font-medium"
                  } ${
                    overHero
                      ? "text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.55)]"
                      : isHovered || isActive
                        ? "text-rb-eel"
                        : "text-rb-wolf hover:text-rb-eel"
                  }`}
                >
                  {isHovered ? (
                    <motion.span
                      layoutId="landing-nav-pill"
                      className={`absolute inset-0 rounded-rb-pill ${
                        overHero
                          ? "bg-white/15 backdrop-blur-md border border-white/20 shadow-sm"
                          : "bg-black/[0.05] border border-black/[0.04]"
                      }`}
                      transition={{ type: "spring", stiffness: 480, damping: 38, mass: 0.7 }}
                    />
                  ) : null}
                  <span className="relative z-10">{item.label}</span>
                </a>
              );
            })}
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
                  {NAV_ITEMS.map((item) => {
                    const isActive = activeSection === item.href;
                    return (
                      <motion.a
                        key={item.href}
                        href={item.href}
                        onClick={(e) => handleNavClick(e, item.href)}
                        variants={fadeUp}
                        className={`rounded-rb-tile px-4 py-3.5 font-rb-display text-lg transition-colors hover:bg-rb-polar ${
                          isActive ? "font-bold text-rb-eel bg-rb-polar/60" : "font-medium text-rb-wolf"
                        }`}
                      >
                        {item.label}
                      </motion.a>
                    );
                  })}
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
    <section className="relative isolate -mt-[82px] flex min-h-svh items-center overflow-hidden">
      <div aria-hidden="true" className="rb-classroom-photo absolute inset-0 -z-10" />

      <motion.div
        className="relative mx-auto w-full max-w-[1360px] px-4 pb-16 pt-28 sm:px-8"
        initial="hidden"
        animate="show"
        variants={staggerParent(0.09, 0.1)}
      >
        <div className="rb-chalkboard rb-hero-board px-6 pb-16 pt-12 text-center sm:px-16 sm:pb-24 sm:pt-16">
          <motion.p variants={fadeUp} className="rb-chalk-label mx-auto">
            <Typewriter text="for technical & industry certification candidates" speed={34} startOnMount />
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


function SolutionSection() {
  return (
    <section id="solution" className="relative scroll-mt-24 overflow-hidden bg-white px-5 py-20 lg:px-8 lg:py-28">
      <div className="mx-auto grid max-w-[1280px] items-center gap-12 lg:grid-cols-2 lg:gap-16">
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


function HowItWorksSection() {
  const TONE_CLASSES = {
    macaw: "bg-rb-macaw-wash text-rb-macaw-lip",
    beetle: "bg-rb-beetle-wash text-rb-beetle-lip",
    feather: "bg-rb-feather-wash text-rb-feather-ink",
    fox: "bg-rb-fox-wash text-rb-fox-lip",
  };

  const TONE_LINE = {
    macaw: "bg-rb-macaw",
    beetle: "bg-rb-beetle",
    feather: "bg-rb-feather",
    fox: "bg-rb-fox",
  };


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
                <div key={item.step} className="relative h-full">
                  {i > 0 ? (
                    <span
                      aria-hidden="true"
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
                    <motion.div
                      className="h-full"
                      initial={false}
                      animate={{ opacity: reached ? 1 : 0.45, y: reached ? 0 : 10 }}
                      transition={{ duration: 0.42, ease: EASE }}
                    >
                      <RebyuCard raised className="flex h-full flex-col">
                        <span
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


function CertificationSection() {
  const FOLDER = {
    macaw: { face: "#ecd29a", edge: "#d5b06b" },
    bee: { face: "#d3e2c4", edge: "#aec79c" },
    beetle: { face: "#efd2c2", edge: "#d9ab93" },
    fox: { face: "#fcd4b4", edge: "#e8a474" },
    sea: { face: "#c9e2ea", edge: "#92bed1" },
    fern: { face: "#d0e6d5", edge: "#9bc4a3" },
    plum: { face: "#e7d6eb", edge: "#c4a3ca" },
    honey: { face: "#fae5a8", edge: "#e4be5c" },
  };

  const [selectedDept, setSelectedDept] = useState("all");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const activeDepartment = DEPARTMENTS.find((d) => d.id === selectedDept) || DEPARTMENTS[0];

  const filteredCertifications = useMemo(() => {
    return selectedDept === "all"
      ? CERTIFICATIONS
      : CERTIFICATIONS.filter((c) => c.department === selectedDept);
  }, [selectedDept]);

  const rotatingWords = useMemo(() => {
    return filteredCertifications.map((c) => c.title);
  }, [filteredCertifications]);

  const headline = selectedDept === "all"
    ? `${filteredCertifications.length} certifications across all colleges, fully built out.`
    : `${filteredCertifications.length} certifications for ${activeDepartment.code}, fully built out.`;

  const shelfItems = useMemo(() => {
    return filteredCertifications.map((c) => ({
      key: c.title,
      tab: c.wordmark,
      title: c.title,
      meta: `${c.lessons} lessons · ${c.questions} questions`,
      icon: c.icon,
      color: FOLDER[c.tone] || FOLDER.macaw,
      left: (
        <>
          <p className="rb-eyebrow">{c.departmentName || "certification"}</p>
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
    }));
  }, [filteredCertifications]);

  return (
    <section id="certifications" className="relative scroll-mt-24 overflow-hidden bg-white px-5 py-20 lg:px-8 lg:py-28">
      <div className="mx-auto max-w-[1280px]">
        <div data-landing-reveal>
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <p
                className="rb-eyebrow !font-normal flex flex-wrap items-center gap-2"
                style={{ fontWeight: 400 }}
              >
                <span style={{ fontWeight: 400 }}>certifications</span>
                <span className="text-rb-wolf/50" style={{ fontWeight: 400 }}>·</span>
                <RotatingText
                  words={rotatingWords.length > 0 ? rotatingWords : ["certifications"]}
                  className="!font-normal"
                  itemClassName="text-rb-macaw-lip !font-normal"
                />
              </p>
              <h2 className="rb-display rb-display-lg mt-3 transition-opacity duration-200">
                {headline}
              </h2>
              <p className="rb-body-lg mt-4 max-w-xl">
                Every topic below has lessons, practice questions, and assessments already in the
                system — not a syllabus we plan to fill in later.
              </p>
            </div>

            <div className="relative z-30 shrink-0 w-full sm:w-80" ref={dropdownRef}>
              <div className="flex flex-col items-end gap-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-rb-wolf text-right">
                  Filter by Department
                </span>
                <button
                  type="button"
                  onClick={() => setDropdownOpen((prev) => !prev)}
                  className="flex w-full items-center justify-between gap-3 rounded-2xl border-2 border-rb-swan bg-white px-4 py-2.5 shadow-xs transition hover:border-rb-macaw-lip focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rb-macaw-lip"
                  aria-expanded={dropdownOpen}
                  aria-haspopup="listbox"
                >
                  <div className="flex min-w-0 items-center gap-2.5 text-left">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-rb-macaw-wash text-xs font-bold text-rb-macaw-lip">
                      {activeDepartment.code}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-rb-eel leading-tight truncate">
                        {activeDepartment.name}
                      </p>
                      <p className="text-xs text-rb-wolf truncate">
                        {filteredCertifications.length} {filteredCertifications.length === 1 ? "certification" : "certifications"}
                      </p>
                    </div>
                  </div>
                  <ChevronDown
                    className={`size-4 shrink-0 text-rb-wolf transition-transform duration-200 ${
                      dropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-full max-h-80 overflow-y-auto rounded-2xl border-2 border-rb-swan bg-white p-2 shadow-xl z-50">
                    {DEPARTMENTS.map((dept) => {
                      const count = dept.id === "all"
                        ? CERTIFICATIONS.length
                        : CERTIFICATIONS.filter((c) => c.department === dept.id).length;
                      const isSelected = dept.id === selectedDept;

                      return (
                        <button
                          key={dept.id}
                          type="button"
                          onClick={() => {
                            setSelectedDept(dept.id);
                            setDropdownOpen(false);
                          }}
                          className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left transition ${
                            isSelected
                              ? "bg-rb-macaw-wash text-rb-macaw-lip font-bold"
                              : "text-rb-eel hover:bg-black/5"
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-black/5">
                                {dept.code}
                              </span>
                              <span className="text-sm truncate">{dept.name}</span>
                            </div>
                            <p className="mt-0.5 text-xs text-rb-wolf truncate">
                              {dept.description}
                            </p>
                          </div>
                          <span className="ml-2 shrink-0 rounded-full bg-rb-paper px-2 py-0.5 text-xs font-semibold text-rb-wolf border border-rb-swan">
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-2">
            {DEPARTMENTS.map((dept) => {
              const isSelected = dept.id === selectedDept;
              return (
                <button
                  key={dept.id}
                  type="button"
                  onClick={() => setSelectedDept(dept.id)}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                    isSelected
                      ? "bg-[#123126] text-white shadow-xs"
                      : "border border-rb-swan bg-white text-rb-eel hover:border-[#123126] hover:text-[#123126]"
                  }`}
                >
                  {dept.code === "ALL" ? "All Departments" : dept.code}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-12 relative" data-folder-carousel-container>
          <FolderShelf
            items={shelfItems}
          />
        </div>
      </div>
    </section>
  );
}


function OlympicsSection() {
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
            time; the Champions Cup needs seven other people.
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
                className={`absolute inset-0 isolate m-auto h-[430px] w-[280px] overflow-hidden rounded-rb-card border-2 text-left [backface-visibility:hidden] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-rb-feather sm:w-[320px] ${
                  isActive
                    ? "border-rb-feather shadow-[0_26px_65px_-18px_rgba(17,138,87,0.45)]"
                    : "border-rb-swan shadow-[0_22px_55px_-18px_rgba(15,23,42,0.35)]"
                }`}
                style={{ zIndex: 10 - Math.abs(position) }}

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

        <div className="mx-auto mt-8 flex max-w-3xl flex-col items-center justify-between gap-3 text-center sm:flex-row sm:text-left">
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

function TutorConversation() {
  const [reducedMotion, setReducedMotion] = useState(false)
  const [done, setDone] = useState(0)
  const [revealed, setRevealed] = useState(0)
  const [thinking, setThinking] = useState(false)

  useEffect(() => {
    setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches)
  }, [])

  useEffect(() => {
    if (reducedMotion) return undefined

    const current = TUTOR_CHAT[done]

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

        <span className="rb-tutor-stamp">in this lesson</span>
      </div>

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

function FeaturesBand({ children }) {
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


const TOPICS = [
  { name: "Normalization", domain: "Databases", mastery: 31, answers: 42, priorityTag: "CRITICAL_PRIORITY" },
  { name: "Subnetting", domain: "Networks", mastery: 38, answers: 36, priorityTag: "HIGH_PRIORITY" },
  { name: "Deadlock handling", domain: "Operating systems", mastery: 44, answers: 18, priorityTag: "HIGH_PRIORITY" },
  { name: "Process scheduling", domain: "Operating systems", mastery: 57, answers: 51, priorityTag: "MEDIUM_PRIORITY" },
  { name: "Cryptography basics", domain: "Security", mastery: 62, answers: 7, priorityTag: "NOT_ENOUGH_DATA" },
  { name: "Sorting algorithms", domain: "Programming", mastery: 79, answers: 64, priorityTag: "STRONG" },
];

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


function CommunitySection() {
  return (
    <section id="community" className="scroll-mt-24 px-5 py-20 lg:px-8 lg:py-28">
      <div className="mx-auto grid max-w-[1280px] items-center gap-12 lg:grid-cols-2 lg:gap-16">
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


function Footer() {
  const footerRef = useRef(null);
  const wordmarkY = useParallax(footerRef, 34);

  const COLUMNS = [
    {
      title: "platform",
      links: [
        ["Certifications", "#certifications"],
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
              Comprehensive review for technical and industry certifications.
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

      <motion.div
        aria-hidden="true"
        style={{ y: wordmarkY }}
        className="pointer-events-none flex select-none justify-center overflow-hidden leading-[0.72]"
      >
        <span className="rb-wordmark font-rb-display text-[24vw] font-black lowercase tracking-tight text-rb-polar">
          rebyu
        </span>
      </motion.div>
    </footer>
  );
}


function BackToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const checkVisibility = () => {
      const accessSection = document.getElementById("get-access");
      if (accessSection) {
        const rect = accessSection.getBoundingClientRect();
        setVisible(rect.top <= window.innerHeight);
      } else {
        setVisible(window.scrollY > 2500);
      }
    };

    checkVisibility();
    window.addEventListener("scroll", checkVisibility, { passive: true });
    window.addEventListener("resize", checkVisibility, { passive: true });
    return () => {
      window.removeEventListener("scroll", checkVisibility);
      window.removeEventListener("resize", checkVisibility);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="rebyu-ds rb-light-only pointer-events-none">
      <AnimatePresence>
        {visible && (
          <motion.button
            type="button"
            onClick={scrollToTop}
            initial={{ opacity: 0, scale: 0.8, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 16 }}
            transition={{ duration: 0.24, ease: EASE }}
            whileHover={{ scale: 1.08, y: -2 }}
            whileTap={{ scale: 0.94 }}
            className="group pointer-events-auto fixed bottom-6 right-6 z-50 flex size-12 items-center justify-center rounded-full border border-rb-swan/90 bg-white/95 text-rb-eel shadow-[0_6px_24px_rgba(0,0,0,0.12)] backdrop-blur-md transition-colors hover:border-rb-macaw/50 hover:text-rb-macaw-lip focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rb-macaw sm:bottom-8 sm:right-8 sm:size-13 cursor-pointer select-none"
            aria-label="Back to top"
            title="Back to top"
          >
            <ArrowUp className="size-5 transition-transform duration-200 group-hover:-translate-y-0.5" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>,
    document.body
  );
}


export default function LandingPage() {
  const rootRef = useRef(null);

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
    <div ref={rootRef} className="rebyu-ds rb-light-only rb-classroom-landing min-h-screen overflow-x-clip">
      <LandingNavbar />
      <main>
        <HeroSection />
        <AboutSection />
        <ProblemSection />
        <SolutionSection />
        <HowItWorksSection />
        <CertificationSection />
        <FeaturesBand>
          <AiTutorSection />
          {SHOW_COMMUNITY ? <CommunitySection /> : null}
        </FeaturesBand>
        <OlympicsSection />
        <WeaknessSection />
        <AccessSection />
      </main>
      <Footer />
      <BackToTopButton />
    </div>
  );
}
