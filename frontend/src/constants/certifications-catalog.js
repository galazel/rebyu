/**
 * Shared catalog of departments (colleges) and their course programs,
 * mapped to their technical & industry certifications based on university curricula.
 */

export const CATALOG_DEPARTMENTS = [
  {
    id: "all",
    name: "All Departments",
    code: "ALL",
    description: "All industry certifications across colleges and programs",
  },
  {
    id: "ccs",
    name: "College of Computer Studies",
    code: "CCS",
    description: "BSIT, BSCS, and ACT Programs",
  },
  {
    id: "cba",
    name: "College of Business Administration and Accountancy",
    code: "CBAA",
    description: "BSMA and BSBA (Financial, Marketing, HR) Programs",
  },
  {
    id: "coe",
    name: "College of Engineering",
    code: "COE",
    description: "BSCpE, BSECE, BSEE, BSME, and BSCE Programs",
  },
  {
    id: "cms",
    name: "College of Maritime Studies",
    code: "CMS",
    description: "BSMT and BSMarE Programs",
  },
  {
    id: "chtm",
    name: "College of Hospitality and Tourism Management",
    code: "CHTM",
    description: "BSHM and Associate in Hotel & Restaurant Management",
  },
  {
    id: "con",
    name: "College of Nursing",
    code: "CON",
    description: "BSN Program",
  },
]

