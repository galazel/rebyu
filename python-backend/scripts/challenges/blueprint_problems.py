"""Blueprint Arena problem set: professional modelling tasks with drawn model answers.

Each new problem carries a `DiagramSpec`, rendered to draw.io XML by the same code
generation uses, and checked with `check_reference` before it is stored. Blueprint
answers are graded against that reference, so it has to be right.

The three problems already in the arena (an ERD, a class diagram and a sequence
diagram) stay; they only gain explanations (see EXISTING).
"""
from __future__ import annotations

from app.domain.diagrams.spec import DiagramEdge as E, DiagramNode as N, DiagramSpec
from app.domain.diagrams.validation import check_reference

EXISTING = {
    23262: ("Each entity gets a surrogate primary key, and every one-to-many relationship is carried by "
            "a foreign key on the many side: TransmissionLine holds FK plantId and FK substationId "
            "(a plant reaches many substations through many lines), ServiceZone holds FK substationId, "
            "CustomerAccount holds FK zoneId, MonthlyReading holds FK accountId, and MaintenanceEvent holds "
            "FK lineId. TransmissionLine is the associative entity that resolves the many-to-many link "
            "between PowerPlant and Substation.",
            "Drawing PowerPlant and Substation as a direct many-to-many relationship instead of resolving "
            "it through TransmissionLine, or putting the foreign key on the 'one' side of a relationship."),
    23263: ("Route is composed of Waypoints (filled diamond on Route; a waypoint cannot exist without its "
            "route, multiplicity 1 to 2..*). Driver-Vehicle is a plain association (0..1 to 0..1, because "
            "drivers are reassigned). Trip associates one Driver, one Vehicle and one Route. FuelLog and "
            "MaintenanceAlert each belong to one Vehicle (1 to 0..*). Methods sit with the data they use, "
            "e.g. Vehicle.updateMileage() raising MaintenanceAlert.",
            "Using composition between Driver and Vehicle (each exists independently), or modelling "
            "Waypoint as a plain association, which loses the fact that waypoints die with their route."),
    23264: ("Messages flow left to right in the order given: Merchant -> PaymentGateway -> TokenService, "
            "then PaymentGateway -> AcquiringBank -> CardNetwork -> IssuingBank, with the response returning "
            "along the same chain. An alt fragment splits the approved and declined outcomes, and only the "
            "approved branch contains PaymentGateway -> AuditLog. A failed token validation ends the "
            "interaction early.",
            "Letting the PaymentGateway call the IssuingBank directly (the card network sits between "
            "acquirer and issuer), or logging to the AuditLog outside the alt fragment, which audits "
            "declined payments as if approved."),
}

