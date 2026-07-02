import csv
import json
import sys
from pathlib import Path


def parse_json_field(value, fallback):
    if value is None or value == "":
        return fallback
    try:
        return json.loads(value)
    except json.JSONDecodeError:
        return fallback


def normalize_row(row):
    merchant_profile = parse_json_field(row.get("merchant_profile"), {})
    chat_knowledge_aggr = parse_json_field(row.get("chat_knowledge_aggr"), [])
    merchant_id = str(row.get("merchant_id", "")).strip()

    if isinstance(merchant_profile, dict):
        merchant_profile = {"merchant_id": merchant_id, **merchant_profile}
    else:
        merchant_profile = {"merchant_id": merchant_id, "raw": row.get("merchant_profile", "")}

    if not isinstance(chat_knowledge_aggr, list):
        chat_knowledge_aggr = []

    return {
        "p_date": row.get("p_date", ""),
        "merchant_id": merchant_id,
        "source_table": "ks_mmu.pi_merchant_profile_generation_record",
        "first_industry_name": row.get("first_industry_name", ""),
        "author_ks_id": row.get("author_ks_id", ""),
        "is_open_robot_valid": row.get("is_open_robot_valid", ""),
        "merchant_name": row.get("merchant_name", ""),
        "corporation_name": row.get("corporation_name", ""),
        "user_name": row.get("user_name", ""),
        "user_text": row.get("user_text", ""),
        "guide_words": row.get("guide_words", ""),
        "chat_knowledge_aggr": chat_knowledge_aggr,
        "merchant_profile": merchant_profile,
    }


def main():
    if len(sys.argv) != 3:
        print("usage: import_merchant_profiles.py <input.csv> <output.json>", file=sys.stderr)
        return 2

    source = Path(sys.argv[1])
    target = Path(sys.argv[2])
    target.parent.mkdir(parents=True, exist_ok=True)

    merchants = {}
    with source.open("r", encoding="utf-8-sig", newline="") as csv_file:
        reader = csv.DictReader(csv_file)
        for row in reader:
            record = normalize_row(row)
            if record["merchant_id"]:
                merchants[record["merchant_id"]] = record

    payload = {
        "source_file": str(source),
        "record_count": len(merchants),
        "merchants": merchants,
    }
    with target.open("w", encoding="utf-8") as json_file:
        json.dump(payload, json_file, ensure_ascii=False, separators=(",", ":"))

    print(json.dumps({"record_count": len(merchants), "output": str(target)}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