export const CATALOG_CERTIFICATIONS = [
  // 💻 College of Computer Studies (CCS)
  {
    id: 13,
    department: "ccs",
    departmentName: "College of Computer Studies",
    departmentCode: "CCS",
    programs: ["BSIT", "BSCS"],
    title: "TOPCIT",
    wordmark: "topcit",
    tone: "macaw",
    summary:
      "Performance-driven practical assessment measuring applied software engineering, database modeling, network protocols, cybersecurity, and real-world IT problem-solving.",
    description:
      "Performance-driven practical assessment measuring applied software engineering, database modeling, network protocols, cybersecurity, and real-world IT problem-solving.",
    lessons: 96,
    questions: "1,240",
    topics: [
      "Software development",
      "Databases",
      "Networking",
      "Information systems",
      "Project management",
    ],
    status: "PUBLISHED",
  },
  {
    id: 4,
    department: "ccs",
    departmentName: "College of Computer Studies",
    departmentCode: "CCS",
    programs: ["BSIT", "BSCS", "ACT"],
    title: "PhilNITS IT Passport",
    wordmark: "passport",
    tone: "bee",
    summary:
      "Foundational IT benchmark testing fundamental computing architecture, software literacy, network & database essentials, information security, and business IT strategy.",
    description:
      "Foundational IT benchmark testing fundamental computing architecture, software literacy, network & database essentials, information security, and business IT strategy.",
    lessons: 64,
    questions: "980",
    topics: ["Strategy", "Management", "Technology"],
    status: "PUBLISHED",
  },
  {
    id: 14,
    department: "ccs",
    departmentName: "College of Computer Studies",
    departmentCode: "CCS",
    programs: ["BSIT", "BSCS"],
    title: "PhilNITS FE Exam",
    wordmark: "fe",
    tone: "beetle",
    summary:
      "Level 2 technical qualification certifying core computer science, algorithm analysis, software design, systems architecture, databases, and network security.",
    description:
      "Level 2 technical qualification certifying core computer science, algorithm analysis, software design, systems architecture, databases, and network security.",
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
    status: "PUBLISHED",
  },

  // 📊 College of Business Administration and Accountancy (CBAA)
  {
    id: 206,
    department: "cba",
    departmentName: "College of Business Administration and Accountancy",
    departmentCode: "CBAA",
    programs: ["BSMA", "BSBA"],
    title: "Certified Bookkeeper (CB)",
    wordmark: "bookkeeper",
    tone: "bee",
    summary:
      "NIAT professional credential covering double-entry bookkeeping, general ledgers, trial balance compilation, payroll, and statutory tax compliance.",
    description:
      "NIAT professional credential covering double-entry bookkeeping, general ledgers, trial balance compilation, payroll, and statutory tax compliance.",
    lessons: 58,
    questions: "760",
    topics: [
      "Double-entry bookkeeping & journalizing",
      "Bank reconciliations & adjusting entries",
      "Payroll administration & statutory deductions",
      "Preparation of trial balance & financial reports",
    ],
    status: "PUBLISHED",
  },
  {
    id: 207,
    department: "cba",
    departmentName: "College of Business Administration and Accountancy",
    departmentCode: "CBAA",
    programs: ["BSMA", "BSBA"],
    title: "Certified Tax Technician (CTT)",
    wordmark: "tax-tech",
    tone: "honey",
    summary:
      "PICAT / NIAT qualification covering Philippine corporate taxation, Value-Added Tax (VAT), withholding taxes, and BIR regulatory compliance.",
    description:
      "PICAT / NIAT qualification covering Philippine corporate taxation, Value-Added Tax (VAT), withholding taxes, and BIR regulatory compliance.",
    lessons: 62,
    questions: "820",
    topics: [
      "Income taxation & corporate tax returns",
      "Value-Added Tax (VAT) & percentage taxes",
      "Withholding tax administration & remittances",
      "Tax compliance, audit documentation & BIR rules",
    ],
    status: "PUBLISHED",
  },
  {
    id: 208,
    department: "cba",
    departmentName: "College of Business Administration and Accountancy",
    departmentCode: "CBAA",
    programs: ["BSMA"],
    title: "Certified Tax Bookkeeper (CTB)",
    wordmark: "tax-book",
    tone: "fox",
    summary:
      "NIAT credential integrating commercial corporate bookkeeping with Philippine regulatory tax filings, deductible expenses, and financial audit records.",
    description:
      "NIAT credential integrating commercial corporate bookkeeping with Philippine regulatory tax filings, deductible expenses, and financial audit records.",
    lessons: 54,
    questions: "710",
    topics: [
      "Tax accounting & general ledger reconciliations",
      "BIR monthly, quarterly & annual filing preparation",
      "Allowable business deductions & tax liabilities",
      "Financial statement compilation for tax compliance",
    ],
    status: "PUBLISHED",
  },
  {
    id: 209,
    department: "cba",
    departmentName: "College of Business Administration and Accountancy",
    departmentCode: "CBAA",
    programs: ["BSMA"],
    title: "Registered Cost Accountant (RCA)",
    wordmark: "rca",
    tone: "sea",
    summary:
      "ICMA certification covering manufacturing cost accounting, activity-based costing (ABC), job-order costing, and budgetary variance control.",
    description:
      "ICMA certification covering manufacturing cost accounting, activity-based costing (ABC), job-order costing, and budgetary variance control.",
    lessons: 70,
    questions: "940",
    topics: [
      "Job order & process costing systems",
      "Activity-Based Costing (ABC) & overhead allocation",
      "Cost-Volume-Profit (CVP) & breakeven analysis",
      "Standard costing & budgetary variance control",
    ],
    status: "PUBLISHED",
  },

  // ⚙️ College of Engineering (COE)
  {
    id: 201,
    department: "coe",
    departmentName: "College of Engineering",
    departmentCode: "COE",
    programs: ["BSCpE", "BSECE"],
    title: "Cisco Certified Network Associate (CCNA)",
    wordmark: "ccna",
    tone: "sea",
    summary:
      "Cisco Networking Academy industry certification covering IP routing, Ethernet switching, network security, wireless LANs, and automation.",
    description:
      "Cisco Networking Academy industry certification covering IP routing, Ethernet switching, network security, wireless LANs, and automation.",
    lessons: 98,
    questions: "1,320",
    topics: [
      "Network fundamentals & IPv4/IPv6 subnetting",
      "VLANs, trunking & inter-VLAN routing",
      "OSPF routing & IP services (DHCP/DNS/NAT)",
      "Network security concepts & access control lists (ACLs)",
      "Automation, REST APIs & software-defined networking",
    ],
    status: "PUBLISHED",
  },
  {
    id: 205,
    department: "coe",
    departmentName: "College of Engineering",
    departmentCode: "COE",
    programs: ["BSECE"],
    title: "Mechatronics Servicing NC II / NC III",
    wordmark: "mechatronics",
    tone: "beetle",
    summary:
      "TESDA qualification in industrial automation, electro-pneumatic circuits, PLC ladder programming, sensor integration, and robotic servicing.",
    description:
      "TESDA qualification in industrial automation, electro-pneumatic circuits, PLC ladder programming, sensor integration, and robotic servicing.",
    lessons: 74,
    questions: "960",
    topics: [
      "Electro-pneumatic circuits & hydraulic actuator systems",
      "Programmable Logic Controllers (PLC) ladder logic",
      "Industrial sensors, signal conditioning & servo motors",
      "Diagnostic testing & automated system commissioning",
    ],
    status: "PUBLISHED",
  },
  {
    id: 204,
    department: "coe",
    departmentName: "College of Engineering",
    departmentCode: "COE",
    programs: ["BSEE"],
    title: "Electrical Installation & Maintenance NC II",
    wordmark: "eim-ncii",
    tone: "honey",
    summary:
      "TESDA certification covering building electrical wiring, conduit bending, load calculations, blueprints, and Philippine Electrical Code compliance.",
    description:
      "TESDA certification covering building electrical wiring, conduit bending, load calculations, blueprints, and Philippine Electrical Code compliance.",
    lessons: 66,
    questions: "880",
    topics: [
      "Electrical blueprints & schematic diagrams",
      "Conduit bending (EMT & PVC) & cable raceway installation",
      "Wiring devices, circuit breakers & distribution panels",
      "System testing, troubleshooting & Philippine Electrical Code",
    ],
    status: "PUBLISHED",
  },
  {
    id: 222,
    department: "coe",
    departmentName: "College of Engineering",
    departmentCode: "COE",
    programs: ["BSEE"],
    title: "Industrial Electricity NC III",
    wordmark: "industrial-elec",
    tone: "bee",
    summary:
      "Advanced credential in three-phase industrial distribution, motor control centers, protective relays, switchgear, and preventive maintenance.",
    description:
      "Advanced credential in three-phase industrial distribution, motor control centers, protective relays, switchgear, and preventive maintenance.",
    lessons: 68,
    questions: "850",
    topics: [
      "Three-phase power circuits & industrial motor controls",
      "Magnetic starters, variable frequency drives (VFD)",
      "Protective relay coordination & switchgear maintenance",
      "Industrial troubleshooting & electrical safety standards",
    ],
    status: "PUBLISHED",
  },
  {
    id: 223,
    department: "coe",
    departmentName: "College of Engineering",
    departmentCode: "COE",
    programs: ["BSME"],
    title: "Machining NC II & CNC Programming",
    wordmark: "machining",
    tone: "sea",
    summary:
      "TESDA qualification covering precision lathe and milling machine operations, engineering tolerances, metrology, and CNC G-code programming.",
    description:
      "TESDA qualification covering precision lathe and milling machine operations, engineering tolerances, metrology, and CNC G-code programming.",
    lessons: 65,
    questions: "810",
    topics: [
      "Precision lathe & milling machine operations",
      "Engineering blueprints, tolerances & metrology tools",
      "CNC coordinate systems, G-code & M-code programming",
      "Machine safety, coolant maintenance & tool sharpening",
    ],
    status: "PUBLISHED",
  },
  {
    id: 224,
    department: "coe",
    departmentName: "College of Engineering",
    departmentCode: "COE",
    programs: ["BSCE"],
    title: "Civil & Construction Works (Plumbing / Scaffold NC II)",
    wordmark: "construction-nc",
    tone: "fox",
    summary:
      "TESDA construction industry competencies covering structural blueprint interpretation, sanitary plumbing, scaffold erection, and jobsite safety.",
    description:
      "TESDA construction industry competencies covering structural blueprint interpretation, sanitary plumbing, scaffold erection, and jobsite safety.",
    lessons: 60,
    questions: "750",
    topics: [
      "Civil & structural blueprint reading and takeoff",
      "Sanitary plumbing systems, DWV pipes & pressure testing",
      "Scaffold erection, structural load rating & OSHA safety",
      "Construction materials handling & jobsite compliance",
    ],
    status: "PUBLISHED",
  },

  // 🚢 College of Maritime Studies (CMS)
  {
    id: 215,
    department: "cms",
    departmentName: "College of Maritime Studies",
    departmentCode: "CMS",
    programs: ["BSMT", "BSMarE"],
    title: "Basic Training (BT)",
    wordmark: "bt-stcw",
    tone: "sea",
    summary:
      "Mandatory STCW maritime safety foundation covering Personal Survival Techniques (PST), Fire Fighting, Elementary First Aid, and PSSR.",
    description:
      "Mandatory STCW maritime safety foundation covering Personal Survival Techniques (PST), Fire Fighting, Elementary First Aid, and PSSR.",
    lessons: 80,
    questions: "1,100",
    topics: [
      "Personal Survival Techniques (PST) & life-saving appliances",
      "Fire Prevention & Fire Fighting (FPFF) at sea",
      "Elementary First Aid (EFA) & emergency triage",
      "Personal Safety & Social Responsibilities (PSSR)",
    ],
    status: "PUBLISHED",
  },
  {
    id: 216,
    department: "cms",
    departmentName: "College of Maritime Studies",
    departmentCode: "CMS",
    programs: ["BSMT", "BSMarE"],
    title: "Ship Security Awareness (SSA)",
    wordmark: "ssa-isps",
    tone: "beetle",
    summary:
      "STCW and ISPS Code mandatory training in recognizing maritime security risks, anti-piracy countermeasures, access control, and shipboard protocols.",
    description:
      "STCW and ISPS Code mandatory training in recognizing maritime security risks, anti-piracy countermeasures, access control, and shipboard protocols.",
    lessons: 44,
    questions: "580",
    topics: [
      "ISPS Code framework & security levels (1, 2, 3)",
      "Threat identification, reconnaissance & reporting",
      "Access control, searches & contraband detection",
      "Anti-piracy protocols & shipboard emergency procedures",
    ],
    status: "PUBLISHED",
  },
  {
    id: 217,
    department: "cms",
    departmentName: "College of Maritime Studies",
    departmentCode: "CMS",
    programs: ["BSMT"],
    title: "Ratings Forming Part of a Navigational Watch (RFPNW)",
    wordmark: "rfpnw",
    tone: "macaw",
    summary:
      "STCW Regulation II/4 certification for bridge lookout watchkeeping, gyro/magnetic compass steering orders, and collision avoidance rules.",
    description:
      "STCW Regulation II/4 certification for bridge lookout watchkeeping, gyro/magnetic compass steering orders, and collision avoidance rules.",
    lessons: 64,
    questions: "840",
    topics: [
      "Bridge watchkeeping duties & COLREGs lookout rules",
      "Steering orders, rudder commands & gyro/magnetic heading",
      "Internal bridge communication & emergency alarms",
      "IALA buoyage recognition & navigational handover checklist",
    ],
    status: "PUBLISHED",
  },
  {
    id: 218,
    department: "cms",
    departmentName: "College of Maritime Studies",
    departmentCode: "CMS",
    programs: ["BSMarE"],
    title: "Ratings Forming Part of an Engineering Watch (RFPEW)",
    wordmark: "rfpew",
    tone: "plum",
    summary:
      "STCW Regulation III/4 certification for marine engine room watchkeeping, auxiliary machinery operations, bilge management, and safety rounds.",
    description:
      "STCW Regulation III/4 certification for marine engine room watchkeeping, auxiliary machinery operations, bilge management, and safety rounds.",
    lessons: 64,
    questions: "820",
    topics: [
      "Engine room watchkeeping duties & safety rounds",
      "Diesel engine operation, auxiliary boilers & purifiers",
      "Bilge pumping, ballast operations & MARPOL regulations",
      "Emergency machinery shutdowns & engine room communications",
    ],
    status: "PUBLISHED",
  },

  // 🛎️ College of Hospitality and Tourism Management (CHTM)
  {
    id: 210,
    department: "chtm",
    departmentName: "College of Hospitality and Tourism Management",
    departmentCode: "CHTM",
    programs: ["BSHM", "AHRM"],
    title: "Cookery NC II",
    wordmark: "cookery",
    tone: "fox",
    summary:
      "TESDA National Certificate via UCLM TETAC covering hot and cold food preparation, knife skills, HACCP food safety, and culinary cookery.",
    description:
      "TESDA National Certificate via UCLM TETAC covering hot and cold food preparation, knife skills, HACCP food safety, and culinary cookery.",
    lessons: 72,
    questions: "920",
    topics: [
      "Workplace hygiene & safe food handling",
      "Mise en place, knife skills & kitchen safety",
      "Stocks, soups, mother sauces & appetizers",
      "Meat, poultry, seafood & vegetable cookery",
      "Portion control, food plating & temperature standards",
    ],
    status: "PUBLISHED",
  },
  {
    id: 211,
    department: "chtm",
    departmentName: "College of Hospitality and Tourism Management",
    departmentCode: "CHTM",
    programs: ["BSHM", "AHRM"],
    title: "Front Office Services NC II",
    wordmark: "front-office",
    tone: "bee",
    summary:
      "TESDA credential in hotel Property Management Systems (PMS), reservations, guest check-in/out, concierge, and night audit procedures.",
    description:
      "TESDA credential in hotel Property Management Systems (PMS), reservations, guest check-in/out, concierge, and night audit procedures.",
    lessons: 56,
    questions: "740",
    topics: [
      "Hotel PMS reservations & booking management",
      "Guest arrival, registration, check-in & check-out",
      "Concierge services, inquiries & local tour guidance",
      "Guest billing, cash handling & night audit procedures",
    ],
    status: "PUBLISHED",
  },
  {
    id: 212,
    department: "chtm",
    departmentName: "College of Hospitality and Tourism Management",
    departmentCode: "CHTM",
    programs: ["BSHM", "AHRM"],
    title: "Housekeeping NC II",
    wordmark: "housekeeping",
    tone: "fern",
    summary:
      "TESDA standard covering hotel guestroom staging, sanitization standards, public area maintenance, chemical safety, and linen care.",
    description:
      "TESDA standard covering hotel guestroom staging, sanitization standards, public area maintenance, chemical safety, and linen care.",
    lessons: 50,
    questions: "680",
    topics: [
      "Guestroom servicing, bed making & turndown service",
      "Public area deep sanitization & housekeeping inspection",
      "Commercial laundry operations & fabric care",
      "Safe handling of cleaning chemicals & equipment maintenance",
    ],
    status: "PUBLISHED",
  },
  {
    id: 213,
    department: "chtm",
    departmentName: "College of Hospitality and Tourism Management",
    departmentCode: "CHTM",
    programs: ["BSHM", "AHRM"],
    title: "Bartending NC II",
    wordmark: "bartending",
    tone: "honey",
    summary:
      "TESDA credential in beverage station staging, classic and contemporary cocktail mixology, wine service, and responsible alcohol service.",
    description:
      "TESDA credential in beverage station staging, classic and contemporary cocktail mixology, wine service, and responsible alcohol service.",
    lessons: 52,
    questions: "700",
    topics: [
      "Bar station preparation & glassware maintenance",
      "Classic & contemporary cocktail mixology techniques",
      "Wine classification, decanting & formal table service",
      "Responsible service of alcohol & bar inventory control",
    ],
    status: "PUBLISHED",
  },
  {
    id: 214,
    department: "chtm",
    departmentName: "College of Hospitality and Tourism Management",
    departmentCode: "CHTM",
    programs: ["BSHM", "AHRM"],
    title: "Food & Beverage Services NC II",
    wordmark: "fnb-service",
    tone: "macaw",
    summary:
      "TESDA qualification for dining room banquet setup, formal table service sequences (American, Russian, French), and customer hospitality.",
    description:
      "TESDA qualification for dining room banquet setup, formal table service sequences (American, Russian, French), and customer hospitality.",
    lessons: 58,
    questions: "780",
    topics: [
      "Dining area preparation & formal table cover layout",
      "Welcoming guests, seating & taking food orders",
      "Food and beverage service styles & clearing techniques",
      "Banquet service workflows & guest check settlement",
    ],
    status: "PUBLISHED",
  },

  // 🩺 College of Nursing (CON)
  {
    id: 219,
    department: "con",
    departmentName: "College of Nursing",
    departmentCode: "CON",
    programs: ["BSN"],
    title: "Basic Life Support (BLS)",
    wordmark: "bls",
    tone: "beetle",
    summary:
      "Healthcare provider life-saving certification covering high-quality CPR for adults, children, and infants, AED use, and airway emergencies.",
    description:
      "Healthcare provider life-saving certification covering high-quality CPR for adults, children, and infants, AED use, and airway emergencies.",
    lessons: 48,
    questions: "640",
    topics: [
      "High-quality adult, child & infant CPR techniques",
      "Automated External Defibrillator (AED) rapid operation",
      "Barrier devices, bag-valve-mask (BVM) ventilations",
      "Relief of foreign-body airway obstruction (choking)",
    ],
    status: "PUBLISHED",
  },
  {
    id: 220,
    department: "con",
    departmentName: "College of Nursing",
    departmentCode: "CON",
    programs: ["BSN"],
    title: "Advanced Cardiovascular Life Support (ACLS)",
    wordmark: "acls",
    tone: "fox",
    summary:
      "Clinical emergency resuscitation credential covering ECG rhythm recognition, code team dynamics, airway management, and pharmacology.",
    description:
      "Clinical emergency resuscitation credential covering ECG rhythm recognition, code team dynamics, airway management, and pharmacology.",
    lessons: 66,
    questions: "860",
    topics: [
      "Systematic clinical assessment & high-performance team dynamics",
      "Recognition & management of acute arrhythmias & ECG analysis",
      "Defibrillation, synchronized cardioversion & transcutaneous pacing",
      "Cardiac arrest pharmacology & post-cardiac arrest care",
    ],
    status: "PUBLISHED",
  },
  {
    id: 221,
    department: "con",
    departmentName: "College of Nursing",
    departmentCode: "CON",
    programs: ["BSN"],
    title: "Health Care Services NC II",
    wordmark: "healthcare",
    tone: "fern",
    summary:
      "TESDA national certification in clinical patient care, vital signs monitoring, bedside assistance, infection control, and sterile protocol.",
    description:
      "TESDA national certification in clinical patient care, vital signs monitoring, bedside assistance, infection control, and sterile protocol.",
    lessons: 60,
    questions: "790",
    topics: [
      "Accurate vital signs monitoring & clinical charting",
      "Patient bed mobility, safe transfer techniques & positioning",
      "Clinical infection prevention & biomedical waste disposal",
      "Bedside personal care, bathing & comfort measures",
    ],
    status: "PUBLISHED",
  },
]

