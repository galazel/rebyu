import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Award,
  BarChart3,
  BookOpen,
  Bookmark,
  Briefcase,
  Building2,
  Check,
  Code2,
  Cpu,
  Crop,
  FileText,
  Flame,
  Gift,
  Heart,
  History,
  Layers,
  Loader2,
  Lock,
  Menu,
  MessageCircle,
  Medal,
  Mic,
  Network,
  Plus,
  Shield,
  ShieldCheck,
  Sparkles,
  SquarePen,
  Star,
  Target,
  ChevronDown,
  Users,
  X,
  Zap,
} from "@/components/icons";

import { BrandLogo } from "@/components/brand-logo";
import { FolderShelf } from "@/components/classroom/folder-shelf.jsx";
import { PinBoard } from "@/components/classroom/pin-board.jsx";
import { DiagnosticMock, ProgressMock, StudyLoopMock } from "@/pages/public/landing-product-mocks.jsx";
import { TraySupplies } from "@/components/classroom/tray-supplies.jsx";
import { RebyuCard, TactileButton } from "@/components/rebyu/rebyu-ui.jsx";
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


const SHOW_COMMUNITY = true;

// Icon tiles use the game-kit categories, the same coloured tiles as the learner sidebar.
const ICON_TONES = ["explain", "insight", "recall", "decision", "organize", "worked", "timed", "word"];
const iconTone = (index) => `tg-cat-${ICON_TONES[index % ICON_TONES.length]}`;

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
    body: "REBYU orders your lessons by what is weakest and what the exam weighs most.",
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
        REBYU
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
          <Link to="/" onClick={handleBrandClick} className="shrink-0" aria-label="REBYU Home">
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
            REBYU finds the topics you are weakest at and builds your study plan around them — so
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
          <p className="rb-eyebrow">what REBYU is</p>
          <WordReveal
            as="h2"
            className="rb-display rb-display-lg mt-3"
            text="One place to prepare for one exam."
          />
          <p className="rb-body-lg mt-5">
            REBYU is a certification review platform for TOPCIT, IT Passport, and the FE exam. It
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
          ].map(([Icon, title, body], index) => (
            <HoverLift key={title} className="h-full">
              <RebyuCard raised data-landing-reveal className="h-full">
                <span className={`tg-badge-icon ${iconTone(index)} !size-12 !rounded-xl`}>
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
            text="Cramming feels productive. it isn't."
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
                <span className="tg-badge-icon tg-cat-decision mt-0.5 !size-8 !rounded-lg">
                  <X className="size-4" aria-hidden="true" />
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
          <DiagnosticMock topics={TOPICS} />
          <p className="rb-body mt-6 text-center text-sm">
            REBYU starts with a diagnostic — one question per lesson — so the weak spots show up on
            day one, not on exam day.
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
          <StudyLoopMock />
          <p className="rb-body mt-6 text-center text-sm">
            Every answer is marked on the spot and moves your proficiency. Your study calendar keeps
            the weakest lessons first.
          </p>
        </div>

        <div data-landing-reveal>
          <p className="rb-eyebrow">the solution</p>
          <WordReveal
            as="h2"
            className="rb-display rb-display-lg mt-3"
            text="Measure what you know. study what you don't."
          />
          <p className="rb-body-lg mt-5">
            REBYU turns preparation into a loop: answer, get corrected immediately, and let the
            result change what you see next. Nothing is left to memory or willpower.
          </p>

          <ul className="mt-8 space-y-4">
            {[
              [Target, "A diagnostic finds your gaps", "One question per lesson places you before you study anything."],
              [Zap, "Adaptive quizzes and exams", "Each answer makes the next question harder or easier, and you get a proficiency out of 100."],
              [BarChart3, "Mastery per topic", "Every answer updates the topic behind it; the weakest are flagged to review first."],
              [Layers, "A plan that follows it", "Your study calendar puts weak lessons first, in Pomodoro-sized focus blocks."],
            ].map(([Icon, title, body], index) => (
              <li key={title} className="flex gap-3">
                <span className={`tg-badge-icon ${iconTone(index)} mt-0.5 !size-8 !rounded-lg`}>
                  <Icon className="size-4" aria-hidden="true" />
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
    macaw: "tg-badge-icon tg-cat-recall !size-12 !rounded-xl",
    beetle: "tg-badge-icon tg-cat-organize !size-12 !rounded-xl",
    feather: "tg-badge-icon tg-cat-explain !size-12 !rounded-xl",
    fox: "tg-badge-icon tg-cat-timed !size-12 !rounded-xl",
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
            text="Four steps, in this order, every time."
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


// Mirrors the real lesson tutor panel (lesson-ai-tutor.jsx) and its separate guided
// dialogue screen (tutor-dialogue.jsx), played as two slides: learner turns are typed
// into the composer and sent, tutor turns stream in.
const TUTOR_DEMO = [
  {
    screen: "chat",
    from: "learner",
    snip: "EMPLOYEE (emp_id, name, dept_id, dept_name)",
    text: "Why isn't this table in 3NF?",
  },
  {
    screen: "chat",
    from: "tutor",
    kind: "text",
    parts: [
      { text: "Because " },
      { text: "dept_name", strong: true },
      { text: " depends on " },
      { text: "dept_id", strong: true },
      { text: ", not on the key emp_id — a " },
      { text: "transitive dependency", strong: true },
      { text: ". Move it into a DEPARTMENT table and EMPLOYEE is in 3NF." },
    ],
  },
  { screen: "chat", from: "learner", text: "Create a quiz based on this lesson." },
  { screen: "chat", from: "tutor", kind: "quiz" },
  {
    screen: "dialogue",
    from: "tutor",
    kind: "dialogue",
    label: "Explain it simply",
    question: "What makes a table 3NF? Say it like I'm new to databases.",
  },
  { screen: "dialogue", from: "learner", text: "Every column depends on the key and nothing else." },
  {
    screen: "dialogue",
    from: "tutor",
    kind: "dialogue",
    feedback: [
      { text: "Good — that's the core idea. One gap: say what it rules out, a " },
      { text: "non-key column depending on another non-key column", strong: true },
      { text: "." },
    ],
    label: "Spot the mistake",
    question: "“No partial dependencies means the table is already in 3NF.” What's wrong?",
  },
]

const DEMO_QUIZ = {
  title: "Normalization — practice",
  question: "Which dependency does 3NF remove?",
  options: ["Partial", "Transitive", "Multivalued", "Join"],
  answer: 1,
}

const DEMO_DIALOGUE_TOPICS = ["Normal forms", "Dependencies", "Decomposition"]
const DEMO_FEYNMAN_TIPS = ["Use everyday words", "Say why it matters", "Give an example"]

const DEMO_TIMING = {
  emptyState: 2000,
  perKeystroke: 32,
  beforeSend: 450,
  afterSend: 500,
  thinking: 1100,
  perCharacter: 14,
  quizPick: 1500,
  readPause: 2200,
  slideIn: 700,
  beforeNextSlide: 2500,
}

function textLength(parts) {
  return parts.reduce((total, part) => total + part.text.length, 0)
}

function TypedParts({ parts, revealed = Infinity }) {
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

function DemoTutorAvatar() {
  return (
    <span className="grid size-7 shrink-0 place-items-center rounded-full bg-rb-feather text-white ring-2 ring-white">
      <Sparkles className="size-4" aria-hidden="true" />
    </span>
  )
}

function DemoLearnerMessage({ message }) {
  return (
    <div className="rb-pop-in flex justify-end">
      <div className="max-w-[85%] rounded-2xl rounded-br-md bg-rb-feather px-3.5 py-2.5 text-white">
        {message.snip ? (
          <div className="mb-1.5 flex items-center gap-2 rounded-lg bg-white/15 px-2.5 py-1.5 text-xs font-semibold">
            <Crop className="size-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate font-mono">{message.snip}</span>
          </div>
        ) : null}
        <p className="text-sm font-medium leading-6">{message.text}</p>
      </div>
    </div>
  )
}

function DemoQuiz({ picked }) {
  return (
    <div className="w-full rounded-2xl border border-rb-swan bg-white p-4 shadow-[0_2px_10px_rgba(17,55,43,0.06)]">
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex rounded-xl bg-rb-polar p-1 text-xs font-semibold">
          <span className="rounded-lg bg-white px-2.5 py-1 text-rb-eel shadow-sm">Quiz</span>
          <span className="px-2.5 py-1 text-rb-wolf">Flashcards</span>
        </span>
        <span className="flex items-center gap-1 text-[11px] font-semibold text-rb-feather-lip">
          <BookOpen className="size-3.5" aria-hidden="true" />
          Saved to Library
        </span>
      </div>
      <p className="mt-3 font-rb-display text-sm text-rb-eel">{DEMO_QUIZ.title}</p>
      <p className="mt-2 text-sm font-bold leading-5 text-rb-eel">{DEMO_QUIZ.question}</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {DEMO_QUIZ.options.map((option, index) => {
          const correct = picked && index === DEMO_QUIZ.answer
          return (
            <span
              key={option}
              className={`flex items-center gap-2 rounded-xl border px-2.5 py-2 text-xs transition-colors duration-300 ${
                correct ? "border-rb-feather/40 bg-rb-feather-wash text-rb-eel" : "border-rb-swan text-rb-eel"
              }`}
            >
              {correct ? (
                <Check className="size-4 shrink-0 text-rb-feather-lip" aria-hidden="true" />
              ) : (
                <span className="grid size-4 shrink-0 place-items-center rounded-full border border-rb-swan text-[9px] font-bold text-rb-wolf">
                  {String.fromCharCode(65 + index)}
                </span>
              )}
              {option}
            </span>
          )
        })}
      </div>
      {picked ? (
        <p className="rb-pop-in mt-2.5 rounded-xl bg-rb-feather-wash/60 px-3 py-2 text-xs text-rb-eel">
          <strong>Correct!</strong> 3NF removes transitive dependencies.
        </p>
      ) : null}
    </div>
  )
}

function DemoChatTutorMessage({ message, revealed, quizPicked }) {
  return (
    <div className="rb-pop-in flex items-start gap-2.5">
      <DemoTutorAvatar />
      <div className="min-w-0 flex-1">
        <p className="mb-1 text-xs font-bold uppercase tracking-wide text-rb-feather-lip">REBYU AI Tutor</p>
        {message.kind === "quiz" ? (
          <DemoQuiz picked={quizPicked} />
        ) : (
          <p className="text-sm leading-6 text-rb-eel [&_strong]:font-extrabold [&_strong]:text-rb-feather-ink">
            <TypedParts parts={message.parts} revealed={revealed} />
          </p>
        )}
      </div>
    </div>
  )
}

function DemoDialogueTutorMessage({ message, revealed }) {
  const feedbackLength = message.feedback ? textLength(message.feedback) : 0

  return (
    <div className="rb-pop-in flex items-start gap-2.5">
      <DemoTutorAvatar />
      <div className="min-w-0 flex-1 rounded-2xl rounded-tl-md border border-rb-swan bg-white px-3.5 py-3 text-sm leading-6 text-rb-eel shadow-[0_2px_10px_rgba(17,55,43,0.06)] [&_strong]:font-extrabold [&_strong]:text-rb-feather-ink">
        <p className="mb-1.5 text-[10px] font-extrabold uppercase tracking-[0.12em] text-rb-feather-lip">
          REBYU AI Tutor
        </p>
        {message.feedback ? (
          <p>
            <TypedParts parts={message.feedback} revealed={revealed} />
          </p>
        ) : null}
        {revealed >= feedbackLength ? (
          <div
            className={`rb-pop-in ${message.feedback ? "mt-2.5" : ""} rounded-xl border-l-4 border-rb-feather bg-rb-feather-wash/50 px-3 py-2.5`}
          >
            <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-rb-feather-lip">
              {message.label}
            </p>
            <p className="mt-0.5 font-extrabold leading-snug">{message.question}</p>
          </div>
        ) : null}
      </div>
    </div>
  )
}

function DemoThinking() {
  return (
    <div className="rb-pop-in flex items-center gap-2.5">
      <DemoTutorAvatar />
      <p className="flex items-center gap-2 rounded-[1.1rem] rounded-tl-md border-2 border-rb-swan bg-white px-3.5 py-2 text-xs font-bold text-rb-wolf">
        <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
        Thinking…
      </p>
    </div>
  )
}

function DemoComposer({ draft, placeholder, tips }) {
  return (
    <div className="shrink-0 border-t border-rb-swan bg-rb-snow px-3 pb-2 pt-3">
      <div className="rounded-[18px] border border-rb-feather/40 bg-white p-3">
        {tips ? (
          <p className="mb-2 flex flex-wrap gap-1.5 text-[10px] font-bold text-rb-wolf">
            {DEMO_FEYNMAN_TIPS.map((tip) => (
              <span key={tip} className="rounded-full bg-rb-polar px-2 py-0.5">
                {tip}
              </span>
            ))}
          </p>
        ) : null}
        <p className={`min-h-6 text-sm ${draft ? "text-rb-eel" : "text-rb-hare"}`}>
          {draft || placeholder}
          {draft ? <span className="ml-px inline-block h-4 w-px translate-y-0.5 animate-pulse bg-rb-eel" /> : null}
        </p>
        <div className="mt-2 flex items-center justify-between" aria-hidden="true">
          {tips ? (
            <span className="rounded-[10px] border border-rb-swan px-2.5 py-1 text-xs font-bold text-rb-eel">hint</span>
          ) : (
            <Plus className="size-5 text-rb-eel" />
          )}
          <span className="flex items-center gap-3">
            <Mic className="size-4 text-rb-wolf" />
            <span
              className={`grid size-9 place-items-center rounded-[10px] text-white transition-colors ${
                draft ? "bg-rb-feather" : "bg-rb-feather/40"
              }`}
            >
              <ArrowUp className="size-4" />
            </span>
          </span>
        </div>
      </div>
      <p className="mt-1.5 text-center text-[10px] font-medium text-rb-hare">
        REBYU AI can make mistakes · check your lesson materials
      </p>
    </div>
  )
}

function DemoChatEmpty() {
  return (
    <div className="m-auto flex flex-col items-center px-4 text-center">
      <span className="tg-badge-icon tg-cat-explain !size-14 !rounded-2xl">
        <Sparkles className="size-7" aria-hidden="true" />
      </span>
      <p className="mt-4 font-rb-display text-lg text-rb-eel">Hi Alex, ready to dig in?</p>
      <p className="mt-1.5 max-w-[16rem] text-sm leading-6 text-rb-wolf">
        Ask anything about <strong className="text-rb-eel">Normalization</strong> — I&apos;ll stick to
        what&apos;s covered here.
      </p>
    </div>
  )
}

function DemoDialogueBar({ part }) {
  return (
    <>
      <div className="flex shrink-0 items-center gap-2 border-b-2 border-rb-swan bg-rb-polar/60 px-3 py-2">
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-extrabold text-rb-feather-lip">
          <ArrowLeft className="size-3.5" aria-hidden="true" /> chat
        </span>
        <p className="text-xs font-extrabold uppercase tracking-wide text-rb-wolf">guided dialogue</p>
      </div>
      <div className="shrink-0 border-b-2 border-rb-swan bg-rb-snow px-3 py-2">
        <p className="text-[11px] font-extrabold text-rb-eel">
          Part {part + 1} of {DEMO_DIALOGUE_TOPICS.length}
          <span className="font-bold text-rb-wolf"> · {DEMO_DIALOGUE_TOPICS[part]}</span>
        </p>
        <div className="mt-1.5 flex gap-1" aria-hidden="true">
          {DEMO_DIALOGUE_TOPICS.map((topic, index) => (
            <span
              key={topic}
              className={`h-1.5 flex-1 rounded-full ${
                index < part ? "bg-rb-feather" : index === part ? "bg-rb-feather/40" : "bg-rb-swan"
              }`}
            />
          ))}
        </div>
      </div>
    </>
  )
}

const DEMO_SLIDES = [
  { id: "chat", label: "Tutor chat", icon: Sparkles },
  { id: "dialogue", label: "Guided dialogue", icon: MessageCircle },
]

function slideSteps(slideIndex) {
  return TUTOR_DEMO.filter((message) => message.screen === DEMO_SLIDES[slideIndex].id)
}

function TutorConversation() {
  const [reducedMotion, setReducedMotion] = useState(false)
  const [slide, setSlide] = useState(0)
  const [startSlide, setStartSlide] = useState(0)
  const [shown, setShown] = useState(0)
  const [revealed, setRevealed] = useState(Infinity)
  const [quizPicked, setQuizPicked] = useState(false)
  const [thinking, setThinking] = useState(false)
  const [draft, setDraft] = useState("")
  const bodyRef = useRef(null)

  useEffect(() => {
    setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches)
  }, [])

  useEffect(() => {
    if (reducedMotion) {
      setSlide(startSlide)
      setShown(slideSteps(startSlide).length)
      setRevealed(Infinity)
      setQuizPicked(true)
      setThinking(false)
      setDraft("")
      return undefined
    }

    let cancelled = false
    const timers = new Set()
    const pause = (ms) =>
      new Promise((resolve, reject) => {
        const timer = window.setTimeout(() => {
          timers.delete(timer)
          if (cancelled) reject(new Error("stopped"))
          else resolve()
        }, ms)
        timers.add(timer)
      })

    // Driven by elapsed time, not timer count, so a throttled tab skips ahead instead of crawling.
    async function typeOut(total, msPerCharacter, onProgress) {
      const startedAt = performance.now()
      for (;;) {
        const count = Math.min(total, Math.floor((performance.now() - startedAt) / msPerCharacter))
        onProgress(count)
        if (count >= total) return
        await pause(30)
      }
    }

    async function playSlide(slideIndex) {
      const steps = slideSteps(slideIndex)
      setSlide(slideIndex)
      setShown(0)
      setQuizPicked(false)
      setThinking(false)
      setDraft("")
      await pause(slideIndex === 0 ? DEMO_TIMING.emptyState : DEMO_TIMING.slideIn)

      for (let index = 0; index < steps.length; index += 1) {
        const message = steps[index]

        if (message.from === "learner") {
          await typeOut(message.text.length, DEMO_TIMING.perKeystroke, (count) =>
            setDraft(message.text.slice(0, count))
          )
          await pause(DEMO_TIMING.beforeSend)
          setDraft("")
          setShown(index + 1)
          await pause(DEMO_TIMING.afterSend)
          continue
        }

        setThinking(true)
        await pause(DEMO_TIMING.thinking)
        setThinking(false)
        setRevealed(0)
        setShown(index + 1)

        const parts = message.parts ?? message.feedback
        if (parts) await typeOut(textLength(parts), DEMO_TIMING.perCharacter, setRevealed)
        setRevealed(Infinity)

        if (message.kind === "quiz") {
          await pause(DEMO_TIMING.quizPick)
          setQuizPicked(true)
        }
        await pause(DEMO_TIMING.readPause)
      }

      await pause(DEMO_TIMING.beforeNextSlide)
    }

    async function play() {
      for (let slideIndex = startSlide; !cancelled; slideIndex = (slideIndex + 1) % DEMO_SLIDES.length) {
        await playSlide(slideIndex)
      }
    }

    play().catch(() => {})
    return () => {
      cancelled = true
      timers.forEach((timer) => window.clearTimeout(timer))
    }
  }, [reducedMotion, startSlide])

  useEffect(() => {
    const body = bodyRef.current
    if (body) body.scrollTo({ top: body.scrollHeight, behavior: reducedMotion ? "auto" : "smooth" })
  }, [shown, revealed, quizPicked, thinking, slide, reducedMotion])

  const steps = slideSteps(slide)
  const inDialogue = DEMO_SLIDES[slide].id === "dialogue"
  const dialoguePart = inDialogue && shown === steps.length && revealed === Infinity ? 1 : 0

  return (
    <div data-landing-reveal>
      <div className="mb-3 flex justify-center gap-2" role="tablist" aria-label="Tutor demos">
        {DEMO_SLIDES.map((item, index) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={slide === index}
            onClick={() => {
              setStartSlide(index)
              setSlide(index)
            }}
            className={`inline-flex items-center gap-1.5 rounded-rb-pill px-3.5 py-1.5 text-xs font-bold transition-colors focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-rb-feather ${
              slide === index
                ? "bg-rb-feather text-white"
                : "bg-white text-rb-eel ring-1 ring-rb-swan hover:ring-rb-feather"
            }`}
          >
            <item.icon className="size-3.5" aria-hidden="true" />
            {item.label}
          </button>
        ))}
      </div>

      <div
        className="flex h-[560px] flex-col overflow-hidden rounded-[1.25rem] border border-rb-swan bg-rb-snow shadow-[0_26px_65px_-24px_rgba(17,55,43,0.4)]"
        aria-label="AI tutor demo"
      >
        <div className="flex h-16 shrink-0 items-center justify-between bg-rb-feather px-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white text-rb-feather-lip ring-2 ring-white/40">
              <Sparkles className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="font-rb-display text-sm font-extrabold leading-tight text-white">REBYU AI Tutor</p>
              <p className="truncate text-xs font-bold text-white/80">Normalization</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3 text-white" aria-hidden="true">
            <History className="size-4" />
            <SquarePen className="size-4" />
            <X className="size-4" />
          </div>
        </div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={slide}
            className="flex min-h-0 flex-1 flex-col"
            initial={{ opacity: 0, x: 48 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -48 }}
            transition={{ duration: 0.35, ease: EASE }}
          >
            {inDialogue ? <DemoDialogueBar part={dialoguePart} /> : null}

            <div
              ref={bodyRef}
              className={`flex min-h-0 flex-1 flex-col gap-4 overflow-hidden px-4 py-4 ${
                inDialogue ? "bg-rb-polar/40" : ""
              }`}
              aria-live="polite"
              aria-atomic="false"
            >
              {!inDialogue && shown === 0 ? <DemoChatEmpty /> : null}
              {steps.slice(0, shown).map((message, index) => {
                const messageRevealed = index === shown - 1 ? revealed : Infinity
                if (message.from === "learner") return <DemoLearnerMessage key={index} message={message} />
                return inDialogue ? (
                  <DemoDialogueTutorMessage key={index} message={message} revealed={messageRevealed} />
                ) : (
                  <DemoChatTutorMessage
                    key={index}
                    message={message}
                    revealed={messageRevealed}
                    quizPicked={quizPicked}
                  />
                )
              })}
              {thinking ? <DemoThinking /> : null}
            </div>

            <DemoComposer
              draft={draft}
              placeholder={inDialogue ? "Explain it in your own words…" : "Ask about this lesson…"}
              tips={inDialogue}
            />
          </motion.div>
        </AnimatePresence>
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
            text="A tutor that sits with you in the lesson."
          />
          <p className="rb-body-lg mt-4 max-w-lg">
            Stuck mid-lesson? Snip the part you mean and ask. The tutor knows which topics you are
            weak at, answers with something you can do — not just a wall of text — and can teach
            the lesson out loud.
          </p>

          <div className="mt-8 space-y-3">
            {[
              [Crop, "Snip any part of the lesson and ask about exactly that"],
              [Zap, "Answers with quizzes, diagrams, mind maps and lesson games"],
              [MessageCircle, "Guided dialogue: explain it back, Feynman-style, and get feedback"],
              [Mic, "Live voice tutor that teaches aloud — raise your hand to interrupt"],
              [Bookmark, "Quizzes, flashcards and mind maps save to your Library"],
            ].map(([Icon, text], index) => (
              <div key={text} className="flex items-start gap-3">
                <span className={`tg-badge-icon ${iconTone(index)} !size-9 !rounded-lg`}>
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <p className="pt-1.5 text-[0.9375rem] font-medium text-rb-eel">{text}</p>
              </div>
            ))}
          </div>

          <TactileButton asChild className="mt-8">
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


function WeaknessSection() {

  return (
    <section className="bg-rb-polar px-5 py-20 lg:px-8 lg:py-28">
      <div className="mx-auto max-w-[1280px]">
        <div data-landing-reveal className="max-w-2xl">
          <p className="rb-eyebrow">mastery &amp; weak topics</p>
          <WordReveal
            as="h2"
            className="rb-display rb-display-lg mt-3"
            text="It knows which topics you are weak at."
          />
          <p className="rb-body-lg mt-4">
            Every answer updates a mastery level for the topic behind it, and the number of answers
            behind that level is shown next to it — an estimate from seven answers is not the same
            claim as one from fifty. Weakest first, so your next hour is already decided.
          </p>
        </div>

        <div data-landing-reveal className="mt-12">
          <ProgressMock topics={TOPICS} notAssessed={4} readiness={68} />
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
            text="The best reviewer is another student."
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
            ].map(([Icon, text], index) => (
              <div key={text} className="flex items-start gap-3">
                <span className={`tg-badge-icon ${iconTone(index + 2)} !size-9 !rounded-lg`}>
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
            text="Bring your school onto REBYU."
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
          © {new Date().getFullYear()} REBYU. All rights reserved.
        </p>
      </div>

      <motion.div
        aria-hidden="true"
        style={{ y: wordmarkY }}
        className="pointer-events-none flex select-none justify-center overflow-hidden leading-[0.72]"
      >
        <span className="rb-wordmark font-rb-display text-[24vw] font-black uppercase tracking-tight text-rb-polar">
          REBYU
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
    <div ref={rootRef} className="rebyu-ds rb-light-only rb-classroom-landing tg-cat-explain min-h-screen overflow-x-clip">
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
        <WeaknessSection />
        <AccessSection />
      </main>
      <Footer />
      <BackToTopButton />
    </div>
  );
}
