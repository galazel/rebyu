"""REBYU Chen ERD: writes rebyu-chen-erd.drawio and rebyu-chen-erd.svg from one layout.
Relationships and cardinalities follow the JPA entities / live schema foreign keys."""
import html, json, sys, pathlib

OUT = pathlib.Path(__file__).parent
EW, EH = 210, 50          # entity box
RW, RH = 150, 64          # relationship diamond
AW, AH = 150, 38          # attribute ellipse

# Columns / rows (centres)
A, B, C, D, E, F = 150, 600, 1050, 1500, 1950, 2400

entities = {
    "PARTNERSHIP_REQUEST": (A, 120), "INSTITUTION": (B, 120), "DEPARTMENT": (C, 120),
    "USER": (D, 120), "GENERATION_REQUEST": (F, 120), "STUDY_PLAN": (E, 270),
    "INSTITUTION_CERTIFICATE": (B, 400), "CERTIFICATION": (C, 400), "LEARNER": (D, 400),
    "MAJOR_CATEGORY": (B, 680), "MIDDLE_CATEGORY": (B, 960), "LESSON": (B, 1240),
    "CERTIFICATE_AWARD": (1290, 700), "EXAM": (C, 960), "ASSESSMENT_ATTEMPT": (E, 960),
    "QUESTION": (C, 1240), "CHOICE": (D, 1240),
    "AI_TUTOR_SESSION": (A, 1520), "LEARNER_MASTERY": (B, 1520),
}

# name, centre, [(entity, cardinality, [waypoints], optional exact start point)]
relationships = [
    ("Submits", (375, 120), [("INSTITUTION", "1"), ("PARTNERSHIP_REQUEST", "N")]),
    ("Has", (825, 120), [("INSTITUTION", "1"), ("DEPARTMENT", "N")]),
    ("Manages", (1275, 120), [("USER", "M"), ("DEPARTMENT", "N")]),
    ("Triggers", (1950, 120), [("USER", "1"), ("GENERATION_REQUEST", "N")]),
    ("Purchases", (B, 260), [("INSTITUTION", "1"), ("INSTITUTION_CERTIFICATE", "N")]),
    ("Has Profile", (D, 260), [("USER", "1"), ("LEARNER", "1")]),
    ("Plans", (1725, 335), [("LEARNER", "1", [], (1590, 375)), ("STUDY_PLAN", "N")]),
    ("Grants Access", (825, 400), [("INSTITUTION_CERTIFICATE", "N"), ("CERTIFICATION", "1")]),
    ("Enrolls In", (1275, 400), [("LEARNER", "M"), ("CERTIFICATION", "N")]),
    ("Sponsors", (1275, 290), [("INSTITUTION_CERTIFICATE", "M", [(640, 290)], (640, 375)),
                               ("LEARNER", "N", [(1440, 290)], (1440, 375))]),
    ("Contains", (825, 540), [("CERTIFICATION", "1", [], (990, 425)), ("MAJOR_CATEGORY", "N")]),
    ("Contains ", (B, 820), [("MAJOR_CATEGORY", "1"), ("MIDDLE_CATEGORY", "N")]),
    ("Contains  ", (B, 1100), [("MIDDLE_CATEGORY", "1"), ("LESSON", "N")]),
    ("Covers", (C, 680), [("CERTIFICATION", "1"), ("EXAM", "N")]),
    ("Certifies", (1165, 550), [("CERTIFICATION", "1", [], (1110, 425)), ("CERTIFICATE_AWARD", "N")]),
    ("Earns", (1400, 550), [("LEARNER", "1", [], (1450, 425)), ("CERTIFICATE_AWARD", "N")]),
    ("Takes", (1725, 680), [("LEARNER", "1", [], (1560, 425)), ("ASSESSMENT_ATTEMPT", "N")]),
    ("Qualifies", (1620, 830), [("ASSESSMENT_ATTEMPT", "1", [], (1880, 935)), ("CERTIFICATE_AWARD", "1", [], (1380, 725))]),
    ("Attempted In", (1500, 960), [("EXAM", "1"), ("ASSESSMENT_ATTEMPT", "N")]),
    ("Includes", (C, 1100), [("EXAM", "M"), ("QUESTION", "N")]),
    ("Has ", (825, 1240), [("LESSON", "1"), ("QUESTION", "N")]),
    ("Offers", (1275, 1240), [("QUESTION", "1"), ("CHOICE", "N")]),
    ("Measures", (B, 1380), [("LESSON", "1"), ("LEARNER_MASTERY", "N")]),
    ("Discusses", (375, 1380), [("LESSON", "1", [], (540, 1265)), ("AI_TUTOR_SESSION", "N")]),
    ("Masters", (1500, 1660), [("LEARNER", "1", [(2250, 390), (2250, 1660)], (1605, 390)),
                               ("LEARNER_MASTERY", "N", [(B, 1660)])]),
    ("Converses", (1200, 1720), [("LEARNER", "1", [(2310, 412), (2310, 1720)], (1605, 412)),
                                 ("AI_TUTOR_SESSION", "N", [(A, 1720)])]),
]