/**
 * Normalizes title for loose comparison (e.g. "IT Passport Exam" <-> "PhilNITS IT Passport").
 */
function normalizeTitle(str = "") {
  return String(str)
    .toLowerCase()
    .replace(/\bexam\b/g, "")
    .replace(/\bphilnits\b/g, "")
    .replace(/[^a-z0-9]/g, "")
}

/**
 * Detects department and programs for any arbitrary certification object.
 */
export function detectDepartment(cert) {
  const combined = `${cert.title || ""} ${cert.description || ""} ${cert.industry || ""}`.toLowerCase()

  if (
    combined.includes("topcit") ||
    combined.includes("passport") ||
    combined.includes("fe exam") ||
    combined.includes("software") ||
    combined.includes("programming") ||
    combined.includes("computer studies") ||
    combined.includes("ccs")
  ) {
    return {
      id: "ccs",
      name: "College of Computer Studies",
      code: "CCS",
      programs: ["BSIT", "BSCS"],
    }
  }

  if (
    combined.includes("ccna") ||
    combined.includes("cisco") ||
    combined.includes("electrical") ||
    combined.includes("mechatronics") ||
    combined.includes("machining") ||
    combined.includes("engineering") ||
    combined.includes("scaffold") ||
    combined.includes("plumbing") ||
    combined.includes("autocad")
  ) {
    return {
      id: "coe",
      name: "College of Engineering",
      code: "COE",
      programs: combined.includes("ccna") ? ["BSCpE", "BSECE"] : ["COE"],
    }
  }

  if (
    combined.includes("bookkeeper") ||
    combined.includes("tax") ||
    combined.includes("cost accountant") ||
    combined.includes("accounting") ||
    combined.includes("business") ||
    combined.includes("cba")
  ) {
    return {
      id: "cba",
      name: "College of Business Administration and Accountancy",
      code: "CBAA",
      programs: ["BSMA", "BSBA"],
    }
  }

  if (
    combined.includes("cookery") ||
    combined.includes("front office") ||
    combined.includes("housekeeping") ||
    combined.includes("bartending") ||
    combined.includes("food & beverage") ||
    combined.includes("hospitality") ||
    combined.includes("tourism") ||
    combined.includes("chtm")
  ) {
    return {
      id: "chtm",
      name: "College of Hospitality and Tourism Management",
      code: "CHTM",
      programs: ["BSHM", "AHRM"],
    }
  }

  if (
    combined.includes("maritime") ||
    combined.includes("basic training") ||
    combined.includes("ship security") ||
    combined.includes("watch") ||
    combined.includes("radar") ||
    combined.includes("stcw") ||
    combined.includes("cms")
  ) {
    return {
      id: "cms",
      name: "College of Maritime Studies",
      code: "CMS",
      programs: ["BSMT", "BSMarE"],
    }
  }

  if (
    combined.includes("nursing") ||
    combined.includes("bls") ||
    combined.includes("acls") ||
    combined.includes("life support") ||
    combined.includes("health care") ||
    combined.includes("con")
  ) {
    return {
      id: "con",
      name: "College of Nursing",
      code: "CON",
      programs: ["BSN"],
    }
  }

  return {
    id: "ccs",
    name: "College of Computer Studies",
    code: "CCS",
    programs: ["BSIT"],
  }
}

