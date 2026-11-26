"""REBYU Chen ERD generator — the important business transactions.

Writes rebyu-chen-erd.drawio / .svg / .png and two PDFs (see make_pdf.mjs).

SCOPE
  The 20 entities below are the tables written by the 14 multi-table business
  transactions catalogued in docs/rebyu-business-transactions.md, plus the two
  identity tables every one of them hangs off.  Read-only tables, single-table
  CRUD and admin configuration tables are out of scope on purpose.
  Every attribute shown was checked to be referenced in live application code,
  not merely declared on the entity.

NOTATION (Chen / Elmasri-Navathe, used consistently for every relationship)
  rectangle              entity type, filled by the role cluster that owns it
  thick dark border      entity shared by three or more role clusters
  diamond                relationship type
  ellipse                attribute; underlined = primary key
  1 / M / N by an entity that entity's cardinality in the relationship
  DOUBLE connecting line total (mandatory) participation
  SINGLE connecting line partial (optional) participation
  Foreign keys are deliberately NOT drawn as attributes: in Chen notation the
  foreign key IS the relationship line, so drawing both would state it twice.

Relationships and cardinalities follow the JPA entities under
backend-java/src/main/java/com/capstone/rebyu/**/entity/ (Flyway never runs in
this project, so the entities are the only schema authority).

Layout is computed, not hand-placed: entities sit on a cell grid, every other
shape goes in the corridors between cells, and connectors are routed by A* over
a lattice that treats every shape as an obstacle.  The run ends with a
verification pass that fails loudly if two shapes overlap or a connector crosses
a shape it does not belong to.
"""
import heapq
import html
import math
import pathlib
import sys

OUT = pathlib.Path(__file__).parent

# ---------------------------------------------------------------- geometry
# Authored at Times New Roman 22; every shape is sized from its wrapped text.
FS_E = FS_R = FS_A = FS_C = 22

CELL_W, CELL_H = 349, 308         # entity cell (entity box + one attribute each side)
# corridors must clear a diamond plus a routing lane on each side of it;
# GAP_W is then stretched so the whole canvas matches the printed page aspect
GAP_W, GAP_H = 350, 270
MARGIN = 50
EW, EH = 300, 124                 # entity rectangle (2 text lines + port room)
RW, RH = 206, 116                 # relationship diamond
AW, AH = 300, 78                  # attribute ellipse
NCOL, NROW = 6, 5

GRID = 20                         # routing lattice pitch
PAD_E, PAD_A, PAD_R = 16, 12, 14  # obstacle padding
DOUBLE = 5                        # half-separation of a total-participation line

# attributes sit straight above / below the box, so the box's left and right
# edges stay clear for connector ports
ATTR_DY = [-(EH / 2 + AH / 2 + 14), (EH / 2 + AH / 2 + 14)]
PORTS_H = [-46, -23, 0, 23, 46]   # port offsets down each side of a box

# ---------------------------------------------------------------- clusters
CLUSTERS = {
    "identity":   ("Shared identity (every transaction)",      "#dae8fc", "#4a6fa5"),
    "authority":  ("Institution / enterprise authority",       "#ffe6cc", "#b8730a"),
    "department": ("Department head",                          "#e1d5e7", "#8155a0"),
    "catalogue":  ("Admin: catalogue, bank & generation",      "#f8cecc", "#b23b36"),
    "learner":    ("Learner: purchase, assessment, rewards",   "#d5e8d4", "#5f9e58"),
}
SHARED_STROKE = "#1f2d3d"
# Chen weak-entity notation: an entity with no key of its own is drawn as a
# double rectangle, and the relationships that identify it as double diamonds.
WEAK = set()
IDENTIFYING = set()
INSET = 7                 # gap between the two outlines of a doubled shape
REL_FILL, REL_STROKE = "#f5f5f5", "#666666"
ATTR_FILL, ATTR_STROKE = "#fff2cc", "#c9a227"
WIRE = "#333333"
CARD_COLOR = "#b85450"

# name: (col, row, cluster, shared?, [(attribute, is_pk)], backing table)
# Attributes are the primary key plus the most-referenced live columns.
ENTITIES = {
    "USER_TYPE": (0, 0, "identity", False,
        [("user_type_id", 1), ("user_type_text", 0)], "user_types"),
    "USER": (1, 0, "identity", True,
        [("user_id", 1), ("email", 0)], "users"),
    "LEARNER": (2, 0, "identity", True,
        [("learner_id", 1), ("username", 0)], "learners"),
    "PARTNERSHIP_REQUEST": (3, 0, "authority", False,
        [("request_id", 1), ("reference_number", 0)], "partnership_requests"),
    "INSTITUTION_INVOICE": (4, 0, "authority", False,
        [("institution_invoice_id", 1), ("total_amount", 0)], "institution_invoices"),
    "INSTITUTION": (5, 0, "authority", True,
        [("institution_id", 1), ("institution_name", 0)], "institutions"),
    "DEPARTMENT_HEAD": (0, 1, "authority", False,
        [("department_head_id", 1), ("head_role", 0)], "department_heads"),
    "INSTITUTION_CERTIFICATE": (1, 1, "authority", False,
        [("institution_cert_id", 1), ("total_slots", 0)], "institution_certificates"),
    "INSTITUTION_CERT_LEARNER": (2, 1, "authority", False,
        [("institution_cert_learner_id", 1), ("progress_percentage", 0)], "institution_certification_learners"),
    "DEPARTMENT": (3, 1, "department", False,
        [("department_id", 1), ("department_name", 0)], "departments"),
    "DEPARTMENT_LEARNER": (4, 1, "department", False,
        [("department_learner_id", 1), ("role", 0)], "department_learners"),
    "STUDY_PLAN": (5, 1, "department", False,
        [("plan_id", 1), ("goal", 0)], "study_plan"),
    "TUTOR_SAFETY_ALERT": (0, 2, "department", False,
        [("safety_alert_id", 1), ("kind", 0)], "tutor_safety_alerts"),
    "AUDIT_LOG": (1, 2, "catalogue", False,
        [("log_id", 1), ("action", 0)], "audit_log"),
    "GENERATION_REQUEST": (2, 2, "catalogue", False,
        [("generation_request_id", 1), ("request_type", 0)], "generation_requests"),
    "CERTIFICATION": (3, 2, "catalogue", True,
        [("certification_id", 1), ("title", 0)], "certifications"),
    "MAJOR_CATEGORY": (4, 2, "catalogue", False,
        [("major_category_id", 1), ("title", 0)], "major_categories"),
    "MIDDLE_CATEGORY": (5, 2, "catalogue", False,
        [("middle_category_id", 1), ("title", 0)], "middle_categories"),
    "LESSON": (0, 3, "catalogue", True,
        [("lesson_id", 1), ("name", 0)], "lessons"),
    "QUESTION": (1, 3, "catalogue", False,
        [("question_id", 1), ("question_type", 0)], "questions"),
    "CHOICE": (2, 3, "catalogue", False,
        [("choice_id", 1), ("is_correct", 0)], "choices"),
    "EXAM": (3, 3, "catalogue", False,
        [("exam_id", 1), ("title", 0)], "exams"),
    "LEARNER_CERTIFICATION": (4, 3, "learner", False,
        [("learner_certification_id", 1), ("status", 0)], "learner_certifications"),
    "ASSESSMENT_ATTEMPT": (5, 3, "learner", False,
        [("assessment_attempt_id", 1), ("percentage", 0)], "assessment_attempts"),
    "ATTEMPT_ANSWER": (0, 4, "learner", False,
        [("attempt_answer_id", 1), ("is_correct", 0)], "assessment_attempt_answers"),
    "CERTIFICATE_AWARD": (1, 4, "learner", False,
        [("award_id", 1), ("certificate_number", 0)], "learner_certification_awards"),
    "LEARNER_MASTERY": (2, 4, "learner", False,
        [("learner_skill_state_id", 1), ("p_known", 0)], "learner_skill_states"),
    "AI_TUTOR_SESSION": (3, 4, "learner", False,
        [("session_id", 1), ("summary", 0)], "lesson_dialogue_sessions"),
}

