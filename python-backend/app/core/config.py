from __future__ import annotations

import re
from functools import lru_cache
from pathlib import Path
from typing import Annotated

from pydantic import Field, field_validator, model_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict

_IDENTIFIER = re.compile(r"^[A-Za-z_][A-Za-z0-9_]*$")


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    app_name: str = "Rebyu BKT Service"
    app_version: str = "1.0.0"
    environment: str = "development"
    debug: bool = False
    api_prefix: str = "/api/v1/bkt"
    service_api_key: str = ""
    cors_origins: Annotated[list[str], NoDecode] = Field(
        default_factory=lambda: ["http://localhost:5173"]
    )

    database_url: str = "postgresql+psycopg://rebyu:rebyu@postgres:5432/rebyu"
    sql_echo: bool = False
    db_pool_size: int = 10
    db_max_overflow: int = 20
    db_schema: str = "bkt"

    redis_url: str = "redis://redis:6379/0"
    timezone: str = "Asia/Manila"

    openrouter_site_url: str = "https://rebyu.app"
    openrouter_app_name: str = "REBYU"

    ai_default_model: str = ""

    ai_lesson_provider: str = "openrouter"
    ai_lesson_model: str = "anthropic/claude-sonnet-4.5"
    ai_lesson_fallbacks: str = "google/gemini-2.5-pro,openai/gpt-4.1,groq:openai/gpt-oss-120b,nvidia/nemotron-3-ultra-550b-a55b:free"
    ai_lesson_max_tokens: int = 24000
    ai_lesson_temperature: float = 0.4

    ai_curriculum_provider: str = "openrouter"
    ai_curriculum_model: str = "anthropic/claude-sonnet-4.5"
    ai_curriculum_fallbacks: str = "google/gemini-2.5-pro,openai/gpt-4.1,groq:openai/gpt-oss-120b,nvidia/nemotron-3-ultra-550b-a55b:free"
    ai_curriculum_max_tokens: int = 16000
    ai_curriculum_temperature: float = 0.2

    ai_diagram_provider: str = "openrouter"
    ai_diagram_model: str = "anthropic/claude-sonnet-4.5"
    ai_diagram_fallbacks: str = "openai/gpt-4.1,google/gemini-2.5-flash,groq:openai/gpt-oss-120b,groq:openai/gpt-oss-20b,nvidia/nemotron-3-ultra-550b-a55b:free,nvidia/nemotron-3-super-120b-a12b:free,qwen/qwen3.8-27b:free,google/gemma-4-31b-it:free"
    ai_diagram_max_tokens: int = 10000

    judge0_enabled: bool = True
    judge0_base_url: str = "https://ce.judge0.com"
    judge0_api_key: str = ""
    judge0_api_key_header: str = "X-RapidAPI-Key"
    judge0_timeout_seconds: float = 40.0
    judge0_concurrency: int = 3
    judge0_cpu_time_limit_seconds: float = 5.0
    judge0_memory_limit_kb: int = 128000
    ai_diagram_temperature: float = 0.2

    ai_question_provider: str = "openrouter"
    ai_question_model: str = "google/gemini-2.5-flash"
    ai_question_fallbacks: str = "openai/gpt-4.1-mini,anthropic/claude-haiku-4.5,groq:openai/gpt-oss-120b,groq:openai/gpt-oss-20b,groq:qwen/qwen3.8-27b,nvidia/nemotron-3-ultra-550b-a55b:free,nvidia/nemotron-3-super-120b-a12b:free,qwen/qwen3.8-27b:free,google/gemma-4-31b-it:free"
    ai_question_max_tokens: int = 8000
    ai_question_temperature: float = 0.6

    ai_tutor_provider: str = "openrouter"
    ai_tutor_model: str = "google/gemini-2.5-flash"
    ai_tutor_fallbacks: str = "openai/gpt-4.1-mini,groq:openai/gpt-oss-120b,groq:openai/gpt-oss-20b,nvidia/nemotron-3-ultra-550b-a55b:free,nvidia/nemotron-3-super-120b-a12b:free,qwen/qwen3.8-27b:free,google/gemma-4-31b-it:free"
    ai_tutor_max_tokens: int = 2000
    ai_tutor_temperature: float = 0.3

    ai_tutor_vision_provider: str = "openrouter"
    ai_tutor_vision_model: str = "google/gemini-2.5-flash"
    ai_tutor_vision_fallbacks: str = (
        "groq:qwen/qwen3.8-27b,google/gemma-4-31b-it:free,thinkingmachines/inkling:free,"
        "google/gemma-4-26b-a4b-it:free,nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free,"
        "openai/gpt-4.1-mini"
    )
    ai_tutor_vision_max_tokens: int = 700
    ai_tutor_vision_temperature: float = 0.3

    ai_grading_provider: str = "openrouter"
    ai_grading_model: str = "openai/gpt-4.1-mini"
    ai_grading_fallbacks: str = "google/gemini-2.5-flash-lite,google/gemini-2.5-flash,groq:openai/gpt-oss-120b,groq:openai/gpt-oss-20b,nvidia/nemotron-3-ultra-550b-a55b:free,nvidia/nemotron-3-super-120b-a12b:free,qwen/qwen3.8-27b:free,google/gemma-4-31b-it:free"
    ai_grading_max_tokens: int = 1500
    ai_grading_temperature: float = 0.0

    ai_lesson_audit_provider: str = "openrouter"
    ai_lesson_audit_model: str = "openai/gpt-4.1-mini"
    ai_lesson_audit_fallbacks: str = "google/gemini-2.5-flash,groq:openai/gpt-oss-120b,groq:openai/gpt-oss-20b,nvidia/nemotron-3-ultra-550b-a55b:free,nvidia/nemotron-3-super-120b-a12b:free,qwen/qwen3.8-27b:free,google/gemma-4-31b-it:free"
    ai_lesson_audit_max_tokens: int = 1024
    ai_lesson_audit_temperature: float = 0.0

    ai_document_audit_provider: str = "openrouter"
    ai_document_audit_model: str = "openai/gpt-4.1-mini"
    ai_document_audit_fallbacks: str = "google/gemini-2.5-flash,groq:openai/gpt-oss-120b,groq:openai/gpt-oss-20b,nvidia/nemotron-3-ultra-550b-a55b:free,nvidia/nemotron-3-super-120b-a12b:free,qwen/qwen3.8-27b:free,google/gemma-4-31b-it:free"
    ai_document_audit_max_tokens: int = 512
    ai_document_audit_temperature: float = 0.0

    ai_figure_provider: str = "openrouter"
    ai_figure_model: str = "google/gemini-2.5-flash"
    ai_figure_fallbacks: str = "openai/gpt-4.1-mini,anthropic/claude-sonnet-4.5,qwen/qwen3.8-27b:free,google/gemma-4-31b-it:free"
    ai_figure_max_tokens: int = 700
    ai_figure_temperature: float = 0.0

    ai_tagging_provider: str = "openrouter"
    ai_tagging_model: str = "x-ai/grok-4.7"
    ai_tagging_fallbacks: str = (
        "groq:openai/gpt-oss-120b,groq:openai/gpt-oss-20b,groq:qwen/qwen3.8-27b,"
        "qwen/qwen3.8-27b:free,google/gemma-4-31b-it:free,"
        "nvidia/nemotron-3-super-120b-a12b:free"
    )
    ai_tagging_max_tokens: int = 3000
    ai_tagging_temperature: float = 0.0

    ai_extraction_provider: str = "openrouter"
    ai_extraction_model: str = "google/gemini-2.5-flash"
    ai_extraction_fallbacks: str = (
        "google/gemma-4-31b-it:free,google/gemma-4-26b-a4b-it:free,"
        "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free,qwen/qwen3.8-27b:free"
    )
    ai_extraction_max_tokens: int = 4000
    ai_extraction_temperature: float = 0.0

    curriculum_min_majors: int = 3
    curriculum_max_majors: int = 6
    curriculum_min_middles: int = 2
    curriculum_max_middles: int = 4
    curriculum_min_lessons: int = 3
    curriculum_max_lessons: int = 5

    curriculum_autosize: bool = False

    curriculum_autosize_max_lessons: int = 60

    lesson_checkpoint_every: int = 10

    lesson_min_sections: int = 22

    lesson_concurrency: int = 4

    lesson_quiz_questions: int = 10
    middle_quiz_questions: int = 20
    major_quiz_questions: int = 50
    diagnostic_exam_questions: int = 40
    mock_exam_questions: int = 50
    question_bank_questions: int = 100

    question_bank_questions_per_lesson: int = 0

    question_batch_size: int = 20

    auto_review_min_quality_score: int = 70

    mock_exam_max_questions: int = 0

    ai_quota_cooldown_seconds: float = 3600.0

    training_view_name: str = "rebyu_bkt_training_data_v"
    max_upload_mb: int = 100

    fallback_prior: float = 0.30
    fallback_learn: float = 0.08
    fallback_guess: float = 0.25
    fallback_slip: float = 0.10
    fallback_forget: float = 0.03

    smart_guess_easy: float = 0.30
    smart_guess_average: float = 0.25
    smart_guess_hard: float = 0.20
    smart_slip_easy: float = 0.08
    smart_slip_average: float = 0.10
    smart_slip_hard: float = 0.15
    smart_learn_diagnostic: float = 0.05
    smart_learn_lesson_quiz: float = 0.08
    smart_learn_middle_exam: float = 0.10
    smart_learn_major_exam: float = 0.12
    smart_learn_mock_exam: float = 0.10
    smart_learn_knowledge_check: float = 0.06
    smart_learn_generated_quiz: float = 0.05

    developing_threshold: float = 0.40
    good_threshold: float = 0.70
    mastered_threshold: float = 0.85

    mastery_accuracy_guard_min_evidence: int = 10
    mastery_accuracy_guard_headroom: float = 0.35

    readiness_mastery_weight: float = 0.20
    readiness_progress_weight: float = 0.10
    readiness_mock_exam_weight: float = 0.40
    readiness_quiz_weight: float = 0.10
    readiness_major_exam_weight: float = 0.08
    readiness_middle_exam_weight: float = 0.07
    readiness_diagnostic_weight: float = 0.03
    readiness_streak_weight: float = 0.02

    priority_weight_mastery: float = 0.45
    priority_weight_incorrect: float = 0.20
    priority_weight_mock: float = 0.10
    priority_weight_diagnostic: float = 0.10
    priority_weight_curriculum: float = 0.10
    priority_weight_review: float = 0.05

    priority_critical_threshold: float = 85.0
    priority_high_threshold: float = 70.0
    priority_medium_threshold: float = 50.0
    priority_low_threshold: float = 30.0
    priority_on_track_threshold: float = 15.0

    priority_min_evidence: int = 1
    mastery_critical_ceiling: float = 0.20
    mastery_high_ceiling: float = 0.30

    priority_worsen_margin: float = 5.0
    priority_improve_margin: float = 8.0

    rag_embedding_model: str = "sentence-transformers/all-MiniLM-L6-v2"
    rag_embedding_device: str = "cpu"
    rag_index_dir: Path = Path("faiss_db")

    qdrant_url: str = "http://localhost:6333"
    qdrant_api_key: str = ""
    qdrant_timeout_seconds: float = 30.0
    rag_chunk_size: int = 1000
    rag_chunk_overlap: int = 150
    rag_fetch_k: int = 80
    rag_top_k: int = 24
    rag_rerank_enabled: bool = True
    rag_rerank_model: str = "cross-encoder/ms-marco-MiniLM-L-6-v2"
    rag_max_context_chars: int = 160000

    rabbitmq_host: str = "localhost"
    rabbitmq_port: int = 5672
    rabbitmq_username: str = "guest"
    rabbitmq_password: str = "guest"
    rabbitmq_exchange: str = "rebyu.exchange"
    rabbitmq_dead_letter_exchange: str = "rebyu.dlx"

    aws_s3_endpoint_url: str = ""
    aws_s3_bucket_name: str = "rebyu"
    aws_s3_region: str = "us-east-1"
    aws_access_key_id: str = ""
    aws_secret_access_key: str = ""

    @property
    def rabbitmq_url(self) -> str:
        return (
            f"amqp://{self.rabbitmq_username}:{self.rabbitmq_password}"
            f"@{self.rabbitmq_host}:{self.rabbitmq_port}/"
        )

    @field_validator(
        "curriculum_min_majors",
        "curriculum_max_majors",
        "curriculum_min_middles",
        "curriculum_max_middles",
        "curriculum_min_lessons",
        "curriculum_max_lessons",
        "lesson_min_sections",
        "lesson_quiz_questions",
        "middle_quiz_questions",
        "major_quiz_questions",
        "diagnostic_exam_questions",
        "mock_exam_questions",
        "question_bank_questions",
    )
    @classmethod
    def at_least_one(cls, value: int) -> int:
        if value < 1:
            raise ValueError("curriculum and assessment sizes must be at least 1")
        return value

    @model_validator(mode="after")
    def ranges_are_ordered(self) -> "Settings":
        """A max below its min would produce a prompt asking for "3 to 1"
        lessons -- nonsense the model resolves arbitrarily, and a silent one
        since nothing else would ever notice."""
        for low, high in (
            ("curriculum_min_majors", "curriculum_max_majors"),
            ("curriculum_min_middles", "curriculum_max_middles"),
            ("curriculum_min_lessons", "curriculum_max_lessons"),
        ):
            if getattr(self, high) < getattr(self, low):
                raise ValueError(f"{high} must be greater than or equal to {low}")
        return self

    @field_validator("training_view_name")
    @classmethod
    def validate_view_name(cls, value: str) -> str:
        if not _IDENTIFIER.fullmatch(value):
            raise ValueError("training_view_name must be a plain SQL identifier")
        return value

    @field_validator("db_schema")
    @classmethod
    def validate_db_schema(cls, value: str) -> str:
        if not _IDENTIFIER.fullmatch(value):
            raise ValueError("db_schema must be a plain SQL identifier")
        return value

    @field_validator("rag_index_dir", mode="before")
    @classmethod
    def normalize_index_dir(cls, value: object) -> Path:
        return Path(str(value)).expanduser()

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, value: object) -> object:
        if isinstance(value, str):
            return [item.strip() for item in value.split(",") if item.strip()]
        return value

    @field_validator(
        "fallback_prior",
        "fallback_learn",
        "fallback_guess",
        "fallback_slip",
        "fallback_forget",
        "developing_threshold",
        "good_threshold",
        "mastered_threshold",
        "readiness_mastery_weight",
        "readiness_diagnostic_weight",
        "readiness_quiz_weight",
        "readiness_middle_exam_weight",
        "readiness_major_exam_weight",
        "readiness_mock_exam_weight",
        "readiness_progress_weight",
        "readiness_streak_weight",
    )
    @classmethod
    def probability_range(cls, value: float) -> float:
        if not 0 <= value <= 1:
            raise ValueError("probability and weight values must be between 0 and 1")
        return value

    def ensure_directories(self) -> None:
        self.rag_index_dir.mkdir(parents=True, exist_ok=True)


@lru_cache
def get_settings() -> Settings:
    settings = Settings()
    settings.ensure_directories()
    return settings
