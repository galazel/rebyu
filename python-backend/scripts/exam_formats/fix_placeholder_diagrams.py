"""Replaces six diagram questions' placeholder reference answers with complete ones.

A diagram answer is graded only by comparing it with the reference diagram, so a
reference that is two empty boxes ("Entity A", "Entity B") -- or entities with no
relationships, or participants with no messages -- marks almost anything as right.
These six were created on 2026-10-01 that way:

  23248, 23250, 23252  Blueprint Arena ERDs whose prompt only said "Draw an ERD for
                       a ... system". No single drawing is THE answer to that, so the
                       prompt now names the entities and attributes the model answer uses.
  23262                power-utility ERD: 7 entities, no relationships
  23263                fleet UML class diagram: classes, no relationships
  23264                payment sequence diagram: participants, no messages

The references are drawn the way the other 106 are -- a swimlane per entity/class
with one text row per attribute, labelled edges with cardinality, lifelines with
numbered messages -- so the grader reads them the same way.

Dry run by default; --apply writes.
"""

import os
import sys
from xml.sax.saxutils import quoteattr

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "fe_expansion"))

from sqlalchemy import text

from dbsession import open_session


def erd(title, entities, relationships, columns=3):
    """entities: [(name, [rows])]; relationships: [(source, target, label)]."""
    cells = ['<mxCell id="0"/>', '<mxCell id="1" parent="0"/>',
             '<mxCell id="title" value=%s style="text;html=1;fontSize=16;fontStyle=1;align=left;" vertex="1" '
             'parent="1"><mxGeometry x="40" y="20" width="700" height="30" as="geometry"/></mxCell>'
             % quoteattr(title + " (model answer)")]
    ids = {}
    for index, (name, rows) in enumerate(entities):
        node = "e%d" % index
        ids[name] = node
        x, y = 40 + (index % columns) * 290, 80 + (index // columns) * 230
        height = 26 + 16 * len(rows) + 6
        cells.append('<mxCell id="%s" value=%s style="swimlane;html=1;startSize=26;fontStyle=1;whiteSpace=wrap;" '
                     'vertex="1" parent="1"><mxGeometry x="%d" y="%d" width="230" height="%d" as="geometry"/>'
                     '</mxCell>' % (node, quoteattr(name), x, y, height))
        for row_index, row in enumerate(rows):
            cells.append('<mxCell id="%s_%d" value=%s style="text;html=1;strokeColor=none;fillColor=none;'
                         'align=left;verticalAlign=middle;spacingLeft=6;fontSize=11;" vertex="1" parent="%s">'
                         '<mxGeometry y="%d" width="230" height="16" as="geometry"/></mxCell>'
                         % (node, row_index, quoteattr(row), node, 26 + 16 * row_index))
    for index, (source, target, label) in enumerate(relationships):
        style = label[1] if isinstance(label, tuple) else "endArrow=open;html=1;"
        label = label[0] if isinstance(label, tuple) else label
        cells.append('<mxCell id="r%d" value=%s style="edgeStyle=orthogonalEdgeStyle;%s" edge="1" parent="1" '
                     'source="%s" target="%s"><mxGeometry relative="1" as="geometry"/></mxCell>'
                     % (index, quoteattr(label), style, ids[source], ids[target]))
    return "<mxGraphModel><root>%s</root></mxGraphModel>" % "".join(cells)


def sequence(title, participants, messages, fragment):
    """messages: [(source, target, label, is_return)]; fragment: (label, first, last) message numbers."""
    cells = ['<mxCell id="0"/>', '<mxCell id="1" parent="0"/>',
             '<mxCell id="title" value=%s style="text;html=1;fontSize=16;fontStyle=1;align=left;" vertex="1" '
             'parent="1"><mxGeometry x="40" y="20" width="700" height="30" as="geometry"/></mxCell>'
             % quoteattr(title + " (model answer)")]
    centre = {}
    for index, name in enumerate(participants):
        x = 40 + index * 170
        centre[name] = x + 70
        cells.append('<mxCell id="p%d" value=%s style="shape=umlLifeline;perimeter=lifelinePerimeter;'
                     'whiteSpace=wrap;html=1;container=1;collapsible=0;recursiveResize=0;outlineConnect=0;" '
                     'vertex="1" parent="1"><mxGeometry x="%d" y="80" width="140" height="%d" as="geometry"/>'
                     '</mxCell>' % (index, quoteattr(name), x, 140 + 45 * len(messages)))
    for index, (source, target, label, is_return) in enumerate(messages):
        y = 160 + 45 * index
        style = "endArrow=open;dashed=1;html=1;" if is_return else "endArrow=block;endFill=1;html=1;"
        cells.append('<mxCell id="m%d" value=%s style="%s" edge="1" parent="1"><mxGeometry relative="1" '
                     'as="geometry"><mxPoint x="%d" y="%d" as="sourcePoint"/><mxPoint x="%d" y="%d" '
                     'as="targetPoint"/></mxGeometry></mxCell>'
                     % (index, quoteattr("%d: %s" % (index + 1, label)), style,
                        centre[source], y, centre[target], y))
    label, first, last = fragment
    top = 160 + 45 * (first - 1) - 25
    cells.append('<mxCell id="frag" value=%s style="shape=umlFrame;whiteSpace=wrap;html=1;width=150;height=24;'
                 'align=left;verticalAlign=top;fillColor=none;" vertex="1" parent="1"><mxGeometry x="20" y="%d" '
                 'width="%d" height="%d" as="geometry"/></mxCell>'
                 % (quoteattr(label), top, 170 * len(participants) + 20, 45 * (last - first + 1) + 20))
    return "<mxGraphModel><root>%s</root></mxGraphModel>" % "".join(cells)


def listing(entities):
    return "; ".join("%s (%s)" % (name, ", ".join(rows)) for name, rows in entities)


ENROLMENT = [
    ("Student", ["PK studentId", "name", "email", "yearLevel"]),
    ("Course", ["PK courseCode", "FK instructorId", "title", "units"]),
    ("Instructor", ["PK instructorId", "name", "department"]),
    ("Enrollment", ["PK enrollmentId", "FK studentId", "FK courseCode", "semester", "grade"]),
]
LIBRARY = [
    ("Member", ["PK memberId", "name", "email", "joinDate"]),
    ("Book", ["PK isbn", "title", "author", "publishedYear"]),
    ("BookCopy", ["PK copyId", "FK isbn", "shelfLocation", "status"]),
    ("Loan", ["PK loanId", "FK memberId", "FK copyId", "loanDate", "dueDate", "returnDate"]),
]
SHOP = [
    ("Customer", ["PK customerId", "name", "email", "shippingAddress"]),
    ("Product", ["PK productId", "name", "price", "stockQty"]),
    ("CustomerOrder", ["PK orderId", "FK customerId", "orderDate", "status", "totalAmount"]),
    ("OrderItem", ["PK orderItemId", "FK orderId", "FK productId", "quantity", "unitPrice"]),
    ("Payment", ["PK paymentId", "FK orderId", "method", "amount", "paidAt"]),
]
UTILITY = [
    ("PowerPlant", ["PK plantId", "name", "capacityMW", "fuelType"]),
    ("TransmissionLine", ["PK lineId", "FK plantId", "FK substationId", "voltageKV", "maxLoadMW"]),
    ("Substation", ["PK substationId", "name", "location"]),
    ("ServiceZone", ["PK zoneId", "FK substationId", "zoneName", "region"]),
    ("CustomerAccount", ["PK accountId", "FK zoneId", "meterId", "customerName"]),
    ("MonthlyReading", ["PK readingId", "FK accountId", "billingPeriod", "kwhConsumed", "peakDemandKW"]),
    ("MaintenanceEvent", ["PK eventId", "FK lineId", "crewId", "scheduledDate", "completionStatus"]),
]
FLEET = [
    ("Vehicle", ["- registrationNo: String", "- type: VehicleType", "- currentMileage: int",
                 "+ needsMaintenance(): boolean"]),
    ("Driver", ["- driverId: String", "- name: String", "- licenceNo: String",
                "+ assignTo(vehicle: Vehicle): void"]),
    ("Route", ["- routeId: String", "- name: String", "+ totalDistanceKm(): double"]),
    ("Waypoint", ["- latitude: double", "- longitude: double", "- sequenceOrder: int",
                  "+ distanceTo(other: Waypoint): double"]),
    ("Trip", ["- tripId: String", "- departureTime: DateTime", "- arrivalTime: DateTime",
              "- cargoWeightKg: double", "+ durationHours(): double"]),
    ("FuelLog", ["- logDate: Date", "- litres: double", "- cost: double", "- odometerReading: int",
                 "+ costPerLitre(): double"]),
    ("MaintenanceAlert", ["- alertId: String", "- mileageThreshold: int", "- raisedOn: Date",
                          "+ acknowledge(): void"]),
]
COMPOSITION = "endArrow=none;startArrow=diamondThin;startFill=1;startSize=14;html=1;"
ASSOCIATION = "endArrow=open;html=1;"

QUESTIONS = {
    23248: {
        "type": "ERD",
        "text": ("[BP-1790804150394-N1] Draw an ERD for a student enrollment system with these entities "
                 "and attributes: " + listing(ENROLMENT) + ". An instructor teaches courses, a student "
                 "makes enrollments, and each enrollment is for one course. Show every relationship "
                 "with its cardinality."),
        "instructions": ("1. Draw the four entities with all their attributes.\n2. Mark primary keys (PK) "
                         "and foreign keys (FK).\n3. Connect them with labelled relationships showing "
                         "cardinality (e.g. 1..*)."),
        "xml": erd("Student Enrollment ERD", ENROLMENT, [
            ("Instructor", "Course", "teaches 1..*"),
            ("Student", "Enrollment", "makes 0..*"),
            ("Course", "Enrollment", "has 0..*"),
        ]),
    },
    23250: {
        "type": "ERD",
        "text": ("[BP-1790804150394-N2] Draw an ERD for a library management system with these entities "
                 "and attributes: " + listing(LIBRARY) + ". A book has physical copies, a member borrows "
                 "through loans, and each loan is for one copy. Show every relationship with its "
                 "cardinality."),
        "instructions": ("1. Draw the four entities with all their attributes.\n2. Mark primary keys (PK) "
                         "and foreign keys (FK).\n3. Connect them with labelled relationships showing "
                         "cardinality (e.g. 1..*)."),
        "xml": erd("Library Management ERD", LIBRARY, [
            ("Book", "BookCopy", "has 1..*"),
            ("Member", "Loan", "borrows 0..*"),
            ("BookCopy", "Loan", "is lent in 0..*"),
        ]),
    },
    23252: {
        "type": "ERD",
        "text": ("[BP-1790804150394-N3] Draw an ERD for an e-commerce platform with these entities and "
                 "attributes: " + listing(SHOP) + ". A customer places orders, an order contains order "
                 "items, each item is for one product, and an order is settled by a payment. Show every "
                 "relationship with its cardinality."),
        "instructions": ("1. Draw the five entities with all their attributes.\n2. Mark primary keys (PK) "
                         "and foreign keys (FK).\n3. Connect them with labelled relationships showing "
                         "cardinality (e.g. 1..*)."),
        "xml": erd("E-commerce ERD", SHOP, [
            ("Customer", "CustomerOrder", "places 0..*"),
            ("CustomerOrder", "OrderItem", "contains 1..*"),
            ("Product", "OrderItem", "appears in 0..*"),
            ("CustomerOrder", "Payment", "is settled by 0..1"),
        ]),
    },
    23262: {
        "type": "ERD",
        "xml": erd("Regional Power Utility ERD", UTILITY, [
            ("PowerPlant", "TransmissionLine", "feeds 1..*"),
            ("Substation", "TransmissionLine", "receives 1..*"),
            ("Substation", "ServiceZone", "serves 1..*"),
            ("ServiceZone", "CustomerAccount", "contains 1..*"),
            ("CustomerAccount", "MonthlyReading", "accumulates 0..* (identifying)"),
            ("TransmissionLine", "MaintenanceEvent", "has 0..*"),
        ], columns=4),
    },
    23263: {
        "type": "UML_CLASS",
        "xml": erd("Fleet Management Class Diagram", FLEET, [
            ("Route", "Waypoint", ("contains 1..*", COMPOSITION)),
            ("Driver", "Vehicle", ("drives 0..1", ASSOCIATION)),
            ("Vehicle", "Route", ("is assigned to 0..*", ASSOCIATION)),
            ("Trip", "Driver", ("driven by 1..1", ASSOCIATION)),
            ("Trip", "Vehicle", ("uses 1..1", ASSOCIATION)),
            ("Trip", "Route", ("follows 1..1", ASSOCIATION)),
            ("Vehicle", "FuelLog", ("records 0..*", ASSOCIATION)),
            ("Vehicle", "MaintenanceAlert", ("triggers 0..*", ASSOCIATION)),
        ], columns=4),
    },
    23264: {
        "type": "SEQUENCE_DIAGRAM",
        "xml": sequence(
            "Payment Gateway Transaction",
            ["Merchant", "PaymentGateway", "TokenService", "AcquiringBank", "CardNetwork", "IssuingBank",
             "AuditLog"],
            [
                ("Merchant", "PaymentGateway", "requestPayment(amount, cardToken)", False),
                ("PaymentGateway", "TokenService", "validateToken(cardToken)", False),
                ("TokenService", "PaymentGateway", "tokenValid", True),
                ("PaymentGateway", "AcquiringBank", "authorize(amount, card)", False),
                ("AcquiringBank", "CardNetwork", "forwardAuthorization(request)", False),
                ("CardNetwork", "IssuingBank", "checkFunds(card, amount)", False),
                ("IssuingBank", "CardNetwork", "approved / declined", True),
                ("CardNetwork", "AcquiringBank", "authorizationResponse", True),
                ("AcquiringBank", "PaymentGateway", "authorizationResponse", True),
                ("PaymentGateway", "AuditLog", "logTransaction(transactionId)", False),
                ("PaymentGateway", "Merchant", "paymentApproved", True),
                ("PaymentGateway", "Merchant", "paymentDeclined", True),
            ],
            ("alt [approved] / [declined]", 10, 12),
        ),
    },
}


def main():
    apply_changes = "--apply" in sys.argv
    db = open_session()
    for question_id, fix in QUESTIONS.items():
        current = db.execute(text("""
            select d.diagram_type, length(d.reference_diagram_xml) from public.diagram_question_configs d
             where d.question_id = :q"""), {"q": question_id}).fetchone()
        if current is None:
            print("%d: no diagram config, skipped" % question_id)
            continue
        if current[0] != fix["type"]:
            raise SystemExit("%d is a %s, expected %s" % (question_id, current[0], fix["type"]))
        print("%d %-17s reference %5d -> %5d chars%s" % (
            question_id, fix["type"], current[1] or 0, len(fix["xml"]),
            "  + prompt and instructions" if "text" in fix else ""))
        if not apply_changes:
            continue
        db.execute(text("""
            update public.diagram_question_configs
               set reference_diagram_xml = :x, reference_diagram_json = cast('{}' as jsonb)
             where question_id = :q"""), {"x": fix["xml"], "q": question_id})
        if "text" in fix:
            db.execute(text("update public.questions set question_text = :t where question_id = :q"),
                       {"t": fix["text"], "q": question_id})
            db.execute(text("update public.diagram_question_configs set instructions = :i where question_id = :q"),
                       {"i": fix["instructions"], "q": question_id})
    if apply_changes:
        db.commit()
        print("applied")
    else:
        if len(sys.argv) > 1 and sys.argv[1] == "--dump":
            os.makedirs(sys.argv[2], exist_ok=True)
            for question_id, fix in QUESTIONS.items():
                with open(os.path.join(sys.argv[2], "%d.%s.xml" % (question_id, fix["type"])), "w",
                          encoding="utf-8") as out:
                    out.write(fix["xml"])
            print("dumped to", sys.argv[2])
        print("dry run -- re-run with --apply")
    db.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