# (label, entityA, cardA, totalA, entityB, cardB, totalB, [relationship attributes])
# cardX is printed beside entity X; totalX draws that side as a double line.
# The trailing comment names the transaction(s) from
# docs/rebyu-business-transactions.md that the relationship carries.
RELATIONSHIPS = [
    ("Has Role", "USER_TYPE", "1", False, "USER", "N", True, []),
    ("Has Profile", "USER", "1", False, "LEARNER", "1", True, []),
    ("Records", "USER", "1", False, "AUDIT_LOG", "N", False, []),
    ("Submits", "INSTITUTION", "1", False, "PARTNERSHIP_REQUEST", "N", False, []),
    ("Generates", "PARTNERSHIP_REQUEST", "1", False, "INSTITUTION_INVOICE", "N", False, []),
    ("Billed To", "INSTITUTION", "1", False, "INSTITUTION_INVOICE", "N", True, []),
    ("Employs", "INSTITUTION", "1", False, "DEPARTMENT_HEAD", "N", True, []),
    ("Acts As", "USER", "1", False, "DEPARTMENT_HEAD", "N", True, []),
    ("Purchases", "INSTITUTION", "1", False, "INSTITUTION_CERTIFICATE", "N", True, []),
    ("Grants Access", "CERTIFICATION", "1", False, "INSTITUTION_CERTIFICATE", "N", True, []),
    ("Seats", "INSTITUTION_CERTIFICATE", "1", False, "INSTITUTION_CERT_LEARNER", "N", True, []),
    ("Sponsored As", "LEARNER", "1", False, "INSTITUTION_CERT_LEARNER", "N", True, []),
    ("Has", "INSTITUTION", "1", False, "DEPARTMENT", "N", True, []),
    ("Groups", "DEPARTMENT", "1", False, "DEPARTMENT_LEARNER", "N", True, []),
    ("Placed As", "INSTITUTION_CERT_LEARNER", "1", False, "DEPARTMENT_LEARNER", "N", True, []),
    ("Plans", "LEARNER", "1", False, "STUDY_PLAN", "N", True, []),
    ("Raises", "LEARNER", "1", False, "TUTOR_SAFETY_ALERT", "N", True, []),
    ("Triggers", "USER", "1", False, "GENERATION_REQUEST", "N", False, []),
    ("Populates", "CERTIFICATION", "1", False, "GENERATION_REQUEST", "N", False, []),
    ("Contains", "CERTIFICATION", "1", False, "MAJOR_CATEGORY", "N", True, []),
    ("Contains ", "MAJOR_CATEGORY", "1", False, "MIDDLE_CATEGORY", "N", True, []),
    ("Contains  ", "MIDDLE_CATEGORY", "1", False, "LESSON", "N", True, []),
    ("Has ", "LESSON", "1", False, "QUESTION", "N", True, []),
    ("Offers", "QUESTION", "1", False, "CHOICE", "N", True, []),
    ("Covers", "CERTIFICATION", "1", False, "EXAM", "N", True, []),
    ("Includes", "EXAM", "M", False, "QUESTION", "N", False, [("points", 0)]),
    ("Enrols In", "LEARNER", "1", False, "LEARNER_CERTIFICATION", "N", True, []),
    ("Offered As", "CERTIFICATION", "1", False, "LEARNER_CERTIFICATION", "N", True, []),
    ("Takes", "LEARNER", "1", False, "ASSESSMENT_ATTEMPT", "N", True, []),
    ("Attempted In", "EXAM", "1", False, "ASSESSMENT_ATTEMPT", "N", True, []),
    ("Answers", "ASSESSMENT_ATTEMPT", "1", False, "ATTEMPT_ANSWER", "N", True, []),
    ("Earns", "LEARNER", "1", False, "CERTIFICATE_AWARD", "N", True, []),
    ("Certifies", "CERTIFICATION", "1", False, "CERTIFICATE_AWARD", "N", True, []),
    ("Qualifies", "ASSESSMENT_ATTEMPT", "1", False, "CERTIFICATE_AWARD", "1", False, []),
    ("Masters", "LEARNER", "1", False, "LEARNER_MASTERY", "N", True, []),
    ("Measured In", "LESSON", "1", False, "LEARNER_MASTERY", "N", True, []),
    ("Converses", "LEARNER", "1", False, "AI_TUTOR_SESSION", "N", True, []),
    ("Discusses", "LESSON", "1", False, "AI_TUTOR_SESSION", "N", True, []),
]