NEW = [
    # ------------------------------------------------------------ node 1
    dict(
        node=1, diagram_type="FLOWCHART",
        question=(
            "A card issuer's authorisation service decides every card payment in real time:\n"
            "(a) If the card is blocked or expired, decline immediately.\n"
            "(b) If the amount exceeds the available credit, decline.\n"
            "(c) The fraud engine returns a score from 0 to 100. Above 85, decline. From 60 to 85, send the "
            "payment to manual review and stop.\n"
            "(d) If the amount is over 50,000, require a one-time password (OTP). The cardholder gets up to "
            "3 attempts; after the third wrong OTP, decline and block the card.\n"
            "(e) Otherwise approve, place a hold on the amount, and end.\n\n"
            "Draw the flowchart of this decision process."),
        instructions=(
            "1. One start and one end terminator (several end paths may meet one end).\n"
            "2. Every condition in (a)-(d) is a decision diamond with labelled [yes]/[no] branches.\n"
            "3. The OTP retry must be a loop with an attempt counter, not three copies of the same step.\n"
            "4. 'Block card' happens only after the third failed OTP."),
        spec=DiagramSpec(title="Card authorisation decision flow", nodes=[
            N(key="start", label="Payment request", shape="start"),
            N(key="d_card", label="Card blocked or expired?", shape="decision"),
            N(key="d_credit", label="Amount > available credit?", shape="decision"),
            N(key="score", label="Get fraud score", shape="action"),
            N(key="d_fraud_hi", label="Score > 85?", shape="decision"),
            N(key="d_fraud_mid", label="Score >= 60?", shape="decision"),
            N(key="review", label="Send to manual review", shape="action"),
            N(key="d_big", label="Amount > 50,000?", shape="decision"),
            N(key="init", label="attempts = 0", shape="action"),
            N(key="otp", label="Request OTP; attempts += 1", shape="action"),
            N(key="d_otp", label="OTP correct?", shape="decision"),
            N(key="d_tries", label="attempts < 3?", shape="decision"),
            N(key="block", label="Block card", shape="action"),
            N(key="decline", label="Decline", shape="action"),
            N(key="approve", label="Approve and place hold", shape="action"),
            N(key="end", label="End", shape="end"),
        ], edges=[
            E(source="start", target="d_card"),
            E(source="d_card", target="decline", label="[yes]"),
            E(source="d_card", target="d_credit", label="[no]"),
            E(source="d_credit", target="decline", label="[yes]"),
            E(source="d_credit", target="score", label="[no]"),
            E(source="score", target="d_fraud_hi"),
            E(source="d_fraud_hi", target="decline", label="[yes]"),
            E(source="d_fraud_hi", target="d_fraud_mid", label="[no]"),
            E(source="d_fraud_mid", target="review", label="[yes]"),
            E(source="d_fraud_mid", target="d_big", label="[no]"),
            E(source="review", target="end"),
            E(source="d_big", target="init", label="[yes]"),
            E(source="d_big", target="approve", label="[no]"),
            E(source="init", target="otp"),
            E(source="otp", target="d_otp"),
            E(source="d_otp", target="approve", label="[yes]"),
            E(source="d_otp", target="d_tries", label="[no]"),
            E(source="d_tries", target="otp", label="[yes]"),
            E(source="d_tries", target="block", label="[no]"),
            E(source="block", target="decline"),
            E(source="decline", target="end"),
            E(source="approve", target="end"),
        ]),
        explanation=(
            "Each rule becomes a decision diamond in the order the rules are applied: card status, credit, "
            "fraud score (two thresholds, so two decisions), then amount. The OTP step is a loop: initialise "
            "a counter, request the OTP and increment, and on a wrong OTP loop back while attempts < 3. Only "
            "the exit after the third failure blocks the card before declining. Every outcome reaches the "
            "same end terminator."),
        mistake=(
            "Drawing the OTP retries as three separate steps, or blocking the card on the first wrong OTP. "
            "Both ignore the attempt limit, and the first makes the flow impossible to change if the limit "
            "changes."),
    ),
    dict(
        node=1, diagram_type="USE_CASE",
        question=(
            "A hospital is replacing its electronic health record (EHR) system.\n"
            "- Doctors view patient records, write prescriptions and order lab tests.\n"
            "- Writing a prescription ALWAYS runs a drug-interaction check.\n"
            "- Nurses view patient records and record vital signs.\n"
            "- Pharmacists dispense prescribed medication. When a drug is out of stock, dispensing may be "
            "extended with 'Substitute equivalent drug'.\n"
            "- Patients view their own results through a portal; every portal access requires "
            "authentication.\n"
            "- An external Insurance System verifies coverage whenever a lab test is ordered.\n"
            "- Doctors and Nurses are both Clinical Staff, who share 'View patient record'.\n\n"
            "Draw the use case diagram."),
        instructions=(
            "1. Put a system boundary around the EHR use cases; actors stay outside it.\n"
            "2. Use «include» for steps that always happen and «extend» for optional ones (the arrow points "
            "from the extension to the base use case).\n"
            "3. Show the external Insurance System as an actor.\n"
            "4. Use actor generalisation for Clinical Staff."),
        spec=DiagramSpec(title="Hospital EHR - use cases", nodes=[
            N(key="sys", label="EHR System", shape="boundary"),
            N(key="staff", label="Clinical Staff", shape="actor"),
            N(key="doctor", label="Doctor", shape="actor"),
            N(key="nurse", label="Nurse", shape="actor"),
            N(key="pharm", label="Pharmacist", shape="actor"),
            N(key="patient", label="Patient", shape="actor"),
            N(key="ins", label="Insurance System", shape="actor"),
            N(key="view", label="View patient record", shape="usecase"),
            N(key="presc", label="Write prescription", shape="usecase"),
            N(key="interact", label="Check drug interactions", shape="usecase"),
            N(key="lab", label="Order lab test", shape="usecase"),
            N(key="cover", label="Verify insurance coverage", shape="usecase"),
            N(key="vitals", label="Record vital signs", shape="usecase"),
            N(key="dispense", label="Dispense medication", shape="usecase"),
            N(key="subst", label="Substitute equivalent drug", shape="usecase"),
            N(key="results", label="View own results", shape="usecase"),
            N(key="auth", label="Authenticate", shape="usecase"),
        ], edges=[
            E(source="staff", target="doctor", kind="generalisation"),
            E(source="staff", target="nurse", kind="generalisation"),
            E(source="staff", target="view"),
            E(source="doctor", target="presc"),
            E(source="doctor", target="lab"),
            E(source="nurse", target="vitals"),
            E(source="pharm", target="dispense"),
            E(source="patient", target="results"),
            E(source="ins", target="cover"),
            E(source="presc", target="interact", kind="dependency", label="«include»"),
            E(source="lab", target="cover", kind="dependency", label="«include»"),
            E(source="results", target="auth", kind="dependency", label="«include»"),
            E(source="subst", target="dispense", kind="dependency", label="«extend»"),
        ]),
        explanation=(
            "Steps that ALWAYS happen are «include» relationships from the base use case to the included "
            "one: prescription to interaction check, lab order to coverage check, portal results to "
            "authentication. The optional substitution is «extend», drawn from 'Substitute equivalent drug' "
            "to 'Dispense medication'. Doctor and Nurse specialise Clinical Staff, so the shared 'View "
            "patient record' is attached once, to Clinical Staff. The Insurance System is an external "
            "actor outside the boundary."),
        mistake=(
            "Reversing «extend» (drawing it from the base to the extension), or modelling the insurance "
            "check as an internal use case with no external actor."),
    ),
    # ------------------------------------------------------------ node 2
    dict(
        node=2, diagram_type="ACTIVITY_DIAGRAM",
        question=(
            "An online retailer fulfils an order as follows:\n"
            "1. Receive the order and check stock for every item.\n"
            "2. If any item is out of stock, notify the customer and end; otherwise continue.\n"
            "3. Two flows then run IN PARALLEL:\n"
            "   - Payment: authorise the card; if it is declined, cancel the order and end the whole "
            "process.\n"
            "   - Warehouse: reserve stock, then pick and pack the items.\n"
            "4. When BOTH flows are complete, capture the payment, create the shipping label and dispatch.\n"
            "5. Send the tracking email and end.\n\n"
            "Draw the UML activity diagram."),
        instructions=(
            "1. Use a fork bar to split the parallel flows and a join bar to synchronise them.\n"
            "2. Use decision nodes with guards for the stock and payment outcomes.\n"
            "3. Capturing payment must come after the join, never inside one branch.\n"
            "4. Show every way the process can end."),
        spec=DiagramSpec(title="Order fulfilment - activity diagram", nodes=[
            N(key="start", label="Start", shape="start"),
            N(key="recv", label="Receive order", shape="action"),
            N(key="stock", label="Check stock", shape="action"),
            N(key="d_stock", label="All items in stock?", shape="decision"),
            N(key="notify", label="Notify customer", shape="action"),
            N(key="fork", label="", shape="bar"),
            N(key="auth", label="Authorise card", shape="action"),
            N(key="d_pay", label="Authorised?", shape="decision"),
            N(key="cancel", label="Cancel order", shape="action"),
            N(key="reserve", label="Reserve stock", shape="action"),
            N(key="pick", label="Pick and pack", shape="action"),
            N(key="join", label="", shape="bar"),
            N(key="capture", label="Capture payment", shape="action"),
            N(key="label", label="Create shipping label", shape="action"),
            N(key="dispatch", label="Dispatch", shape="action"),
            N(key="mail", label="Send tracking email", shape="action"),
            N(key="end", label="End", shape="end"),
        ], edges=[
            E(source="start", target="recv"),
            E(source="recv", target="stock"),
            E(source="stock", target="d_stock"),
            E(source="d_stock", target="notify", label="[no]"),
            E(source="notify", target="end"),
            E(source="d_stock", target="fork", label="[yes]"),
            E(source="fork", target="auth"),
            E(source="fork", target="reserve"),
            E(source="auth", target="d_pay"),
            E(source="d_pay", target="cancel", label="[declined]"),
            E(source="cancel", target="end"),
            E(source="d_pay", target="join", label="[authorised]"),
            E(source="reserve", target="pick"),
            E(source="pick", target="join"),
            E(source="join", target="capture"),
            E(source="capture", target="label"),
            E(source="label", target="dispatch"),
            E(source="dispatch", target="mail"),
            E(source="mail", target="end"),
        ]),
        explanation=(
            "After the stock decision, a fork bar starts the payment and warehouse flows at the same time. "
            "The payment branch has its own decision: a decline leads to 'Cancel order' and the end, while "
            "an authorisation continues to the join. The join waits for BOTH branches, so capture, label, "
            "dispatch and email happen only once payment is authorised AND the items are packed."),
        mistake=(
            "Drawing the branches one after the other instead of with fork and join, or putting 'Capture "
            "payment' inside the payment branch, which charges the customer before the warehouse has "
            "confirmed it can ship."),
    ),
    dict(
        node=2, diagram_type="UML_COMPONENT",
        question=(
            "Design the component architecture of a food-delivery platform built as microservices:\n"
            "- All mobile and web traffic enters through an API Gateway.\n"
            "- The gateway validates tokens with an Auth Service before routing to the Order Service.\n"
            "- The Order Service calls the Restaurant Service (menus, availability) and the Payment "
            "Service synchronously.\n"
            "- The Payment Service talks to an external Payment Provider.\n"
            "- When an order is confirmed, the Order Service publishes an OrderConfirmed event to a Message "
            "Broker. The Dispatch Service and the Notification Service consume it; neither is called "
            "directly by the Order Service.\n"
            "- Each service owns its own database (Order DB, Payment DB, Restaurant DB); no service reads "
            "another service's database.\n\n"
            "Draw the UML component diagram."),
        instructions=(
            "1. Show every service, the gateway, the broker, the external provider and each database as a "
            "component.\n"
            "2. Draw dependencies in the direction of use (from the component that calls or depends to the "
            "one it uses), labelled with the interface or event.\n"
            "3. Event consumers depend on the broker, not on the Order Service.\n"
            "4. Database-per-service: each database is used by exactly one service."),
        spec=DiagramSpec(title="Food delivery platform - components", nodes=[
            N(key="gw", label="API Gateway", shape="component"),
            N(key="auth", label="Auth Service", shape="component"),
            N(key="order", label="Order Service", shape="component"),
            N(key="rest", label="Restaurant Service", shape="component"),
            N(key="pay", label="Payment Service", shape="component"),
            N(key="psp", label="Payment Provider (external)", shape="component"),
            N(key="broker", label="Message Broker", shape="component"),
            N(key="dispatch", label="Dispatch Service", shape="component"),
            N(key="notify", label="Notification Service", shape="component"),
            N(key="odb", label="Order DB", shape="component"),
            N(key="pdb", label="Payment DB", shape="component"),
            N(key="rdb", label="Restaurant DB", shape="component"),
        ], edges=[
            E(source="gw", target="auth", kind="dependency", label="validateToken"),
            E(source="gw", target="order", kind="dependency", label="OrderAPI"),
            E(source="order", target="rest", kind="dependency", label="MenuAPI"),
            E(source="order", target="pay", kind="dependency", label="PaymentAPI"),
            E(source="pay", target="psp", kind="dependency", label="charge"),
            E(source="order", target="broker", kind="dependency", label="publish OrderConfirmed"),
            E(source="dispatch", target="broker", kind="dependency", label="subscribe OrderConfirmed"),
            E(source="notify", target="broker", kind="dependency", label="subscribe OrderConfirmed"),
            E(source="order", target="odb", kind="dependency", label="JDBC"),
            E(source="pay", target="pdb", kind="dependency", label="JDBC"),
            E(source="rest", target="rdb", kind="dependency", label="JDBC"),
        ]),
        explanation=(
            "Synchronous calls are dependencies from the caller to the provider: Gateway to Auth and Order, "
            "Order to Restaurant and Payment, Payment to the external provider. The asynchronous part is "
            "decoupled: Order publishes to the broker, and Dispatch and Notification depend on the BROKER "
            "(subscribe), not on Order. Each database has exactly one owner, which is the "
            "database-per-service rule."),
        mistake=(
            "Drawing Order Service -> Dispatch/Notification directly, which reintroduces the coupling the "
            "broker exists to remove; or letting two services share a database."),
    ),
    # ------------------------------------------------------------ node 3
    dict(
        node=3, diagram_type="ERD",
        question=(
            "Design the database for an airline reservation system.\n"
            "- A Booking (identified by a 6-character PNR) is made by one Customer and covers one or more "
            "Passengers; a passenger can appear on many bookings over time.\n"
            "- Each Booking has one or more FlightSegments (e.g. MNL-NRT, then NRT-LAX). A segment is one "
            "scheduled Flight on one date.\n"
            "- A Flight (flight number + date) operates with one Aircraft; an Aircraft has many Seats "
            "(seat number, cabin class).\n"
            "- A Ticket is issued per passenger per booking, with its own ticket number and fare paid.\n"
            "- A SeatAssignment links one passenger on one segment to one seat; a seat can be assigned at "
            "most once per flight.\n\n"
            "Draw the ERD with primary keys, foreign keys and cardinalities, and resolve every "
            "many-to-many relationship."),
        instructions=(
            "1. Resolve Booking-Passenger with an associative entity (the Ticket).\n"
            "2. Resolve Booking-Flight with FlightSegment.\n"
            "3. SeatAssignment references the segment, the passenger and the seat.\n"
            "4. Mark every PK and FK; show 1 / 0..* / 1..* cardinality on every relationship."),
        spec=DiagramSpec(title="Airline reservations - ERD", nodes=[
            N(key="cust", label="Customer", lines=["PK customerId", "name", "email"]),
            N(key="book", label="Booking", lines=["PK pnr", "FK customerId", "createdAt", "status"]),
            N(key="pax", label="Passenger", lines=["PK passengerId", "fullName", "passportNo", "dateOfBirth"]),
            N(key="ticket", label="Ticket", lines=["PK ticketNo", "FK pnr", "FK passengerId", "farePaid"]),
            N(key="seg", label="FlightSegment", lines=["PK segmentId", "FK pnr", "FK flightId", "segmentOrder"]),
            N(key="flight", label="Flight", lines=["PK flightId", "flightNo", "departDate", "FK aircraftId", "origin", "destination"]),
            N(key="ac", label="Aircraft", lines=["PK aircraftId", "model", "registration"]),
            N(key="seat", label="Seat", lines=["PK seatId", "FK aircraftId", "seatNo", "cabinClass"]),
            N(key="sa", label="SeatAssignment", lines=["PK assignmentId", "FK segmentId", "FK passengerId", "FK seatId"]),
        ], edges=[
            E(source="cust", target="book", label="makes", source_multiplicity="1", target_multiplicity="0..*"),
            E(source="book", target="ticket", label="issues", source_multiplicity="1", target_multiplicity="1..*"),
            E(source="pax", target="ticket", label="holds", source_multiplicity="1", target_multiplicity="0..*"),
            E(source="book", target="seg", label="contains", source_multiplicity="1", target_multiplicity="1..*"),
            E(source="flight", target="seg", label="operates as", source_multiplicity="1", target_multiplicity="0..*"),
            E(source="ac", target="flight", label="flies", source_multiplicity="1", target_multiplicity="0..*"),
            E(source="ac", target="seat", label="has", source_multiplicity="1", target_multiplicity="1..*"),
            E(source="seg", target="sa", label="assigns", source_multiplicity="1", target_multiplicity="0..*"),
            E(source="pax", target="sa", label="sits in", source_multiplicity="1", target_multiplicity="0..*"),
            E(source="seat", target="sa", label="is used by", source_multiplicity="1", target_multiplicity="0..*"),
        ]),
        explanation=(
            "Booking-Passenger is many-to-many, so Ticket resolves it with FK pnr and FK passengerId. "
            "Booking-Flight is many-to-many, so FlightSegment resolves it, with segmentOrder giving the "
            "itinerary sequence. Flight belongs to one Aircraft, whose Seats are its children. "
            "SeatAssignment is a three-way associative entity (segment, passenger, seat); a unique "
            "constraint on (flight via segment, seat) enforces 'one passenger per seat per flight'."),
        mistake=(
            "Putting seatNo directly on Ticket or Passenger, which cannot represent different seats on "
            "different segments, or leaving Booking-Passenger as an unresolved many-to-many line."),
    ),
    dict(
        node=3, diagram_type="UML_CLASS",
        question=(
            "Model the core domain of an insurance company.\n"
            "- A Policy is abstract: it has a policy number, start/end dates and a calculatePremium() "
            "operation whose rule differs by product. Concrete products are MotorPolicy (vehicle, driver "
            "age) and HomePolicy (address, rebuild value).\n"
            "- A Policy consists of one or more Coverages (type, limit, deductible); a coverage cannot "
            "exist without its policy.\n"
            "- A Customer holds zero or more policies; a policy has exactly one policyholder.\n"
            "- A Claim is filed against exactly one Policy and refers to the Coverage it claims under; a "
            "claim has many ClaimPayments.\n"
            "- An Agent manages a portfolio of Customers; customers keep existing if the agent leaves.\n\n"
            "Draw the UML class diagram with attributes, key operations, relationship kinds and "
            "multiplicities."),
        instructions=(
            "1. Show Policy as abstract and use generalisation for MotorPolicy and HomePolicy.\n"
            "2. Choose correctly between composition, aggregation and association for "
            "Policy-Coverage, Agent-Customer and Customer-Policy.\n"
            "3. Put multiplicities on both ends of every association.\n"
            "4. Place each operation in the class that owns the data it needs."),
        spec=DiagramSpec(title="Insurance domain - class model", nodes=[
            N(key="policy", label="Policy", abstract=True, lines=[
                "- policyNo: String", "- startDate: Date", "- endDate: Date",
                "+ calculatePremium(): Money", "+ isActive(on: Date): boolean"]),
            N(key="motor", label="MotorPolicy", lines=[
                "- vehicleReg: String", "- driverAge: int", "+ calculatePremium(): Money"]),
            N(key="home", label="HomePolicy", lines=[
                "- address: String", "- rebuildValue: Money", "+ calculatePremium(): Money"]),
            N(key="cov", label="Coverage", lines=[
                "- type: CoverageType", "- limit: Money", "- deductible: Money",
                "+ payable(loss: Money): Money"]),
            N(key="cust", label="Customer", lines=["- customerId: String", "- name: String"]),
            N(key="claim", label="Claim", lines=[
                "- claimNo: String", "- lossDate: Date", "- status: ClaimStatus",
                "+ totalPaid(): Money"]),
            N(key="pay", label="ClaimPayment", lines=["- amount: Money", "- paidOn: Date"]),
            N(key="agent", label="Agent", lines=["- agentId: String", "- name: String"]),
        ], edges=[
            E(source="policy", target="motor", kind="generalisation"),
            E(source="policy", target="home", kind="generalisation"),
            E(source="policy", target="cov", kind="composition", source_multiplicity="1", target_multiplicity="1..*"),
            E(source="cust", target="policy", label="holds", source_multiplicity="1", target_multiplicity="0..*"),
            E(source="claim", target="policy", label="filed against", source_multiplicity="0..*", target_multiplicity="1"),
            E(source="claim", target="cov", label="claims under", source_multiplicity="0..*", target_multiplicity="1"),
            E(source="claim", target="pay", kind="composition", source_multiplicity="1", target_multiplicity="0..*"),
            E(source="agent", target="cust", kind="aggregation", label="manages", source_multiplicity="0..1", target_multiplicity="0..*"),
        ]),
        explanation=(
            "Policy is abstract with calculatePremium() overridden by MotorPolicy and HomePolicy "
            "(generalisation, triangle on Policy). Coverage cannot outlive its policy, so it is composition "
            "(filled diamond on Policy, 1 to 1..*); ClaimPayments likewise belong to their Claim. "
            "Agent-Customer is aggregation, because customers survive the agent leaving. Customer-Policy and "
            "Claim-Policy/Coverage are plain associations with the stated multiplicities."),
        mistake=(
            "Using aggregation for Policy-Coverage (coverages cannot exist alone) or composition for "
            "Agent-Customer (customers must survive the agent), and forgetting to make Policy abstract even "
            "though calculatePremium() has no single rule."),
    ),
]


def build() -> list[dict]:
    out = []
    for item in NEW:
        xml = item["spec"].render(item["diagram_type"])
        check = check_reference(xml)
        assert check.ok, (item["diagram_type"], check)
        out.append({**item, "xml": xml,
                    "full_explanation": item["explanation"] + "\n\nCommon mistake: " + item["mistake"]})
    return out


if __name__ == "__main__":
    for item in build():
        print(item["node"], item["diagram_type"], len(item["xml"]), "chars OK")
