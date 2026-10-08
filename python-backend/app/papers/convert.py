"""Word and other office documents to PDF, for the past-paper import.

Every reader downstream -- the browser's own rules, the layout reader, the
AI page reader, figure crops and "Show original" -- works on a PDF's pages.
Converting a reviewer typed in Word once, up front, puts it on that same
path, rather than keeping a second set of readers for documents that have no
pages until something lays them out.

LibreOffice does the laying out, headless. The image installs the
metric-compatible fonts for Calibri, Cambria, Arial and Times New Roman, so a
converted page breaks where Word breaks it.
"""

from __future__ import annotations

import logging
import os
import shutil
import subprocess
import tempfile
import threading

logger = logging.getLogger(__name__)

SIGNATURES = (
    (b"PK\x03\x04", ".docx"),
    (b"\xd0\xcf\x11\xe0\xa1\xb1\x1a\xe1", ".doc"),
    (b"{\\rtf", ".rtf"),
)
EXTENSIONS = {".docx", ".doc", ".odt", ".rtf"}

_slot = threading.Semaphore(1)

TIMEOUT_SECONDS = 180


class ConversionError(Exception):
    """The document could not be turned into a PDF; the message says why."""


def is_document(data: bytes) -> bool:
    return any(data.startswith(signature) for signature, _ in SIGNATURES)


def _extension(data: bytes, filename: str | None) -> str:
    ext = os.path.splitext(filename or "")[1].lower()
    if ext in EXTENSIONS:
        return ext
    return next(ext for signature, ext in SIGNATURES if data.startswith(signature))


def to_pdf(data: bytes, filename: str | None = None) -> bytes:
    """The document as PDF bytes. Raises ConversionError."""
    if not is_document(data):
        raise ConversionError("it is not a Word, OpenDocument or RTF document")
    soffice = shutil.which("soffice") or shutil.which("libreoffice")
    if soffice is None:
        raise ConversionError("LibreOffice is not installed on the AI service")

    with _slot, tempfile.TemporaryDirectory() as work:
        source = os.path.join(work, "document" + _extension(data, filename))
        with open(source, "wb") as handle:
            handle.write(data)
        command = [
            soffice,
            f"-env:UserInstallation=file://{work}/profile",
            "--headless", "--norestore", "--nolockcheck",
            "--convert-to", "pdf", "--outdir", work, source,
        ]
        try:
            run = subprocess.run(command, capture_output=True, timeout=TIMEOUT_SECONDS, check=False)
        except subprocess.TimeoutExpired as error:
            raise ConversionError(f"converting took longer than {TIMEOUT_SECONDS} seconds") from error
        output = os.path.join(work, "document.pdf")
        if not os.path.exists(output):
            detail = (run.stderr or run.stdout or b"").decode("utf-8", "replace").strip()[-300:]
            logger.error("LibreOffice could not convert %s: %s", filename, detail)
            raise ConversionError("the document could not be opened -- is it password-protected or damaged?")
        with open(output, "rb") as handle:
            return handle.read()
