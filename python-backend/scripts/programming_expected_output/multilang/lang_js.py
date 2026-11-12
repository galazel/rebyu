"""JavaScript versions (Judge0: Node.js 12 -- no ?? or ?. operators). Learner parts between //<< and //>> stub."""

QUESTIONS = {
    2264: dict(
        replace=[("Write a function in JavaScript that takes an object", "Write a function that takes an object")],
        rules="complete toCamelCaseKeys(data), where data is an object. Convert each key to camelCase: split the key on "
              "'_', lowercase the first part and capitalise the first letter of every later part; a key with no '_' "
              "just has its first letter lowercased. Leave out any key that is a single letter, except 'i' and 'j'. "
              "Return a new object with the keys in their original order; main prints \"<key>=<value>\" pairs.",
        ref='''function toCamelCaseKeys(data) {
  //<<
  const result = {};
  for (const key of Object.keys(data)) {
    if (key.length === 1 && key !== 'i' && key !== 'j') continue;
    const parts = key.split('_');
    let name = parts.length === 1 ? parts[0].charAt(0).toLowerCase() + parts[0].slice(1) : parts[0].toLowerCase();
    for (const part of parts.slice(1)) {
      name += part.charAt(0).toUpperCase() + part.slice(1);
    }
    result[name] = data[key];
  }
  return result;
  //>> return {};
}

function show(obj) {
  console.log(Object.keys(obj).map((k) => k + '=' + obj[k]).join(' '));
}

show(toCamelCaseKeys({ first_name: 'John', LastName: 'Doe', x: 5, i: 1, j: 2 }));
show(toCamelCaseKeys({ ORDER_total_amount: 99.5, Q: 'skip', shipping_address_line_1: 'Main St', id: 7 }));
'''),

    2316: dict(
        rules="complete processPayment(amount, card). amount must be a number greater than 0, otherwise return \"Error: "
              "Invalid amount\". card must have non-empty number, expiry and cvv; if any is missing or empty, return "
              "\"Error: Invalid card details\". Otherwise return \"Success\". Keep the validation, bank call and logging "
              "steps as private helper functions so callers only see processPayment.",
        ref='''function processPayment(amount, card) {
  //<<
  if (typeof amount !== 'number' || !(amount > 0)) return 'Error: Invalid amount';
  for (const field of ['number', 'expiry', 'cvv']) {
    if (!card || !card[field]) return 'Error: Invalid card details';
  }
  return 'Success';
  //>> return '';
}

const card = { number: '4111111111111111', expiry: '12/30', cvv: '123' };
console.log(processPayment(100, card));
console.log(processPayment(0, card));
console.log(processPayment(-5, card));
console.log(processPayment('40', card));
console.log(processPayment(40, { number: '4111111111111111', expiry: '', cvv: '123' }));
console.log(processPayment(40, { number: '4111111111111111', cvv: '123' }));
'''),

    2318: dict(
        rules="complete mapRequirementsToComponents(requirements), returning an object from each requirement to its "
              "component. Match keywords case-insensitively, checking in this order (the first match wins): 'auth' or "
              "'login' -> 'AuthModule'; 'payment' -> 'PaymentModule'; 'report' -> 'ReportModule'; 'user' -> "
              "'UserModule'; anything else -> 'GeneralModule'. main prints \"<requirement> -> <component>\".",
        ref='''function mapRequirementsToComponents(requirements) {
  //<<
  const rules = [[['auth', 'login'], 'AuthModule'], [['payment'], 'PaymentModule'],
                 [['report'], 'ReportModule'], [['user'], 'UserModule']];
  const mapping = {};
  for (const requirement of requirements) {
    const text = requirement.toLowerCase();
    let module = 'GeneralModule';
    for (const [words, name] of rules) {
      if (words.some((w) => text.includes(w))) { module = name; break; }
    }
    mapping[requirement] = module;
  }
  return mapping;
  //>> return {};
}

const mapping = mapRequirementsToComponents(['User authentication', 'Process payment', 'Generate report',
  'Admin login page', 'User profile page', 'Backup database', 'Payment report export']);
for (const requirement of Object.keys(mapping)) console.log(requirement + ' -> ' + mapping[requirement]);
'''),

    2891: dict(
        rules="complete safeUploads(fileNames). A file is safe when its extension (the text after the last '.', "
              "compared in lowercase) is pdf, docx or xlsx and its name does not contain '../'. Return the safe names "
              "in input order.",
        ref='''function safeUploads(fileNames) {
  //<<
  return fileNames.filter((name) => {
    const dot = name.lastIndexOf('.');
    const extension = dot < 0 ? '' : name.slice(dot + 1).toLowerCase();
    return ['pdf', 'docx', 'xlsx'].includes(extension) && !name.includes('../');
  });
  //>> return [];
}

const safe = safeUploads(['report.pdf', '../secrets.docx', 'invoice.xlsx', 'data.csv', 'notes../.pdf',
  'SCAN.PDF', 'archive.tar.docx', 'nodot', 'budget.xlsx.exe']);
console.log(safe.length + ' safe');
for (const name of safe) console.log(name);
'''),

    3093: dict(
        rules="complete technicalWordCounts(responses). Return one \"<vendorName>: <count>\" line per response, in input "
              "order, where count is the number of whitespace-separated words in technicalCapabilities (0 when it is "
              "missing or empty).",
        ref='''function technicalWordCounts(responses) {
  //<<
  return responses.map((r) => {
    const text = (r.technicalCapabilities || '').trim();
    return r.vendorName + ': ' + (text ? text.split(/\\s+/).length : 0);
  });
  //>> return [];
}

const lines = technicalWordCounts([
  { vendorName: 'AlphaTech', technicalCapabilities: 'Cloud hosting, 24/7 support.' },
  { vendorName: 'BetaSys', companyBackground: 'Established 2015.' },
  { vendorName: 'GammaIT', technicalCapabilities: '' },
  { vendorName: 'DeltaSoft', technicalCapabilities: '  ERP   integration  and data migration ' },
]);
for (const line of lines) console.log(line);
'''),

    3095: dict(
        rules="complete rfiTemplate(projectName) and return this text exactly (lines separated by '\\n'): \"Request for "
              "Information (RFI): <projectName>\", an empty line, \"Introduction\", \"This RFI is issued for the "
              "<projectName> project.\", and then for each of Company Background, Technical Capabilities, "
              "Implementation Experience and Support Offerings: an empty line, the section name, and \"[Provide details "
              "here]\".",
        ref='''function rfiTemplate(projectName) {
  //<<
  const lines = ['Request for Information (RFI): ' + projectName, '', 'Introduction',
    'This RFI is issued for the ' + projectName + ' project.'];
  for (const section of ['Company Background', 'Technical Capabilities', 'Implementation Experience',
    'Support Offerings']) {
    lines.push('', section, '[Provide details here]');
  }
  return lines.join('\\n');
  //>> return '';
}

console.log(rfiTemplate('Data Center Upgrade'));
'''),

    3159: dict(
        rules="complete rfiTemplateFor(companyName, projectName, fields) and return this text exactly (lines separated "
              "by '\\n'): \"RFI Template for <companyName> - Project: <projectName>\", an empty line, \"Please provide "
              "information for the following fields:\", then one line per field numbered from 1 as \"<n>. <field>: \" "
              "followed by 23 underscores.",
        ref='''function rfiTemplateFor(companyName, projectName, fields) {
  //<<
  const lines = ['RFI Template for ' + companyName + ' - Project: ' + projectName, '',
    'Please provide information for the following fields:'];
  fields.forEach((field, i) => lines.push((i + 1) + '. ' + field + ': ' + '_'.repeat(23)));
  return lines.join('\\n');
  //>> return '';
}

console.log(rfiTemplateFor('Acme Corp', 'ERP Upgrade', ['Vendor Experience', 'Technical Capabilities', 'Support Offerings']));
'''),

    3101: dict(
        rules="complete emphasisAreas(presentationType), returning the content areas as an array of lowercase strings "
              "in this order -- 'project': scope, timeline, resource needs, risks, expected outcomes; 'investment': "
              "problem, solution, market opportunity, business model, financials, return on investment; 'decision': "
              "background, options, analysis, recommendation, next steps. For any other type return the string "
              "\"Error: Invalid presentation type\".",
        ref='''function emphasisAreas(presentationType) {
  //<<
  const areas = {
    project: ['scope', 'timeline', 'resource needs', 'risks', 'expected outcomes'],
    investment: ['problem', 'solution', 'market opportunity', 'business model', 'financials', 'return on investment'],
    decision: ['background', 'options', 'analysis', 'recommendation', 'next steps'],
  };
  return Object.prototype.hasOwnProperty.call(areas, presentationType)
    ? areas[presentationType] : 'Error: Invalid presentation type';
  //>> return [];
}

for (const type of ['project', 'investment', 'decision', 'webinar', 'Project']) {
  const result = emphasisAreas(type);
  console.log(type + ': ' + (Array.isArray(result) ? result.join(', ') : result));
}
'''),

    3068: dict(
        rules="complete extractFunctionalRequirements(text). Return, in order, every line that starts with 'FR:' (at "
              "the very start of the line), with that prefix removed and surrounding spaces trimmed.",
        ref='''function extractFunctionalRequirements(text) {
  //<<
  return text.split('\\n').filter((line) => line.startsWith('FR:')).map((line) => line.slice(3).trim());
  //>> return [];
}

const found = extractFunctionalRequirements('FR: The system shall allow user login.\\nThe system shall log all activity.\\n'
  + 'FR:   The system shall support password reset.  \\n  FR: indented, not counted\\nNFR: Pages load in 2 seconds.\\n');
console.log(found.length + ' functional requirement(s)');
for (const fr of found) console.log('- ' + fr);
'''),

    2536: dict(
        rules="complete summarizeSpec(spec) and return a string of three lines: \"Entities: ...\", \"Operations: ...\" "
              "and \"Constraints: ...\", each listing that key's items joined by ', ', or \"not specified\" when the key "
              "is missing or its array is empty.",
        ref='''function summarizeSpec(spec) {
  //<<
  return [['entities', 'Entities'], ['operations', 'Operations'], ['constraints', 'Constraints']]
    .map(([key, title]) => {
      const items = spec[key] || [];
      return title + ': ' + (items.length ? items.join(', ') : 'not specified');
    })
    .join('\\n');
  //>> return '';
}

console.log(summarizeSpec({ entities: ['Customer', 'Order'], operations: ['create', 'delete'],
  constraints: ['Order ID unique'] }));
console.log(summarizeSpec({ entities: ['User'], operations: [] }));
'''),

    2557: dict(
        rules="complete cleanReadings(readings). Keep, in their original order, only the readings whose value is a "
              "finite number (not null, not a string, not a boolean, not NaN). Return the new array; main prints "
              "\"<timestamp>=<value>\" pairs.",
        ref='''function cleanReadings(readings) {
  //<<
  return readings.filter((r) => typeof r.value === 'number' && Number.isFinite(r.value));
  //>> return [];
}

function show(readings) {
  console.log(readings.length ? readings.map((r) => r.timestamp + '=' + r.value).join(' ') : '(none)');
}

show(cleanReadings([
  { timestamp: 1, value: 20.5 }, { timestamp: 2, value: null }, { timestamp: 3, value: '21' },
  { timestamp: 4, value: 19 }, { timestamp: 5, value: true }, { timestamp: 6, value: 0 },
  { timestamp: 7, value: NaN }, { timestamp: 8 },
]));
show(cleanReadings([{ timestamp: 1, value: null }]));
'''),

    23260: dict(
        rules="complete peak(sessions), where each session is [start, end) in seconds: active at time t when start <= t "
              "< end, so a session ending at t and one starting at t do not overlap. Return \"PEAK FIRST LAST\": PEAK is "
              "the maximum number of sessions active at the same time, FIRST the earliest second at which it is "
              "reached, and LAST the final second of the latest stretch during which it is held (the peak may be "
              "reached more than once). Expected complexity: O(n log n) with a sweep line.",
        ref='''// Deterministic generator used to build the input. Do not change it.
let state = 7n;
function next() {
  state = (state * 1103515245n + 12345n) % 2147483648n;
  return Number(state);
}

function peak(sessions) {
  //<<
  const events = [];
  for (const [start, end] of sessions) {
    events.push([start, 1]);
    events.push([end, -1]);
  }
  events.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  let current = 0;
  let best = 0;
  let first = -1;
  let last = -1;
  for (let i = 0; i < events.length; i++) {
    current += events[i][1];
    if (i + 1 < events.length && events[i + 1][0] === events[i][0]) continue;
    const until = i + 1 < events.length ? events[i + 1][0] - 1 : events[i][0];
    if (current > best) {
      best = current;
      first = events[i][0];
      last = until;
    } else if (current === best && current > 0) {
      last = until;
    }
  }
  return best + ' ' + first + ' ' + last;
  //>> return '';
}

const sessions = [];
for (let i = 0; i < 5000; i++) {
  const start = next() % 86000;
  sessions.push([start, start + 1 + (next() % 900)]);
}
console.log(peak(sessions));
'''),
}
