"""Drawn diagrams for IT Passport lessons 748-759."""

import os
import sys

sys.path.insert(0, "/app/scripts/topcit_expansion")

import diagram_kit as dk  # noqa: E402

OUTPUT_DIR = "/app/../frontend/public/lesson-media"


def _three_schema():
    return dk.tiers(
        "The three-schema view of a database",
        [("External schema", ["What each group of users sees"]),
         ("Conceptual schema", ["The whole logical design: entities and relationships"]),
         ("Internal schema", ["How it is physically stored and indexed"])],
        caption="Separating the levels lets storage change without rewriting applications.",
    )


def _normalisation():
    return dk.flow(
        "Normalising a table",
        [("Unnormalised", "repeating groups in one row"),
         ("1NF", "one value per cell"),
         ("2NF", "no dependence on part of a key"),
         ("3NF", "no dependence between non-key fields")],
        caption="Each step removes a way the same fact could be stored twice and disagree.",
    )


def _transaction():
    return dk.compare(
        "The four ACID properties",
        [("Atomicity", "all or nothing", ["Every step commits, or none does",
                                          "A half-finished transfer is impossible"]),
         ("Consistency", "rules always hold", ["Constraints are never left broken",
                                               "The database moves valid state to valid state"]),
         ("Isolation", "as if alone", ["Concurrent transactions do not see each other's partial work",
                                       "Locking or versioning enforces it"]),
         ("Durability", "survives a crash", ["A committed change is on stable storage",
                                             "Write-ahead logging implements it"])],
        caption="Together they are what makes a database trustworthy for money.",
    )


def _network_types():
    return dk.table(
        "Networks by the area they cover",
        ["Type", "Covers", "Typical example"],
        [["LAN", "One building or site", "An office network"],
         ["WAN", "Cities or countries", "Links between branches"],
         ["Internet", "Globally", "A network of networks"],
         ["Intranet", "One organisation, privately", "Internal portal"],
         ["VPN", "A private tunnel over a public network", "Remote working"]],
        caption="The distinction is reach and ownership, not technology.",
    )


def _osi_tcpip():
    return dk.tiers(
        "Where the familiar protocols sit",
        [("Application", ["HTTP, SMTP, DNS, FTP -- what programs speak"]),
         ("Transport", ["TCP (reliable, ordered) and UDP (fast, no guarantees)"]),
         ("Internet", ["IP -- addressing and routing between networks"]),
         ("Link", ["Ethernet, Wi-Fi -- one hop across one medium"])],
        caption="Each layer uses the one below and serves the one above.",
    )


def _cia():
    return dk.cycle(
        "The three goals of information security",
        [("Confidentiality", "Only those authorised can read it"),
         ("Integrity", "It is correct and has not been altered"),
         ("Availability", "It can be used when it is needed")],
        caption="A control usually strengthens one and can weaken another.",
    )


def _auth_factors():
    return dk.compare(
        "The three kinds of authentication factor",
        [("Something you know", "knowledge", ["Password, PIN, passphrase",
                                              "Cheap; guessable and reusable"]),
         ("Something you have", "possession", ["Token, phone, smart card",
                                               "Lost or stolen with the object"]),
         ("Something you are", "inherence", ["Fingerprint, face, iris",
                                             "Hard to forge; impossible to reissue"])],
        caption="Multi-factor means factors of DIFFERENT kinds -- two passwords is still one factor.",
    )


def _usability():
    return dk.flow(
        "Fitts's law in practice",
        [("Target far away", "takes longer to reach"),
         ("Target is small", "takes longer to hit"),
         ("Screen edge", "effectively infinite -- cannot overshoot"),
         ("So", "put frequent actions large and near")],
        caption="Why menu bars live at screen edges and primary buttons are big.",
    )


DIAGRAMS = {
    "ip-three-schema": _three_schema,
    "ip-normalisation": _normalisation,
    "ip-acid": _transaction,
    "ip-network-types": _network_types,
    "ip-protocol-layers": _osi_tcpip,
    "ip-cia-triad": _cia,
    "ip-auth-factors": _auth_factors,
    "ip-fitts-law": _usability,
}


def main():
    target = os.path.normpath(OUTPUT_DIR)
    os.makedirs(target, exist_ok=True)
    for slug, build in DIAGRAMS.items():
        svg = build()
        with open(os.path.join(target, slug + ".svg"), "w", encoding="utf-8") as handle:
            handle.write(svg)
        print("  wrote %-28s %6d bytes" % (slug + ".svg", len(svg)))
    print("\n%d diagrams written" % len(DIAGRAMS))


if __name__ == "__main__":
    main()