/**
 * The request page's list: every certification the backend has that is
 * published (requestable) or coming soon (shown, not requestable), each dressed
 * with its catalog entry's college, programs and balanced description.
 *
 * The backend decides what exists and whether it can be requested; the catalog
 * only adds presentation. Matched on the normalized title alone: the catalog's
 * own ids are placeholders that can collide with real database ids, and the
 * old partial-title match paired "FE Exam" ("fe") with any title containing
 * those letters ("lifesupport").
 */
export function getMergedCertifications(backendCertifications = []) {
  const listed = (Array.isArray(backendCertifications) ? backendCertifications : []).filter(
    (c) => c.status === "PUBLISHED" || c.status === "COMING_SOON"
  )

  const merged = listed.map((b) => {
    const catalogItem = CATALOG_CERTIFICATIONS.find(
      (item) => normalizeTitle(item.title) === normalizeTitle(b.title)
    )
    const dept = catalogItem
      ? {
          department: catalogItem.department,
          departmentName: catalogItem.departmentName,
          departmentCode: catalogItem.departmentCode,
          programs: catalogItem.programs,
        }
      : (() => {
          const detected = detectDepartment(b)
          return {
            department: detected.id,
            departmentName: detected.name,
            departmentCode: detected.code,
            programs: detected.programs,
          }
        })()
    return {
      ...(catalogItem ?? {}),
      ...dept,
      id: b.certificationId,
      certificationId: b.certificationId,
      backendId: b.certificationId,
      title: b.title,
      // The catalog's balanced description over an oversized database text block.
      description: catalogItem?.description || b.description || "",
      status: b.status,
      available: b.status === "PUBLISHED",
      isFromBackend: true,
    }
  })

  // College order, then what can be requested now, then by title.
  const deptOrder = CATALOG_DEPARTMENTS.map((d) => d.id)
  merged.sort((a, b) => {
    const aOrder = deptOrder.indexOf(a.department)
    const bOrder = deptOrder.indexOf(b.department)
    if (aOrder !== bOrder) return aOrder - bOrder
    if (a.available !== b.available) return a.available ? -1 : 1
    return a.title.localeCompare(b.title)
  })

  return merged
}