# attributes: entity -> list of (name, is_key, dx, dy)
attributes = {
    "PARTNERSHIP_REQUEST": [("request_id", 1, 0, -80), ("reference_number", 0, 0, 80), ("status", 0, 0, 125)],
    "INSTITUTION": [("institution_id", 1, -90, -80), ("institution_name", 0, 90, -80)],
    "DEPARTMENT": [("department_id", 1, -90, -80), ("department_name", 0, 90, -80)],
    "USER": [("user_id", 1, -90, -80), ("email", 0, 90, -80), ("account_status", 0, 200, 75)],
    "GENERATION_REQUEST": [("generation_request_id", 1, -90, -80), ("request_type", 0, 90, -80), ("status", 0, 0, 80)],
    "STUDY_PLAN": [("plan_id", 1, 220, -10), ("created_at", 0, 220, 35)],
    "INSTITUTION_CERTIFICATE": [("institution_cert_id", 1, -240, -45), ("total_slots", 0, -240, 0), ("access_expiry_date", 0, -240, 45)],
    "CERTIFICATION": [("certification_id", 1, -90, -62), ("title", 0, 80, -62)],
    "LEARNER": [("learner_id", 1, 180, 80), ("username", 0, 220, 125)],
    "MAJOR_CATEGORY": [("major_category_id", 1, -240, 0)],
    "MIDDLE_CATEGORY": [("middle_category_id", 1, -240, 0)],
    "LESSON": [("lesson_id", 1, -240, -45), ("name", 0, -240, 0)],
    "CERTIFICATE_AWARD": [("award_id", 1, -95, 85), ("certificate_number", 0, 75, 85), ("score_percentage", 0, -10, 130)],
    "EXAM": [("exam_id", 1, -235, -45), ("title", 0, -235, 0), ("passing_score", 0, -235, 45)],
    "ASSESSMENT_ATTEMPT": [("assessment_attempt_id", 1, -85, 85), ("theta_current", 0, 90, 85), ("status", 0, 0, 130)],
    "QUESTION": [("question_id", 1, -150, 90), ("question_type", 0, 10, 115), ("difficulty_level", 0, 165, 90)],
    "CHOICE": [("choice_id", 1, -85, 85), ("is_correct", 0, 85, 85)],
    "LEARNER_MASTERY": [("p_known", 0, 235, -20), ("evidence_count", 0, 235, 25)],
    "AI_TUTOR_SESSION": [("session_id", 1, 0, -95), ("transcript", 0, 175, 85), ("summary", 0, 195, 5)],
}

# Which table backs each entity (for the caption / notes).
TABLES = {"USER": "users", "LEARNER": "learners", "INSTITUTION": "institutions", "DEPARTMENT": "departments",
          "PARTNERSHIP_REQUEST": "partnership_requests", "INSTITUTION_CERTIFICATE": "institution_certificates",
          "CERTIFICATION": "certifications", "MAJOR_CATEGORY": "major_categories", "MIDDLE_CATEGORY": "middle_categories",
          "LESSON": "lessons", "QUESTION": "questions", "CHOICE": "choices", "EXAM": "exams",
          "ASSESSMENT_ATTEMPT": "assessment_attempts", "CERTIFICATE_AWARD": "learner_certification_awards",
          "LEARNER_MASTERY": "learner_skill_states", "AI_TUTOR_SESSION": "lesson_dialogue_sessions",
          "STUDY_PLAN": "study_plan", "GENERATION_REQUEST": "generation_requests"}

# ---- version 2: shift down 300 to make a top row for role entities, add 5 entities
SHIFT = 300
entities = {k: (x, y + SHIFT) for k, (x, y) in entities.items()}
_sh = lambda p: (p[0], p[1] + SHIFT)
_rels = []
for _n, _c, _ends in relationships:
    if _n == "Manages":          # now DEPARTMENT_HEAD manages DEPARTMENT (department_head_assignments)
        continue
    _ne = []
    for _e in _ends:
        _e = list(_e)
        if len(_e) > 2: _e[2] = [_sh(p) for p in _e[2]]
        if len(_e) > 3: _e[3] = _sh(_e[3])
        _ne.append(tuple(_e))
    _rels.append((_n, _sh(_c), _ne))
