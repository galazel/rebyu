from __future__ import annotations

import os
from pathlib import Path

os.environ.setdefault("CELERY_TASK_ALWAYS_EAGER", "true")

from app.db.session import SessionLocal  # noqa: E402
from app.services.training_service import create_training_run, execute_training_run  # noqa: E402


def main() -> None:
    csv_path = Path("sample_data/rebyu_bkt_demo_data.csv").resolve()
    with SessionLocal() as session:
        run = create_training_run(
            session,
            source_type="csv",
            requested_by="scripts/train_demo.py",
            num_fits=1,
        )
        result = execute_training_run(
            session,
            run_id=run.model_run_id,
            csv_path=str(csv_path),
        )
        print(result)


if __name__ == "__main__":
    main()
