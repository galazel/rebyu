export const departments = [
  "College of Marine Education (CME)",
  "College of Engineering (COE)",
  "College of Business Administration (CBA)",
  "College of Computer Studies (CCS)",
  "College of Criminal Justice (CCJ)",
  "College of Nursing (CoN)",
  "College of Hospitality and Tourism Management (CHTM)",
  "College of Teacher Education (CTE)",
  "College of Customs Administration (CCA)",
]

export const departmentAbbreviations = {
  "College of Marine Education": "CME",
  "College of Marine Education (CME)": "CME",
  CME: "CME",
  "College of Maritime Studies": "CME",
  "College of Maritime Studies (CMS)": "CME",
  CMS: "CME",

  "College of Engineering": "COE",
  "College of Engineering (COE)": "COE",
  COE: "COE",

  "Computer Engineering": "CpE",
  "Computer Engineering (CpE)": "CpE",
  "Department of Computer Engineering": "CpE",
  CpE: "CpE",
  CPE: "CpE",

  "College of Business Administration": "CBA",
  "College of Business Administration (CBA)": "CBA",
  CBA: "CBA",
  "College of Business Administration and Accountancy": "CBA",
  "College of Business Administration and Accountancy (CBAA)": "CBA",
  "College of Business Administration and Accountancy (CBA)": "CBA",
  CBAA: "CBA",

  "College of Computer Studies": "CCS",
  "College of Computer Studies (CCS)": "CCS",
  CCS: "CCS",

  "College of Criminal Justice": "CCJ",
  "College of Criminal Justice (CCJ)": "CCJ",
  CCJ: "CCJ",
  "College of Criminology": "CCJ",
  "College of Criminology (COC)": "CCJ",
  COC: "CCJ",

  "College of Nursing": "CoN",
  "College of Nursing (CoN)": "CoN",
  "College of Nursing (CON)": "CoN",
  CoN: "CoN",
  CON: "CoN",

  "College of Hospitality and Tourism Management": "CHTM",
  "College of Hospitality and Tourism Management (CHTM)": "CHTM",
  CHTM: "CHTM",

  "College of Teacher Education": "CTE",
  "College of Teacher Education (CTE)": "CTE",
  CTE: "CTE",

  "College of Customs Administration": "CCA",
  "College of Customs Administration (CCA)": "CCA",
  CCA: "CCA",

  "College of Engineering and Architecture": "CEA",
  "College of Engineering and Architecture (CEA)": "CEA",
  CEA: "CEA",

  "College of Management, Business and Accountancy": "CMBA",
  "College of Management, Business and Accountancy (CMBA)": "CMBA",
  CMBA: "CMBA",

  "College of Nursing and Allied Health Sciences": "CNAHS",
  "College of Nursing and Allied Health Sciences (CNAHS)": "CNAHS",
  CNAHS: "CNAHS",
}