relationships = _rels
entities.update({
    "INSTITUTION_INVOICE": (A, 120), "DEPARTMENT_HEAD": (C, 120), "USER_TYPE": (D, 120),
    "AUDIT_LOG": (E, 120), "TUTOR_SAFETY_ALERT": (2100, 860),
})
relationships += [
    ("Generates", (A, 270), [("PARTNERSHIP_REQUEST", "1"), ("INSTITUTION_INVOICE", "N")]),
    ("Billed To", (375, 270), [("INSTITUTION", "1"), ("INSTITUTION_INVOICE", "N")]),
    ("Employs", (825, 270), [("INSTITUTION", "1"), ("DEPARTMENT_HEAD", "N")]),
    ("Manages", (C, 270), [("DEPARTMENT_HEAD", "M"), ("DEPARTMENT", "N")]),
    ("Acts As", (1275, 270), [("USER", "1"), ("DEPARTMENT_HEAD", "N")]),
    ("Has Role", (D, 270), [("USER_TYPE", "1"), ("USER", "N")]),
    ("Records", (1725, 270), [("USER", "1"), ("AUDIT_LOG", "N")]),
    ("Raises", (1850, 800), [("LEARNER", "1", [], (1600, 725)), ("TUTOR_SAFETY_ALERT", "N")]),
]
attributes.update({
    "PARTNERSHIP_REQUEST": [("request_id", 1, -75, 80), ("reference_number", 0, 80, 125), ("status", 0, -75, 170)],
    "INSTITUTION": [("institution_id", 1, -140, 80), ("institution_name", 0, 140, 85)],
    "DEPARTMENT": [("department_id", 1, -100, 85), ("department_name", 0, 100, 85)],
    "USER": [("user_id", 1, -120, 85), ("email", 0, 190, 50), ("account_status", 0, 220, 110)],
    "INSTITUTION_INVOICE": [("institution_invoice_id", 1, -60, -80), ("invoice_number", 0, 110, -80)],
    "DEPARTMENT_HEAD": [("department_head_id", 1, -120, -80), ("head_role", 0, 120, -80)],
    "USER_TYPE": [("user_type_id", 1, -120, -80), ("user_type_text", 0, 120, -80)],
    "AUDIT_LOG": [("log_id", 1, -110, -80), ("action", 0, 110, -80)],
    "TUTOR_SAFETY_ALERT": [("safety_alert_id", 1, -70, 85), ("kind", 0, 90, 85), ("status", 0, 10, 130)],
})
TABLES.update({"INSTITUTION_INVOICE": "institution_invoices", "DEPARTMENT_HEAD": "department_heads",
               "USER_TYPE": "user_types", "AUDIT_LOG": "audit_log", "TUTOR_SAFETY_ALERT": "tutor_safety_alerts"})


# ---- version 3: landscape and larger, readable shapes/text
SY, ADY = 0.80, 0.86
OLD_EW, OLD_EH = EW, EH
EW, EH = 240, 56
RW, RH = 165, 72
AW, AH = 185, 44
FS_E, FS_R, FS_A, FS_C = 17, 16, 15, 17
_y = lambda y: round(y * SY + 25)
_old_ent = dict(entities)
entities = {k: (x, _y(y)) for k, (x, y) in entities.items()}

def _pin(ent, p):
    ox, oy = _old_ent[ent]
    dx, dy = p[0] - ox, p[1] - oy
    if abs(dy) >= OLD_EH / 2 - 1: dy = (1 if dy > 0 else -1) * EH / 2
    else: dy = dy * EH / OLD_EH
    if abs(dx) >= OLD_EW / 2 - 1: dx = (1 if dx > 0 else -1) * EW / 2
    nx, ny = entities[ent]
    return (nx + dx, ny + dy)

_rels = []
for _n, (_cx, _cy), _ends in relationships:
    _ne = []
    for _e in _ends:
        _e = list(_e)
        if len(_e) > 2: _e[2] = [(px, _y(py)) for px, py in _e[2]]
        if len(_e) > 3: _e[3] = _pin(_e[0], _e[3])
        _ne.append(tuple(_e))
    _rels.append((_n, (_cx, _y(_cy)), _ne))
relationships = _rels
attributes = {k: [(n, key, dx * 1.12 if abs(dx) > 150 else dx * 1.05, dy * ADY) for n, key, dx, dy in v] for k, v in attributes.items()}

