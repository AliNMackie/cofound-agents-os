"""
IC Origin — Signal Pipeline (Apache Beam / Dataflow)

Reads signal events from Pub/Sub, applies schema validation and
windowing, and writes to BigQuery `ic_origin.fact_signals`.

Usage — Local (DirectRunner):
    python signal_pipeline.py \\
        --project ic-origin \\
        --temp_location gs://ic-origin-dataflow-temp/tmp

Usage — GCP Dataflow:
    python signal_pipeline.py \\
        --project ic-origin \\
        --region europe-west2 \\
        --runner DataflowRunner \\
        --temp_location gs://ic-origin-dataflow-temp/tmp \\
        --staging_location gs://ic-origin-dataflow-temp/staging \\
        --setup_file ./setup.py
"""

import argparse
import datetime
import json
import logging
import uuid

import apache_beam as beam
from apache_beam.options.pipeline_options import PipelineOptions, StandardOptions
from apache_beam.transforms.window import FixedWindows
from apache_beam.transforms.trigger import (
    AfterWatermark,
    AfterProcessingTime,
    AccumulationMode,
)

logger = logging.getLogger(__name__)

# ── BigQuery schema for ic_origin.fact_signals ─────────────────────
FACT_SIGNALS_SCHEMA = (
    "signal_id:STRING,"
    "company_number:STRING,"
    "company_name:STRING,"
    "portfolio_id:STRING,"
    "risk_tier:STRING,"
    "conviction_score:INT64,"
    "signal_type:STRING,"
    "source_family:STRING,"
    "region:STRING,"
    "ingested_at:TIMESTAMP,"
    "event_date:DATE"
)

FACT_SIGNALS_TABLE = "ic-origin:ic_origin.fact_signals"

VALID_RISK_TIERS = {"ELEVATED_RISK", "STABLE", "IMPROVED", "UNSCORED"}
VALID_SOURCE_FAMILIES = {"GOV_REGISTRY", "RSS_NEWS", "TALENT_FEED"}


# ── Transform functions ────────────────────────────────────────────

def parse_signal_json(message_bytes: bytes) -> dict | None:
    """
    Parse a Pub/Sub message payload from JSON bytes.
    Returns None for malformed messages (dead-letter logging).
    """
    try:
        payload = json.loads(message_bytes.decode("utf-8"))
        if not isinstance(payload, dict):
            logger.warning("Payload is not a JSON object: %s", type(payload))
            return None
        return payload
    except (json.JSONDecodeError, UnicodeDecodeError) as e:
        logger.error("Failed to parse signal JSON: %s", str(e))
        return None


def map_to_bigquery_row(signal: dict) -> dict:
    """
    Map a parsed signal dict to the BigQuery fact_signals schema.
    Applies defaults and type coercion for missing/invalid fields.
    """
    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
    today_iso = datetime.date.today().isoformat()

    risk_tier = signal.get("risk_tier", "UNSCORED")
    if risk_tier not in VALID_RISK_TIERS:
        risk_tier = "UNSCORED"

    source_family = signal.get("source_family", "GOV_REGISTRY")
    if source_family not in VALID_SOURCE_FAMILIES:
        source_family = "GOV_REGISTRY"

    try:
        conviction = int(signal.get("conviction_score", 0))
    except (TypeError, ValueError):
        conviction = 0

    return {
        "signal_id": signal.get("signal_id", str(uuid.uuid4())),
        "company_number": signal.get("company_number", ""),
        "company_name": signal.get("company_name", ""),
        "portfolio_id": signal.get("portfolio_id", ""),
        "risk_tier": risk_tier,
        "conviction_score": conviction,
        "signal_type": signal.get("signal_type", "UNKNOWN"),
        "source_family": source_family,
        "region": signal.get("region", ""),
        "ingested_at": signal.get("ingested_at", now_iso),
        "event_date": signal.get("event_date", today_iso),
    }


# ── Pipeline definition ───────────────────────────────────────────

def run(argv=None):
    parser = argparse.ArgumentParser(
        description="IC Origin Signal Pipeline — Pub/Sub → BigQuery"
    )
    parser.add_argument(
        "--input_subscription",
        default="projects/ic-origin/subscriptions/ic-origin-signals-sub",
        help="Pub/Sub subscription to read from.",
    )
    parser.add_argument(
        "--output_table",
        default=FACT_SIGNALS_TABLE,
        help="BigQuery output table (project:dataset.table).",
    )
    parser.add_argument(
        "--window_size_seconds",
        type=int,
        default=60,
        help="Fixed window size in seconds.",
    )

    known_args, pipeline_args = parser.parse_known_args(argv)

    pipeline_options = PipelineOptions(pipeline_args)
    pipeline_options.view_as(StandardOptions).streaming = True

    with beam.Pipeline(options=pipeline_options) as p:
        (
            p
            # ── Step 1: Read from Pub/Sub ──
            | "ReadFromPubSub"
            >> beam.io.ReadFromPubSub(
                subscription=known_args.input_subscription,
            )
            # ── Step 2: Parse JSON payload ──
            | "ParseJSON" >> beam.Map(parse_signal_json)
            # ── Step 3: Filter dead-letter (malformed) messages ──
            | "FilterInvalid" >> beam.Filter(lambda x: x is not None)
            # ── Step 4: Apply Fixed Windowing with late-data handling ──
            | "Window"
            >> beam.WindowInto(
                FixedWindows(known_args.window_size_seconds),
                trigger=AfterWatermark(
                    early=AfterProcessingTime(30),
                ),
                accumulation_mode=AccumulationMode.DISCARDING,
            )
            # ── Step 5: Map to BigQuery row schema ──
            | "MapToBQRow" >> beam.Map(map_to_bigquery_row)
            # ── Step 6: Write to BigQuery ──
            | "WriteToBigQuery"
            >> beam.io.WriteToBigQuery(
                table=known_args.output_table,
                schema=FACT_SIGNALS_SCHEMA,
                write_disposition=beam.io.BigQueryDisposition.WRITE_APPEND,
                create_disposition=beam.io.BigQueryDisposition.CREATE_NEVER,
                method=beam.io.WriteToBigQuery.Method.STREAMING_INSERTS,
            )
        )


if __name__ == "__main__":
    logging.getLogger().setLevel(logging.INFO)
    run()
