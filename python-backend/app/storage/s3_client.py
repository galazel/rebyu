"""Reads knowledge-document files the Java backend uploaded to S3.

Mirrors backend-java's S3Config: same bucket/region/endpoint, static credentials.
Java owns writes (DocumentIngestionService); Python only ever reads by the
s3_key stored on the knowledge_documents row.
"""

from __future__ import annotations

from functools import lru_cache

import boto3
from botocore.config import Config

from app.core.config import get_settings


@lru_cache
def get_s3_client():
    settings = get_settings()
    endpoint = settings.aws_s3_endpoint_url.strip() or None
    config = None
    if endpoint:
        # S3-compatible stores (Cloudflare R2): path-style addressing, and
        # checksums only where the API requires them -- boto3 >= 1.36 adds
        # CRC checksum headers to every request by default, which such stores
        # may not accept.
        config = Config(
            signature_version="s3v4",
            s3={"addressing_style": "path"},
            request_checksum_calculation="when_required",
            response_checksum_validation="when_required",
        )
    return boto3.client(
        "s3",
        endpoint_url=endpoint,
        region_name=settings.aws_s3_region,
        aws_access_key_id=settings.aws_access_key_id or None,
        aws_secret_access_key=settings.aws_secret_access_key or None,
        config=config,
    )


def fetch_object_bytes(s3_key: str) -> bytes:
    settings = get_settings()
    response = get_s3_client().get_object(Bucket=settings.aws_s3_bucket_name, Key=s3_key)
    return response["Body"].read()


def upload_object_bytes(s3_key: str, content: bytes, content_type: str) -> None:
    """Writes bytes Python itself produced (captured figure screenshots) back
    to the same bucket Java owns writes to. Java still owns document uploads;
    this is the one case where a Python node needs to persist a derived
    artifact rather than only read one."""
    settings = get_settings()
    get_s3_client().put_object(
        Bucket=settings.aws_s3_bucket_name,
        Key=s3_key,
        Body=content,
        ContentType=content_type,
    )