# learner attributes moved clear of Raises/Takes; Sponsors lane nudged right
attributes["LEARNER"] = [("learner_id", 1, 8, 90)]
relationships = [(n, c, [tuple(list(e[:3]) + [((1452, e[3][1]) if e[0] == "LEARNER" and n == "Sponsors" else e[3])]) if len(e) > 3 else
                         (tuple([e[0], e[1], [(1452, p[1]) if n == "Sponsors" and p[0] == 1440 else p for p in e[2]]]) if len(e) > 2 else e)
                         for e in ends]) for n, c, ends in relationships]
# shift right so nothing is clipped at the left edge
XOFF = 110
entities = {k: (x + XOFF, y) for k, (x, y) in entities.items()}
relationships = [(n, (c[0] + XOFF, c[1]), [tuple([e[0], e[1]] + ([[(p[0] + XOFF, p[1]) for p in e[2]]] if len(e) > 2 else []) +
                                          ([(e[3][0] + XOFF, e[3][1])] if len(e) > 3 else [])) for e in ends]) for n, c, ends in relationships]
ENTITY_FILL, REL_FILL, ATTR_FILL, KEY_FILL = "#dae8fc", "#d5e8d4", "#fff2cc", "#fff2cc"
STROKE = {"e": "#6c8ebf", "r": "#82b366", "a": "#d6b656"}


def edge_anchor(name, toward):
    x, y = entities[name]
    tx, ty = toward
    dx, dy = tx - x, ty - y
    if abs(dx) * EH > abs(dy) * EW:
        return (x + (EW / 2 if dx > 0 else -EW / 2), y + dy * (EW / 2) / abs(dx) if dx else y)
    return (x + dx * (EH / 2) / abs(dy) if dy else x, y + (EH / 2 if dy > 0 else -EH / 2))


# ------------------------------------------------------------------ SVG
W, H = 2830, max(y for _, y in entities.values()) + 230
svg = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}" font-family="Times New Roman, Times, serif">',
       f'<rect width="{W}" height="{H}" fill="white"/>']
lines, shapes, labels = [], [], []

for name, items in attributes.items():
    ex, ey = entities[name]
    for an, key, dx, dy in items:
        ax, ay = ex + dx, ey + dy
        lines.append(f'<line x1="{ex}" y1="{ey}" x2="{ax}" y2="{ay}" stroke="#555" stroke-width="1.2"/>')
        shapes.append(f'<ellipse cx="{ax}" cy="{ay}" rx="{AW/2}" ry="{AH/2}" fill="{ATTR_FILL}" stroke="{STROKE["a"]}" stroke-width="1.2"/>')
        deco = ' text-decoration="underline"' if key else ""
        shapes.append(f'<text x="{ax}" y="{ay+5}" text-anchor="middle" font-size="{FS_A}"{deco}>{html.escape(an)}</text>')

for rname, (rx, ry), ends in relationships:
    for end in ends:
        ent, card = end[0], end[1]
        way = end[2] if len(end) > 2 else []
        start = end[3] if len(end) > 3 else edge_anchor(ent, way[0] if way else (rx, ry))
        pts = [start] + way + [(rx, ry)]
        lines.append('<polyline points="' + " ".join(f"{px},{py}" for px, py in pts) +
                     '" fill="none" stroke="#333" stroke-width="1.6"/>')
        # cardinality near the entity end
        nx, ny = pts[1]
        sx, sy = start
        vx, vy = nx - sx, ny - sy
        ln = max((vx ** 2 + vy ** 2) ** 0.5, 1)
        lx, ly = sx + vx / ln * 22 + (-vy / ln) * 12, sy + vy / ln * 22 + (vx / ln) * 12
        labels.append(f'<text x="{lx}" y="{ly+6}" text-anchor="middle" font-size="{FS_C}" font-weight="bold" fill="#b85450">{card}</text>')
    pts = [(rx, ry - RH / 2), (rx + RW / 2, ry), (rx, ry + RH / 2), (rx - RW / 2, ry)]
    shapes.append('<polygon points="' + " ".join(f"{a},{b}" for a, b in pts) +
                  f'" fill="{REL_FILL}" stroke="{STROKE["r"]}" stroke-width="1.5"/>')
    shapes.append(f'<text x="{rx}" y="{ry+5}" text-anchor="middle" font-size="{FS_R}">{html.escape(rname.strip())}</text>')

