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
  // College of Marine Education (CME)
  "College of Marine Education": "CME",
  "College of Marine Education (CME)": "CME",
  CME: "CME",
  "College of Maritime Studies": "CME",
  "College of Maritime Studies (CMS)": "CME",
  CMS: "CME",

  // College of Engineering (COE)
  "College of Engineering": "COE",
  "College of Engineering (COE)": "COE",
  COE: "COE",

  // College of Business Administration (CBA)
  "College of Business Administration": "CBA",
  "College of Business Administration (CBA)": "CBA",
  CBA: "CBA",
  "College of Business Administration and Accountancy": "CBA",
  "College of Business Administration and Accountancy (CBAA)": "CBA",
  "College of Business Administration and Accountancy (CBA)": "CBA",
  CBAA: "CBA",

  // College of Computer Studies (CCS)
  "College of Computer Studies": "CCS",
  "College of Computer Studies (CCS)": "CCS",
  CCS: "CCS",

  // College of Criminal Justice (CCJ)
  "College of Criminal Justice": "CCJ",
  "College of Criminal Justice (CCJ)": "CCJ",
  CCJ: "CCJ",
  "College of Criminology": "CCJ",
  "College of Criminology (COC)": "CCJ",
  COC: "CCJ",

  // College of Nursing (CoN)
  "College of Nursing": "CoN",
  "College of Nursing (CoN)": "CoN",
  "College of Nursing (CON)": "CoN",
  CoN: "CoN",
  CON: "CoN",

  // College of Hospitality and Tourism Management (CHTM)
  "College of Hospitality and Tourism Management": "CHTM",
  "College of Hospitality and Tourism Management (CHTM)": "CHTM",
  CHTM: "CHTM",

  // College of Teacher Education (CTE)
  "College of Teacher Education": "CTE",
  "College of Teacher Education (CTE)": "CTE",
  CTE: "CTE",

  // College of Customs Administration (CCA)
  "College of Customs Administration": "CCA",
  "College of Customs Administration (CCA)": "CCA",
  CCA: "CCA",

  // Common related / legacy abbreviations
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
  // College of Marine Education
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

  // College of Engineering
  "College of Engineering":
    "Offers disciplines like Computer, Electronics and Communications, Electrical, Industrial, and Civil Engineering.",
  "College of Engineering (COE)":
    "Offers disciplines like Computer, Electronics and Communications, Electrical, Industrial, and Civil Engineering.",
  COE:
    "Offers disciplines like Computer, Electronics and Communications, Electrical, Industrial, and Civil Engineering.",

  // College of Business Administration
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

  // College of Computer Studies
  "College of Computer Studies":
    "Offers Information Technology and Computer Science.",
  "College of Computer Studies (CCS)":
    "Offers Information Technology and Computer Science.",
  CCS:
    "Offers Information Technology and Computer Science.",

  // College of Criminal Justice
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

  // College of Nursing
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

  // College of Hospitality and Tourism Management
  "College of Hospitality and Tourism Management":
    "Focuses on hospitality, culinary arts, and tourism.",
  "College of Hospitality and Tourism Management (CHTM)":
    "Focuses on hospitality, culinary arts, and tourism.",
  CHTM:
    "Focuses on hospitality, culinary arts, and tourism.",

  // College of Teacher Education
  "College of Teacher Education":
    "Prepares future elementary and secondary school educators.",
  "College of Teacher Education (CTE)":
    "Prepares future elementary and secondary school educators.",
  CTE:
    "Prepares future elementary and secondary school educators.",

  // College of Customs Administration
  "College of Customs Administration":
    "Specializes in customs brokerage and tariff laws.",
  "College of Customs Administration (CCA)":
    "Specializes in customs brokerage and tariff laws.",
  CCA:
    "Specializes in customs brokerage and tariff laws.",
}

/**
 * Returns the short abbreviation for a department name (e.g. "College of Computer Studies" -> "CCS").
 * If the name is already short or has parentheses (e.g. "CCS", "BSIT", "CpE", "College of Computer Studies (CCS)"),
 * it extracts or preserves the clean abbreviation.
 */
export function getDepartmentAbbreviation(name) {
  if (!name || typeof name !== "string") return name || ""
  const trimmed = name.trim()

  // 1. Direct dictionary match
  if (departmentAbbreviations[trimmed]) {
    return departmentAbbreviations[trimmed]
  }

  // 2. Extract abbreviation in parentheses if present, e.g. "College of Computer Studies (CCS)" -> "CCS"
  const parenMatch = trimmed.match(/\(([^)]+)\)$/)
  if (parenMatch && parenMatch[1].trim().length <= 6) {
    return parenMatch[1].trim()
  }

  // 3. Case-insensitive dictionary match
  const lower = trimmed.toLowerCase()
  for (const [key, abbr] of Object.entries(departmentAbbreviations)) {
    if (key.toLowerCase() === lower) {
      return abbr
    }
  }

  // 4. If name is already an abbreviation or short code (<= 6 chars, like "CCS", "BSIT", "CpE")
  if (trimmed.length <= 6) {
    return trimmed
  }

  // 5. Clean up "College of ..." to initials if matching pattern
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