# ------------------------------------------------------- placement solver
# The (col, row) written against each entity above is only a starting guess.
# A relationship reads correctly only when its diamond sits *between* the two
# entities it joins, which needs those two entities to be neighbours on the
# grid.  So before drawing anything, permute the entities over the grid cells
# to minimise how far apart related entities sit.  Cost is the square of the
# cell distance, which makes one far pair far worse than several near ones.
def solve_placement(seed=20251120):
    import random
    names = list(ENTITIES)
    cells = [(c, r) for r in range(NROW) for c in range(NCOL)]
    if len(names) > len(cells):
        sys.exit(f"{len(names)} entities will not fit {NCOL}x{NROW} cells")
    pairs = [(names.index(a), names.index(b)) for _l, a, _ca, _ta, b, _cb, _tb, _r
             in RELATIONSHIPS]
    # keep each role cluster loosely together so the drawing still reads by role
    cl = [ENTITIES[n][2] for n in names]
    same = [(i, j) for i in range(len(names)) for j in range(i + 1, len(names))
            if cl[i] == cl[j]]

    def cost(pos):
        t = 0
        for i, j in pairs:
            d = abs(pos[i][0] - pos[j][0]) + abs(pos[i][1] - pos[j][1])
            # a diamond can only really sit between its entities at d <= 2, so
            # anything beyond that is penalised out of consideration
            t += d * d * 10 + (400 if d >= 3 else 0)
        for i, j in same:
            d = abs(pos[i][0] - pos[j][0]) + abs(pos[i][1] - pos[j][1])
            t += 3 * d
        return t

    rng = random.Random(seed)
    best, best_c = None, None
    for restart in range(260):
        pos = cells[:len(names)]
        if restart:
            pos = cells[:]
            rng.shuffle(pos)
            pos = pos[:len(names)]
        else:
            pos = [(ENTITIES[n][0], ENTITIES[n][1]) for n in names]
        free = [c for c in cells if c not in pos]
        cur = cost(pos)
        improved = True
        while improved:                      # steepest-descent on swaps + moves
            improved = False
            for i in range(len(pos)):
                for j in range(i + 1, len(pos)):
                    pos[i], pos[j] = pos[j], pos[i]
                    c2 = cost(pos)
                    if c2 < cur:
                        cur, improved = c2, True
                    else:
                        pos[i], pos[j] = pos[j], pos[i]
                for k in range(len(free)):
                    old = pos[i]
                    pos[i] = free[k]
                    c2 = cost(pos)
                    if c2 < cur:
                        cur, improved, free[k] = c2, True, old
                    else:
                        pos[i] = old
        if best_c is None or cur < best_c:
            best, best_c = list(pos), cur
    return {n: best[i] for i, n in enumerate(names)}, best_c


_PLACEMENT, _PLACEMENT_COST = solve_placement()
ENTITIES = {n: (_PLACEMENT[n][0], _PLACEMENT[n][1]) + v[2:]
            for n, v in ENTITIES.items()}


# ---------------------------------------------------------------- text fit
def wrap(label, max_chars):
    """Break a SNAKE_CASE label onto at most two balanced lines."""
    if len(label) <= max_chars or "_" not in label:
        return [label]
    best, score = None, None
    for m in range(len(label)):
        if label[m] != "_":
            continue
        a, b = label[:m + 1], label[m + 1:]
        s = max(len(a), len(b))
        if score is None or s < score:
            best, score = (a, b), s
    return list(best)


def text_w(lines, fs, per_char):
    return max(len(t) for t in lines) * per_char * fs
# ---------------------------------------------------------------- grid maths
# The printed page is landscape short bond with 1in margins: a 9.0 x 6.5in live
# area.  The corridors at the four outer edges only have to carry the occasional
# wire that wraps around the outside, so they are much thinner than the inner
# ones; then GAP_W is stretched until the canvas has the page's aspect, so the
# drawing fills the sheet edge to edge instead of being letterboxed.
PAGE_ASPECT = 9.0 / 6.5
OUTER_W = OUTER_H = 90

H = int(2 * MARGIN + 2 * OUTER_H + NROW * CELL_H + (NROW - 1) * GAP_H)
GAP_W = max(GAP_W, (H * PAGE_ASPECT - 2 * MARGIN - 2 * OUTER_W
                    - NCOL * CELL_W) / (NCOL - 1))
W = int(2 * MARGIN + 2 * OUTER_W + NCOL * CELL_W + (NCOL - 1) * GAP_W)

_x0 = [MARGIN + OUTER_W + c * (CELL_W + GAP_W) for c in range(NCOL)]
_y0 = [MARGIN + OUTER_H + r * (CELL_H + GAP_H) for r in range(NROW)]
CX = [x + CELL_W / 2 for x in _x0]
CY = [y + CELL_H / 2 for y in _y0]
# corridor centre lines: index 0 is the outer edge, NCOL/NROW the far outer edge
VX = ([MARGIN + OUTER_W / 2]
      + [_x0[c] - GAP_W / 2 for c in range(1, NCOL)]
      + [W - MARGIN - OUTER_W / 2])
HY = ([MARGIN + OUTER_H / 2]
      + [_y0[r] - GAP_H / 2 for r in range(1, NROW)]
      + [H - MARGIN - OUTER_H / 2])

ATTR_CHARS = 18          # wrap attribute labels at this many characters
ENT_CHARS = 17           # wrap entity names at this many characters
REL_CHARS = 8            # wrap relationship labels at this many characters


def attr_lines(label):
    return wrap(label, ATTR_CHARS)


def ent_lines(name):
    return wrap(name, ENT_CHARS)


def rel_lines(label):
    return wrap(label.strip().replace(" ", "_"), REL_CHARS)