export const departmentDescriptions = {
  "College of Marine Education":
    "Offers programs in Marine Transportation and Marine Engineering.",
  "College of Marine Education (CME)":
    "Offers programs in Marine Transportation and Marine Engineering.",
  CME:
    "Offers programs in Marine Transportation and Marine Engineering.",
  "College of Maritime Studies":
    "Offers programs in Marine Transportation and Marine Engineering.",
  "College of Maritime Studies (CMS)":
    "Offers programs in Marine Transportation and Marine Engineering.",
  CMS:
    "Offers programs in Marine Transportation and Marine Engineering.",

  "College of Engineering":
    "Offers disciplines like Computer, Electronics and Communications, Electrical, Industrial, and Civil Engineering.",
  "College of Engineering (COE)":
    "Offers disciplines like Computer, Electronics and Communications, Electrical, Industrial, and Civil Engineering.",
  COE:
    "Offers disciplines like Computer, Electronics and Communications, Electrical, Industrial, and Civil Engineering.",

  "Computer Engineering":
    "Focuses on hardware-software integration, Cisco networking, embedded systems, and digital circuit design.",
  "Computer Engineering (CpE)":
    "Focuses on hardware-software integration, Cisco networking, embedded systems, and digital circuit design.",
  CpE:
    "Focuses on hardware-software integration, Cisco networking, embedded systems, and digital circuit design.",

  "College of Business Administration":
    "Covers business, management accounting, and accountancy courses.",
  "College of Business Administration (CBA)":
    "Covers business, management accounting, and accountancy courses.",
  CBA:
    "Covers business, management accounting, and accountancy courses.",
  "College of Business Administration and Accountancy":
    "Covers business, management accounting, and accountancy courses.",
  "College of Business Administration and Accountancy (CBAA)":
    "Covers business, management accounting, and accountancy courses.",
  "College of Business Administration and Accountancy (CBA)":
    "Covers business, management accounting, and accountancy courses.",
  CBAA:
    "Covers business, management accounting, and accountancy courses.",

  "College of Computer Studies":
    "Offers Information Technology and Computer Science.",
  "College of Computer Studies (CCS)":
    "Offers Information Technology and Computer Science.",
  CCS:
    "Offers Information Technology and Computer Science.",

  "College of Criminal Justice":
    "Trains students in criminal justice.",
  "College of Criminal Justice (CCJ)":
    "Trains students in criminal justice.",
  CCJ:
    "Trains students in criminal justice.",
  "College of Criminology":
    "Trains students in criminal justice.",
  "College of Criminology (COC)":
    "Trains students in criminal justice.",
  COC:
    "Trains students in criminal justice.",

  "College of Nursing":
    "Manages nursing education and medical-surgical training tracks.",
  "College of Nursing (CoN)":
    "Manages nursing education and medical-surgical training tracks.",
  "College of Nursing (CON)":
    "Manages nursing education and medical-surgical training tracks.",
  CoN:
    "Manages nursing education and medical-surgical training tracks.",
  CON:
    "Manages nursing education and medical-surgical training tracks.",

  "College of Hospitality and Tourism Management":
    "Focuses on hospitality, culinary arts, and tourism.",
  "College of Hospitality and Tourism Management (CHTM)":
    "Focuses on hospitality, culinary arts, and tourism.",
  CHTM:
    "Focuses on hospitality, culinary arts, and tourism.",

  "College of Teacher Education":
    "Prepares future elementary and secondary school educators.",
  "College of Teacher Education (CTE)":
    "Prepares future elementary and secondary school educators.",
  CTE:
    "Prepares future elementary and secondary school educators.",

  "College of Customs Administration":
    "Specializes in customs brokerage and tariff laws.",
  "College of Customs Administration (CCA)":
    "Specializes in customs brokerage and tariff laws.",
  CCA:
    "Specializes in customs brokerage and tariff laws.",
}

export function getDepartmentAbbreviation(name) {
  if (!name || typeof name !== "string") return name || ""
  const trimmed = name.trim()

  if (departmentAbbreviations[trimmed]) {
    return departmentAbbreviations[trimmed]
  }

  const parenMatch = trimmed.match(/\(([^)]+)\)$/)
  if (parenMatch && parenMatch[1].trim().length <= 6) {
    return parenMatch[1].trim()
  }

  const lower = trimmed.toLowerCase()
  for (const [key, abbr] of Object.entries(departmentAbbreviations)) {
    if (key.toLowerCase() === lower) {
      return abbr
    }
  }

  if (trimmed.length <= 6) {
    return trimmed
  }

  const words = trimmed
    .split(/\s+/)
    .filter((w) => !["of", "and", "in", "the", "for", "&"].includes(w.toLowerCase()))
  if (words.length >= 2 && words.length <= 5) {
    const acronym = words.map((w) => w[0]?.toUpperCase()).join("")
    if (acronym.length >= 2 && acronym.length <= 5) {
      return acronym
    }
  }

  return trimmed
}

export const departmentEarthColors = {
  CME: "#2f6b4f",
  COE: "#5c6b73",
  CpE: "#2563eb",
  CBA: "#c9962b",
  CCS: "#4a7c59",
  CCJ: "#8b5f7d",
  CoN: "#606c38",
  CHTM: "#b06d3b",
  CTE: "#c8553d",
  CCA: "#bc4749",
}

export const departmentInfographicColors = departmentEarthColors

export const EARTH_TONE_FALLBACKS = [
  "#2f6b4f",
  "#c8553d",
  "#c9962b",
  "#8b5f7d",
  "#4a7c59",
  "#b06d3b",
  "#5c6b73",
  "#bc4749",
  "#606c38",
  "#b08968",
]

export const VIBRANT_INFOGRAPHIC_FALLBACKS = EARTH_TONE_FALLBACKS

export function getDepartmentColor(name = "", fallbackIndex = 0) {
  const abbr = getDepartmentAbbreviation(name)
  if (abbr && departmentEarthColors[abbr]) {
    return departmentEarthColors[abbr]
  }
  return EARTH_TONE_FALLBACKS[
    Math.abs(fallbackIndex) % EARTH_TONE_FALLBACKS.length
  ]
}