for name, (x, y) in entities.items():
    shapes.append(f'<rect x="{x-EW/2}" y="{y-EH/2}" width="{EW}" height="{EH}" fill="{ENTITY_FILL}" stroke="{STROKE["e"]}" stroke-width="1.8"/>')
    shapes.append(f'<text x="{x}" y="{y+6}" text-anchor="middle" font-size="{FS_E}" font-weight="bold">{name}</text>')

svg += lines + shapes + labels + ["</svg>"]
(OUT / "rebyu-chen-erd.svg").write_text("\n".join(svg), encoding="utf-8")

# ------------------------------------------------------------------ draw.io
cells, nid = [], [2]


def new_id():
    nid[0] += 1
    return f"n{nid[0]}"


ent_id = {}
for name, (x, y) in entities.items():
    i = new_id(); ent_id[name] = i
    cells.append(f'<mxCell id="{i}" value="{name}" style="rounded=0;whiteSpace=wrap;html=1;fontStyle=1;fontFamily=Times New Roman;fontSize={FS_E};fillColor={ENTITY_FILL};strokeColor={STROKE["e"]};strokeWidth=2;" vertex="1" parent="1"><mxGeometry x="{x-EW/2}" y="{y-EH/2}" width="{EW}" height="{EH}" as="geometry"/></mxCell>')
for name, items in attributes.items():
    ex, ey = entities[name]
    for an, key, dx, dy in items:
        i = new_id()
        label = f"&lt;u&gt;{an}&lt;/u&gt;" if key else an
        cells.append(f'<mxCell id="{i}" value="{label}" style="ellipse;whiteSpace=wrap;html=1;fontFamily=Times New Roman;fontSize={FS_A};fillColor={ATTR_FILL};strokeColor={STROKE["a"]};" vertex="1" parent="1"><mxGeometry x="{ex+dx-AW/2}" y="{ey+dy-AH/2}" width="{AW}" height="{AH}" as="geometry"/></mxCell>')
        cells.append(f'<mxCell id="{new_id()}" style="endArrow=none;html=1;strokeColor=#555555;" edge="1" parent="1" source="{ent_id[name]}" target="{i}"><mxGeometry relative="1" as="geometry"/></mxCell>')
for rname, (rx, ry), ends in relationships:
    i = new_id()
    cells.append(f'<mxCell id="{i}" value="{html.escape(rname.strip())}" style="rhombus;whiteSpace=wrap;html=1;fontFamily=Times New Roman;fontSize={FS_R};fillColor={REL_FILL};strokeColor={STROKE["r"]};" vertex="1" parent="1"><mxGeometry x="{rx-RW/2}" y="{ry-RH/2}" width="{RW}" height="{RH}" as="geometry"/></mxCell>')
    for end in ends:
        ent, card = end[0], end[1]
        way = end[2] if len(end) > 2 else []
        pts = "".join(f'<mxPoint x="{px}" y="{py}"/>' for px, py in way)
        arr = f'<Array as="points">{pts}</Array>' if way else ""
        e = new_id()
        pin = ""
        if len(end) > 3:
            ex0, ey0 = entities[ent]; px0, py0 = end[3]
            pin = f"exitX={(px0-(ex0-EW/2))/EW:.3f};exitY={(py0-(ey0-EH/2))/EH:.3f};exitDx=0;exitDy=0;"
        cells.append(f'<mxCell id="{e}" value="" style="endArrow=none;html=1;rounded=0;strokeWidth=1.5;{pin}" edge="1" parent="1" source="{ent_id[ent]}" target="{i}"><mxGeometry relative="1" as="geometry">{arr}</mxGeometry></mxCell>')
        cells.append(f'<mxCell id="{new_id()}" value="{card}" style="edgeLabel;html=1;align=center;verticalAlign=middle;resizable=0;points=[];fontStyle=1;fontFamily=Times New Roman;fontSize={FS_C};fontColor=#B85450;labelBackgroundColor=none;" vertex="1" connectable="0" parent="{e}"><mxGeometry x="-0.8" relative="1" as="geometry"><mxPoint x="0" y="-12" as="offset"/></mxGeometry></mxCell>')

drawio = ('<mxfile host="app.diagrams.net"><diagram name="REBYU Chen ERD" id="rebyu-chen-erd">'
          f'<mxGraphModel dx="1600" dy="1000" grid="1" gridSize="10" page="1" pageWidth="{W}" pageHeight="{H}" math="0" shadow="0">'
          '<root><mxCell id="0"/><mxCell id="1" parent="0"/>' + "".join(cells) + '</root></mxGraphModel></diagram></mxfile>')
(OUT / "rebyu-chen-erd.drawio").write_text(drawio, encoding="utf-8")
print("entities", len(entities), "relationships", len(relationships))