def rel_text(label):
    return [t.replace("_", " ").strip() for t in rel_lines(label)]


class Box:
    """Axis-aligned obstacle with a kind, used for collision tests and routing."""

    def __init__(self, kind, key, cx, cy, w, h, pad):
        self.kind, self.key = kind, key
        self.cx, self.cy, self.w, self.h, self.pad = cx, cy, w, h, pad

    def rect(self, pad=0.0):
        return (self.cx - self.w / 2 - pad, self.cy - self.h / 2 - pad,
                self.cx + self.w / 2 + pad, self.cy + self.h / 2 + pad)


def overlaps(a, b, pad=0.0):
    ax0, ay0, ax1, ay1 = a.rect(pad)
    bx0, by0, bx1, by1 = b.rect(pad)
    return ax0 < bx1 and bx0 < ax1 and ay0 < by1 and by0 < ay1


def seg_hits_rect(p, q, rect):
    """Does axis-aligned segment p-q intersect the rectangle?"""
    x0, y0, x1, y1 = rect
    sx0, sx1 = sorted((p[0], q[0]))
    sy0, sy1 = sorted((p[1], q[1]))
    return sx0 < x1 and x0 < sx1 and sy0 < y1 and y0 < sy1


def build():
    boxes = []
    entity_box, attr_boxes = {}, []

    for name, (c, r, cluster, shared, attrs, table) in ENTITIES.items():
        x, y = CX[c], CY[r]
        b = Box("entity", name, x, y, EW, EH, PAD_E)
        entity_box[name] = b
        boxes.append(b)
        if len(attrs) > len(ATTR_DY):
            sys.exit(f"{name}: {len(attrs)} attributes, only {len(ATTR_DY)} slots")
        if len(ent_lines(name)) > 2 or len(ent_lines(name)[0]) > ENT_CHARS + 6:
            sys.exit(f"{name}: does not wrap onto two lines")
        for i, (an, pk) in enumerate(attrs):
            ab = Box("attr", (name, an), x, y + ATTR_DY[i], AW, AH, PAD_A)
            ab.label, ab.pk = an, pk
            attr_boxes.append(ab)
            boxes.append(ab)

    # ---- relationship diamonds, placed in corridors ----------------------
    rel_box, rel_attr_boxes = {}, []
    for idx, (label, a, ca, ta, bname, cb, tb, rattrs) in enumerate(RELATIONSHIPS):
        ac, ar = ENTITIES[a][0], ENTITIES[a][1]
        bc, br = ENTITIES[bname][0], ENTITIES[bname][1]
        # Seat the diamond as close as possible to the midpoint of the two
        # entities, so it reads as being *between* them.  Candidates are every
        # legal corridor position; they are tried in order of distance from
        # that midpoint, so a diamond only drifts when its first choice is taken.
        mx, my = (CX[ac] + CX[bc]) / 2, (CY[ar] + CY[br]) / 2
        seats = []
        for v in range(len(VX)):                 # down a vertical corridor
            for r in range(NROW):
                seats.append((VX[v], CY[r], "v"))
            for h in range(len(HY)):
                seats.append((VX[v], HY[h], "v"))
        for h in range(len(HY)):                 # along a horizontal corridor
            for c in range(NCOL):
                seats.append((CX[c], HY[h], "h"))
        seats.sort(key=lambda t: (t[0] - mx) ** 2 + (t[1] - my) ** 2)

        placed = None
        for bx, by, axis in seats:
            step = (RH + 40) if axis == "v" else (RW + 40)
            for k in range(0, 4):
                for sgn in ((0,) if k == 0 else (-1, 1)):
                    off = sgn * k * step
                    cx, cy = ((bx, by + off) if axis == "v" else (bx + off, by))
                    cand = Box("rel", idx, cx, cy, RW, RH, PAD_R)
                    if not (MARGIN < cx - RW / 2 and cx + RW / 2 < W - MARGIN
                            and MARGIN < cy - RH / 2 and cy + RH / 2 < H - MARGIN):
                        continue
                    if any(overlaps(cand, o, 6) for o in boxes):
                        continue
                    placed = cand
                    break
                if placed:
                    break
            if placed:
                break
        if not placed:
            sys.exit(f"no free corridor slot for relationship '{label.strip()}'")
        placed.label = label.strip()
        rel_box[idx] = placed
        boxes.append(placed)

        for j, (an, pk) in enumerate(rattrs):
            spot = None
            for dx, dy in [(0, -(RH / 2 + AH / 2 + 18)), (0, RH / 2 + AH / 2 + 18),
                           (-(RW / 2 + AW / 2 + 18), 0), (RW / 2 + AW / 2 + 18, 0)]:
                ab = Box("attr", (f"rel{idx}", an), placed.cx + dx,
                         placed.cy + dy + j * (AH + 16), AW, AH, PAD_A)
                if any(overlaps(ab, o, 6) for o in boxes):
                    continue
                spot = ab
                break
            if not spot:
                sys.exit(f"no room for relationship attribute {an} on '{label.strip()}'")
            spot.label, spot.pk, spot.owner = an, pk, placed
            rel_attr_boxes.append(spot)
            boxes.append(spot)

    # ---- shape-vs-shape verification -------------------------------------
    problems = []
    for i in range(len(boxes)):
        for j in range(i + 1, len(boxes)):
            if overlaps(boxes[i], boxes[j]):
                problems.append(f"shape overlap: {boxes[i].kind}{boxes[i].key} / "
                                f"{boxes[j].kind}{boxes[j].key}")

    # ---- routing lattice --------------------------------------------------
    nx, ny = W // GRID + 1, H // GRID + 1

    def blocked_mask(exclude):
        mask = bytearray(nx * ny)
        for b in boxes:
            if b in exclude:
                continue
            x0, y0, x1, y1 = b.rect(b.pad)
            for gx in range(max(0, math.ceil(x0 / GRID)),
                            min(nx - 1, math.floor(x1 / GRID)) + 1):
                for gy in range(max(0, math.ceil(y0 / GRID)),
                                min(ny - 1, math.floor(y1 / GRID)) + 1):
                    mask[gy * nx + gx] = 1
        for gx in range(nx):
            mask[gx] = mask[(ny - 1) * nx + gx] = 1
        for gy in range(ny):
            mask[gy * nx] = mask[gy * nx + nx - 1] = 1
        return mask

    # cheaper to travel in a corridor than across a cell interior
    cell_x = [(CX[c] - CELL_W / 2, CX[c] + CELL_W / 2) for c in range(NCOL)]
    cell_y = [(CY[r] - CELL_H / 2, CY[r] + CELL_H / 2) for r in range(NROW)]

    def in_cell(gx, gy):
        x, y = gx * GRID, gy * GRID
        return (any(a <= x <= b for a, b in cell_x) and any(a <= y <= b for a, b in cell_y))

    usage = {}

    def astar(mask, start, goal):
        sx, sy = start
        gx_, gy_ = goal
        openq = [(0.0, sx, sy, -1)]
        best = {(sx, sy, -1): 0.0}
        came = {}
        while openq:
            f, x, y, d = heapq.heappop(openq)
            if (x, y) == (gx_, gy_):
                path, cur = [], (x, y, d)
                while cur in came:
                    path.append((cur[0] * GRID, cur[1] * GRID))
                    cur = came[cur]
                path.append((sx * GRID, sy * GRID))
                return path[::-1]
            g = best[(x, y, d)]
            for nd, (dx, dy) in enumerate(((1, 0), (-1, 0), (0, 1), (0, -1))):
                ax, ay = x + dx, y + dy
                if not (0 <= ax < nx and 0 <= ay < ny) or mask[ay * nx + ax]:
                    continue
                cost = GRID
                if d != -1 and nd != d:
                    cost += 70
                if in_cell(ax, ay):
                    cost += 55
                key = (min((x, y), (ax, ay)), max((x, y), (ax, ay)))
                cost += 90 * usage.get(key, 0)
                ng = g + cost
                st = (ax, ay, nd)
                if ng < best.get(st, 1e18):
                    best[st] = ng
                    came[st] = (x, y, d)
                    heapq.heappush(openq, (ng + (abs(ax - gx_) + abs(ay - gy_)) * GRID,
                                           ax, ay, nd))
        return None

    def node_near(box):
        return (int(round(box.cx / GRID)), int(round(box.cy / GRID)))

    def clip_rect(path, box):
        """Drop the leading points inside box and land exactly on its border."""
        x0, y0, x1, y1 = box.rect()
        i = 0
        while i < len(path) and x0 <= path[i][0] <= x1 and y0 <= path[i][1] <= y1:
            i += 1
        if i == 0 or i >= len(path):
            return path
        px, py = path[i - 1]
        qx, qy = path[i]
        if px == qx:
            return [(px, y1 if qy > py else y0)] + path[i:]
        return [(x1 if qx > px else x0, py)] + path[i:]

    def clip_rhombus(path, box):
        """Land exactly on the diamond outline (approaching from outside)."""
        def inside(p):
            return (abs(p[0] - box.cx) / (box.w / 2) + abs(p[1] - box.cy) / (box.h / 2)) <= 1.0
        i = len(path) - 1
        while i >= 0 and inside(path[i]):
            i -= 1
        if i < 0 or i == len(path) - 1:
            return path
        px, py = path[i]
        qx, qy = path[i + 1]
        lo, hi = 0.0, 1.0
        for _ in range(40):
            mid = (lo + hi) / 2
            if inside((px + (qx - px) * mid, py + (qy - py) * mid)):
                hi = mid
            else:
                lo = mid
        return path[:i + 1] + [(px + (qx - px) * hi, py + (qy - py) * hi)]

    def simplify(path):
        out = [path[0]]
        for p in path[1:]:
            if len(out) >= 2:
                a, b = out[-2], out[-1]
                if (a[0] == b[0] == p[0]) or (a[1] == b[1] == p[1]):
                    out[-1] = p
                    continue
            out.append(p)
        return out

    # ---- spread each entity's connectors over distinct ports -------------
    pending = {}            # entity -> [(rel_idx, card, total)]
    for idx, (label, a, ca, ta, bname, cb, tb, _ra) in enumerate(RELATIONSHIPS):
        pending.setdefault(a, []).append((idx, ca, ta))
        pending.setdefault(bname, []).append((idx, cb, tb))

    ports = {}              # (entity, rel_idx) -> (exact point on the box, first node)
    for ent, items in pending.items():
        eb = entity_box[ent]
        # attributes stack directly above and below the box, so every connector
        # has to leave through the left or right edge
        sides = {"left": [], "right": []}
        for idx, _c, _t in items:
            sides["left" if rel_box[idx].cx < eb.cx else "right"].append(idx)
        for side in ("left", "right"):
            other = "right" if side == "left" else "left"
            if len(sides[side]) > len(PORTS_H):
                sides[side].sort(key=lambda i: abs(rel_box[i].cx - eb.cx))
                while len(sides[side]) > len(PORTS_H) and len(sides[other]) < len(PORTS_H):
                    sides[other].append(sides[side].pop(0))
            if len(sides[side]) > len(PORTS_H):
                sys.exit(f"{ent}: {len(sides[side])} connectors on the {side} edge, "
                         f"only {len(PORTS_H)} ports")
        for side in ("left", "right"):
            ids = sorted(sides[side], key=lambda i: rel_box[i].cy)
            n = len(ids)
            if not n:
                continue
            start = (len(PORTS_H) - n) // 2
            for k, idx in enumerate(ids):
                px = eb.cx + (-EW / 2 if side == "left" else EW / 2)
                py = eb.cy + PORTS_H[start + k]
                node = (int(round((px + (-GRID * 2 if side == "left" else GRID * 2)) / GRID)),
                        int(round(py / GRID)))
                ports[(ent, idx)] = ((px, py), node, "h")

    wires = []   # (polyline, total_participation, card, entity_box, rel_box)
    def span(i):
        _l, a_, _ca, _ta, b_, _cb, _tb, _r = RELATIONSHIPS[i]
        return (abs(entity_box[a_].cx - entity_box[b_].cx)
                + abs(entity_box[a_].cy - entity_box[b_].cy))

    order = sorted(range(len(RELATIONSHIPS)), key=span, reverse=True)
    routed = {}
    for idx in order:
        label, a, ca, ta, bname, cb, tb, _ra = RELATIONSHIPS[idx]
        rb = rel_box[idx]
        for ent, card, total in ((a, ca, ta), (bname, cb, tb)):
            eb = entity_box[ent]
            exact, node, axis = ports[(ent, idx)]
            mask = blocked_mask({rb})
            if mask[node[1] * nx + node[0]]:
                culprits = [f"{o.kind}{o.key}" for o in boxes
                            if o is not rb and seg_hits_rect(
                                (node[0] * GRID, node[1] * GRID),
                                (node[0] * GRID, node[1] * GRID), o.rect(o.pad))]
                sys.exit(f"blocked port for {ent} -- {label.strip()} at "
                         f"{(node[0]*GRID, node[1]*GRID)} axis={axis} "
                         f"entity at {(eb.cx, eb.cy)} rel at {(rb.cx, rb.cy)} "
                         f"blocked by {culprits}")
            path = astar(mask, node, node_near(rb))
            if path is None:
                sys.exit(f"no route for {ent} -- {label.strip()}")
            for p, q in zip(path, path[1:]):
                k = (min((p[0] // GRID, p[1] // GRID), (q[0] // GRID, q[1] // GRID)),
                     max((p[0] // GRID, p[1] // GRID), (q[0] // GRID, q[1] // GRID)))
                usage[k] = usage.get(k, 0) + 1
            # orthogonal stub from the exact port onto the first lattice node
            elbow = (exact[0], path[0][1]) if axis == "v" else (path[0][0], exact[1])
            path = simplify(clip_rhombus(simplify([exact, elbow] + path), rb))
            routed[(idx, ent, card, total)] = (path, total, card, eb, rb)
    for idx, (label, a, ca, ta, bname, cb, tb, _ra) in enumerate(RELATIONSHIPS):
        for ent, card, total in ((a, ca, ta), (bname, cb, tb)):
            wires.append(routed[(idx, ent, card, total)])

    # ---- wire verification: a wire may only touch its own two shapes ------
    for path, _t, _c, eb, rb in wires:
        for p, q in zip(path, path[1:]):
            for o in boxes:
                if o is eb or o is rb:
                    continue
                if seg_hits_rect(p, q, o.rect(2)):
                    problems.append(f"wire {eb.key} -> {rb.label} crosses "
                                    f"{o.kind}{o.key}")

    # ---- cardinality labels, greedily placed clear of everything ---------
    all_segments = [(p, q, e, r) for pth, _t, _c, e, r in wires
                    for p, q in zip(pth, pth[1:])]

    def at_arclength(path, t):
        """Point and unit direction t pixels along the polyline from its start."""
        for p, q in zip(path, path[1:]):
            ln = math.hypot(q[0] - p[0], q[1] - p[1])
            if t <= ln or (p, q) == (path[-2], path[-1]):
                k = min(t, ln) / max(ln, 1e-6)
                return ((p[0] + (q[0] - p[0]) * k, p[1] + (q[1] - p[1]) * k),
                        ((q[0] - p[0]) / max(ln, 1e-6), (q[1] - p[1]) / max(ln, 1e-6)))
            t -= ln
        return (path[-1], (1.0, 0.0))

    card_boxes, cards = [], []
    for path, total, card, eb, rb in wires:
        total_len = sum(math.hypot(q[0] - p[0], q[1] - p[1])
                        for p, q in zip(path, path[1:]))
        limit = max(170.0, total_len * 0.80)
        done = False
        # pass 1 keeps the digit clear of every shape, wire and other digit;
        # pass 2 drops the wire test, which is safe because the digits are drawn
        # with a white halo and so stay readable where one crosses a line
        for avoid_wires in (True, False):
            for along in range(30, int(limit) + 1, 10):
                (px, py), (ux, uy) = at_arclength(path, along)
                for off in (24, 32, 40, 50, 62, 74):
                    for side in (1, -1):
                        lx, ly = px - uy * side * off, py + ux * side * off
                        lb = Box("card", card, lx, ly, 32, 28, 4)
                        if any(overlaps(lb, o, 2) for o in boxes + card_boxes):
                            continue
                        if avoid_wires and any(
                                seg_hits_rect(p2, q2, lb.rect(2))
                                for p2, q2, e2, r2 in all_segments
                                if not (e2 is eb and r2 is rb)):
                            continue
                        card_boxes.append(lb)
                        cards.append((lx, ly, card))
                        done = True
                        break
                    if done:
                        break
                if done:
                    break
            if done:
                break
        if not done:
            problems.append(f"no clear spot for cardinality '{card}' on "
                            f"{eb.key} -> {rb.label}")
            (px, py), (ux, uy) = at_arclength(path, 46)
            cards.append((px - uy * 26, py + ux * 26, card))

    return (boxes, entity_box, attr_boxes, rel_box, rel_attr_boxes, wires,
            cards, problems)


def offset_polyline(path, d):
    """Two parallel copies of an orthogonal polyline, +-d apart (double line)."""
    out = []
    for sign in (1, -1):
        segs = []
        for p, q in zip(path, path[1:]):
            vx, vy = q[0] - p[0], q[1] - p[1]
            ln = max(math.hypot(vx, vy), 1e-6)
            ox, oy = -vy / ln * d * sign, vx / ln * d * sign
            segs.append(((p[0] + ox, p[1] + oy), (q[0] + ox, q[1] + oy)))
        pts = [segs[0][0]]
        for (p1, q1), (p2, q2) in zip(segs, segs[1:]):
            # orthogonal corner: the two offset segments meet at the shared axis pair
            cx = q1[0] if abs(q1[0] - p1[0]) < 1e-9 else p2[0]
            cy = q1[1] if abs(q1[1] - p1[1]) < 1e-9 else p2[1]
            pts.append((cx, cy))
        pts.append(segs[-1][1])
        out.append(pts)
    return out



def emit(boxes, entity_box, attr_boxes, rel_box, rel_attr_boxes, wires, cards):
    # relationship attributes draw exactly like entity attributes; their stem
    # runs to the diamond (ab.owner) instead of to an entity box
    attr_boxes = list(attr_boxes) + list(rel_attr_boxes)
    # ------------------------------------------------------------------ SVG
    s = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" '
         f'viewBox="0 0 {W} {H}" font-family="Times New Roman, Times, serif">',
         f'<rect width="{W}" height="{H}" fill="#ffffff"/>']

    def esc(t):
        return html.escape(str(t))

    # attribute stems
    for ab in attr_boxes:
        if hasattr(ab, "owner"):
            ox, oy = ab.owner.cx, ab.owner.cy
        else:
            ox, oy = entity_box[ab.key[0]].cx, entity_box[ab.key[0]].cy
        s.append(f'<line x1="{ox}" y1="{oy}" x2="{ab.cx}" y2="{ab.cy}" '
                 f'stroke="#8a8a8a" stroke-width="1.4"/>')
    # wires
    for path, total, _c, _e, _r in wires:
        if total:
            for pts in offset_polyline(path, DOUBLE):
                s.append('<polyline points="' + " ".join(f"{x:.1f},{y:.1f}" for x, y in pts)
                         + f'" fill="none" stroke="{WIRE}" stroke-width="1.8"/>')
        else:
            s.append('<polyline points="' + " ".join(f"{x:.1f},{y:.1f}" for x, y in path)
                     + f'" fill="none" stroke="{WIRE}" stroke-width="2.2"/>')
    # attributes
    def block(cx, cy, lines, fs, extra=""):
        """Vertically centred run of text lines."""
        top = cy - (len(lines) - 1) * fs * 0.58 + fs * 0.35
        return "".join(
            f'<text x="{cx}" y="{top + i*fs*1.16:.1f}" text-anchor="middle" '
            f'font-size="{fs}"{extra}>{esc(t)}</text>' for i, t in enumerate(lines))

    for ab in attr_boxes:
        deco = ' text-decoration="underline"' if ab.pk else ""
        s.append(f'<ellipse cx="{ab.cx}" cy="{ab.cy}" rx="{ab.w/2}" ry="{AH/2}" '
                 f'fill="{ATTR_FILL}" stroke="{ATTR_STROKE}" stroke-width="1.4"/>')
        s.append(block(ab.cx, ab.cy, attr_lines(ab.label), FS_A, deco))
    # diamonds
    for rb in rel_box.values():
        pts = [(rb.cx, rb.cy - RH / 2), (rb.cx + RW / 2, rb.cy),
               (rb.cx, rb.cy + RH / 2), (rb.cx - RW / 2, rb.cy)]
        s.append('<polygon points="' + " ".join(f"{x},{y}" for x, y in pts)
                 + f'" fill="{REL_FILL}" stroke="{REL_STROKE}" stroke-width="1.8"/>')
        if rb.label in IDENTIFYING:
            iw, ih = RW / 2 - INSET * 1.9, RH / 2 - INSET * 1.9
            ip = [(rb.cx, rb.cy - ih), (rb.cx + iw, rb.cy),
                  (rb.cx, rb.cy + ih), (rb.cx - iw, rb.cy)]
            s.append('<polygon points="' + " ".join(f"{x:.1f},{y:.1f}" for x, y in ip)
                     + f'" fill="none" stroke="{REL_STROKE}" stroke-width="1.8"/>')
        s.append(block(rb.cx, rb.cy, rel_text(rb.label), FS_R))
    # entities
    for name, (c, r, cluster, shared, attrs, table) in ENTITIES.items():
        eb = entity_box[name]
        fill, stroke = CLUSTERS[cluster][1], CLUSTERS[cluster][2]
        sw = 4.5 if shared else 2
        st = SHARED_STROKE if shared else stroke
        s.append(f'<rect x="{eb.cx-EW/2}" y="{eb.cy-EH/2}" width="{EW}" height="{EH}" '
                 f'fill="{fill}" stroke="{st}" stroke-width="{sw}"/>')
        if name in WEAK:
            s.append(f'<rect x="{eb.cx-EW/2+INSET}" y="{eb.cy-EH/2+INSET}" '
                     f'width="{EW-2*INSET}" height="{EH-2*INSET}" fill="none" '
                     f'stroke="{st}" stroke-width="{sw}"/>')
        s.append(block(eb.cx, eb.cy, ent_lines(name), FS_E, ' font-weight="bold"'))
    # cardinalities
    for lx, ly, card in cards:
        s.append(f'<text x="{lx}" y="{ly+7}" text-anchor="middle" font-size="{FS_C}" '
                 f'font-weight="bold" fill="{CARD_COLOR}" stroke="#ffffff" '
                 f'stroke-width="4" paint-order="stroke">{esc(card)}</text>')

    s.append("</svg>")
    (OUT / "rebyu-chen-erd.svg").write_text("\n".join(s), encoding="utf-8")

    # --------------------------------------------------------------- drawio
    cells, n = [], [1]

    def nid():
        n[0] += 1
        return f"n{n[0]}"

    def poly(pts, width):
        i = nid()
        mid = "".join(f'<mxPoint x="{x:.1f}" y="{y:.1f}"/>' for x, y in pts[1:-1])
        cells.append(
            f'<mxCell id="{i}" style="endArrow=none;html=1;rounded=0;edgeStyle=none;'
            f'strokeColor={WIRE};strokeWidth={width};" edge="1" parent="1">'
            f'<mxGeometry relative="1" as="geometry">'
            f'<mxPoint x="{pts[0][0]:.1f}" y="{pts[0][1]:.1f}" as="sourcePoint"/>'
            f'<mxPoint x="{pts[-1][0]:.1f}" y="{pts[-1][1]:.1f}" as="targetPoint"/>'
            f'<Array as="points">{mid}</Array></mxGeometry></mxCell>')

    for ab in attr_boxes:
        if hasattr(ab, "owner"):
            ox, oy = ab.owner.cx, ab.owner.cy
        else:
            ox, oy = entity_box[ab.key[0]].cx, entity_box[ab.key[0]].cy
        cells.append(
            f'<mxCell id="{nid()}" style="endArrow=none;html=1;rounded=0;'
            f'strokeColor=#8A8A8A;strokeWidth=1.4;" edge="1" parent="1">'
            f'<mxGeometry relative="1" as="geometry">'
            f'<mxPoint x="{ox}" y="{oy}" as="sourcePoint"/>'
            f'<mxPoint x="{ab.cx}" y="{ab.cy}" as="targetPoint"/></mxGeometry></mxCell>')
    for path, total, _c, _e, _r in wires:
        if total:
            for pts in offset_polyline(path, DOUBLE):
                poly(pts, 1.8)
        else:
            poly(path, 2.2)
    for ab in attr_boxes:
        lab = "&lt;br&gt;".join(attr_lines(ab.label))
        lab = f"&lt;u&gt;{lab}&lt;/u&gt;" if ab.pk else lab
        fs = FS_A
        cells.append(
            f'<mxCell id="{nid()}" value="{lab}" style="ellipse;whiteSpace=wrap;html=1;'
            f'fontFamily=Times New Roman;fontSize={fs};fillColor={ATTR_FILL};'
            f'strokeColor={ATTR_STROKE};strokeWidth=1.4;" vertex="1" parent="1">'
            f'<mxGeometry x="{ab.cx-ab.w/2}" y="{ab.cy-AH/2}" width="{ab.w}" height="{AH}" '
            f'as="geometry"/></mxCell>')
    for rb in rel_box.values():
        fs = FS_R
        cells.append(
            f'<mxCell id="{nid()}" value="{esc(rb.label)}" style="rhombus;whiteSpace=wrap;'
            f'html=1;fontFamily=Times New Roman;fontSize={fs};fillColor={REL_FILL};'
            f'strokeColor={REL_STROKE};strokeWidth=1.8;" vertex="1" parent="1">'
            f'<mxGeometry x="{rb.cx-RW/2}" y="{rb.cy-RH/2}" width="{RW}" height="{RH}" '
            f'as="geometry"/></mxCell>')
        if rb.label in IDENTIFYING:
            iw, ih = RW - INSET * 3.8, RH - INSET * 3.8
            cells.append(
                f'<mxCell id="{nid()}" value="" style="rhombus;html=1;fillColor=none;'
                f'strokeColor={REL_STROKE};strokeWidth=1.8;" vertex="1" parent="1">'
                f'<mxGeometry x="{rb.cx-iw/2:.1f}" y="{rb.cy-ih/2:.1f}" '
                f'width="{iw:.1f}" height="{ih:.1f}" as="geometry"/></mxCell>')
    for name, (c, r, cluster, shared, attrs, table) in ENTITIES.items():
        eb = entity_box[name]
        fill, stroke = CLUSTERS[cluster][1], CLUSTERS[cluster][2]
        sw = 4.5 if shared else 2
        st = SHARED_STROKE if shared else stroke
        fs = FS_E
        cells.append(
            f'<mxCell id="{nid()}" value="{"&lt;br&gt;".join(ent_lines(name))}" '
            f'style="rounded=0;whiteSpace=wrap;html=1;'
            f'fontStyle=1;fontFamily=Times New Roman;fontSize={fs};fillColor={fill};'
            f'strokeColor={st};strokeWidth={sw};" vertex="1" parent="1">'
            f'<mxGeometry x="{eb.cx-EW/2}" y="{eb.cy-EH/2}" width="{EW}" height="{EH}" '
            f'as="geometry"/></mxCell>')
        if name in WEAK:
            cells.append(
                f'<mxCell id="{nid()}" value="" style="rounded=0;html=1;fillColor=none;'
                f'strokeColor={st};strokeWidth={sw};" vertex="1" parent="1">'
                f'<mxGeometry x="{eb.cx-EW/2+INSET}" y="{eb.cy-EH/2+INSET}" '
                f'width="{EW-2*INSET}" height="{EH-2*INSET}" as="geometry"/></mxCell>')
    for lx, ly, card in cards:
        cells.append(
            f'<mxCell id="{nid()}" value="{esc(card)}" style="text;html=1;align=center;'
            f'verticalAlign=middle;fontStyle=1;fontFamily=Times New Roman;'
            f'fontSize={FS_C};fontColor={CARD_COLOR};labelBackgroundColor=#ffffff;"'
            f' vertex="1" parent="1">'
            f'<mxGeometry x="{lx-17:.1f}" y="{ly-15:.1f}" width="34" height="30" '
            f'as="geometry"/></mxCell>')

    doc = ('<mxfile host="app.diagrams.net"><diagram name="REBYU Chen ERD" '
           'id="rebyu-chen-erd">'
           f'<mxGraphModel dx="1600" dy="1000" grid="1" gridSize="10" page="1" '
           f'pageWidth="{W}" pageHeight="{H}" math="0" shadow="0"><root>'
           '<mxCell id="0"/><mxCell id="1" parent="0"/>' + "".join(cells)
           + '</root></mxGraphModel></diagram></mxfile>')
    (OUT / "rebyu-chen-erd.drawio").write_text(doc, encoding="utf-8")


def esc(t):
    return html.escape(str(t))


if __name__ == "__main__":
    (boxes, entity_box, attr_boxes, rel_box, rel_attr_boxes, wires, cards,
     problems) = build()
    emit(boxes, entity_box, attr_boxes, rel_box, rel_attr_boxes, wires, cards)
    print(f"canvas {W}x{H}  entities {len(ENTITIES)}  relationships {len(RELATIONSHIPS)}  "
          f"attributes {len(attr_boxes)}  wires {len(wires)}")
    by_cluster = {}
    for name, (c, r, cl, sh, a, t) in ENTITIES.items():
        by_cluster.setdefault(cl, []).append(name)
    for cl, names in by_cluster.items():
        print(f"  {cl:11s} {len(names):2d}  {', '.join(sorted(names))}")
    if problems:
        print(f"\n{len(problems)} LAYOUT PROBLEM(S):")
        for p in problems:
            print("  -", p)
        sys.exit(1)
    print("\nlayout verified: no shape overlaps, no wire crosses a foreign shape")
