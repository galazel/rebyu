"""Imports the IT Passport past papers, one transaction per paper.

    docker compose exec -T python-api \
        python /app/scripts/fe_papers/run_ip_import.py [--commit]

Why this exists rather than calling seed_papers.py directly:

ONE TRANSACTION PER PAPER. seed_papers.py commits once after every paper it
was given. Handing it all 31 IP papers meant a single transaction holding
roughly 18,000 statements open for twenty minutes against a database in
another region, and it died on `SSL error: unexpected eof while reading`
with nothing written. Per-paper commits bound the loss to one paper, and the
seeder's idempotence on (lesson_id, question_text) makes a re-run skip what
already landed -- so an interrupted import resumes by being run again.

PORT 6543, NOT 5432. The configured DATABASE_URL points at Supabase's
session-mode pooler, which allows fifteen clients in total; the Java backend
reserves up to eight of them and the API holds more, so a long import cannot
reliably get a slot and fails with EMAXCONNSESSION. 6543 is the same database
through the transaction-mode pooler, which has far more slots and returns the
server connection at each commit instead of holding it for the whole session.

Transaction mode cannot carry prepared statements between statements, so
psycopg's automatic preparation is turned off; leaving it on produces
"prepared statement already exists" once a statement has run five times.
"""

import argparse
import glob
import os
import re
import sys

sys.path.insert(0, "/app")
sys.path.insert(0, "/app/scripts/fe_papers")
sys.path.insert(0, "/app/scripts/fe_expansion")

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

import seed_papers

PARSED_DIR = "/app/scripts/fe_papers/parsed/"


def transaction_pooler_url():
    url = os.environ.get("DATABASE_URL")
    if not url:
        env_path = "/app/.env"
        if os.path.exists(env_path):
            with open(env_path, encoding="utf-8") as handle:
                match = re.search(r"^DATABASE_URL=(.+)$", handle.read(), re.M)
            if match:
                url = match.group(1).strip()
    if not url:
        raise RuntimeError("no DATABASE_URL available")
    # Same host and database, different pooler mode.
    return url.replace(":5432/", ":6543/")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--commit", action="store_true")
    parser.add_argument("--allow-weak", action="store_true")
    args = parser.parse_args()

    engine = create_engine(
        transaction_pooler_url(),
        pool_pre_ping=True,
        pool_size=1,
        max_overflow=0,
        # Transaction pooling hands back a different server connection after
        # each commit, so a statement prepared on one is absent on the next.
        connect_args={"prepare_threshold": None},
    )
    Session = sessionmaker(bind=engine)

    papers = [os.path.basename(p)[:-5]
              for p in sorted(glob.glob(PARSED_DIR + "*_IP.json"))]
    print("papers: %d   mode: %s" % (len(papers), "COMMIT" if args.commit else "DRY RUN"))

    totals = [0, 0, 0, 0]
    failed = []
    for name in papers:
        db = Session()
        try:
            added, skipped, weak, broken = seed_papers.import_paper(
                db, name, args.allow_weak)
            if args.commit:
                db.commit()
            else:
                db.rollback()
            totals = [a + b for a, b in zip(totals, (added, skipped, weak, broken))]
            print("  %-14s added=%-4d already-there=%-4d weak=%-3d unusable=%d"
                  % (name, added, skipped, weak, broken), flush=True)
        except Exception as error:
            db.rollback()
            failed.append(name)
            print("  %-14s FAILED: %s" % (name, str(error).split("\n")[0][:110]),
                  flush=True)
        finally:
            db.close()

    print("\n%s: %d added, %d already there, %d weak-skipped, %d unusable"
          % ("committed" if args.commit else "DRY RUN (nothing written)", *totals))
    if failed:
        print("failed papers (re-run to resume): %s" % " ".join(failed))
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
