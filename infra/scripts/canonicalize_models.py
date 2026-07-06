"""Report on derivative / quantized model variants vs. base models.

Run inside the api container:
    docker compose exec -e PYTHONPATH=/app api python /repo/infra/scripts/canonicalize_models.py
    # CSV to a file on your machine (run from a shell that redirects):
    docker compose exec -e PYTHONPATH=/app api python /repo/infra/scripts/canonicalize_models.py --csv > variants.csv

Non-destructive: it only reads and reports. Many HF entries are re-uploads of the
same base model in different formats (GGUF/AWQ/GPTQ/quant bits). This groups them
by inferred base name so you can see how much of the tracked set is derivative.
"""
import re
import sys
from collections import defaultdict
from sqlalchemy import select
from src.database import session_scope
from src.models import Model

# format / quantization markers that indicate a derivative upload
DERIV_MARKERS = [
    "gguf", "ggml", "awq", "gptq", "exl2", "mlx", "bnb", "onnx", "openvino",
    "int4", "int8", "fp16", "fp8", "4bit", "8bit", "2bit", "3bit", "5bit", "6bit",
    "-dpo", "-lora", "-qlora", "adapter",
]
QUANT_TOKEN = re.compile(r"\b(q[2-8]([_\-]?[0-9])?([_\-]?[kmsl])*)\b", re.I)


def _is_derivative(name: str) -> str | None:
    low = name.lower()
    for mk in DERIV_MARKERS:
        if mk in low:
            return mk
    if QUANT_TOKEN.search(low):
        return "quant"
    return None


def _base_name(hf_id: str) -> str:
    """Strip org prefix + trailing format/quant tokens to guess the base model."""
    name = hf_id.split("/")[-1].lower()
    name = re.sub(r"[-_.]?(gguf|ggml|awq|gptq|exl2|mlx|bnb|onnx|openvino)\b", "", name)
    name = re.sub(r"[-_.]?(int4|int8|fp16|fp8|[2-8]bit)\b", "", name)
    name = QUANT_TOKEN.sub("", name)
    return re.sub(r"[-_.]+$", "", name).strip("-_. ")


def main():
    as_csv = "--csv" in sys.argv
    db = session_scope()
    try:
        rows = db.execute(select(Model.hf_model_id)).scalars().all()
    finally:
        db.close()

    total = len(rows)
    derivs = 0
    families = defaultdict(int)
    csv_lines = ["hf_model_id,is_derivative,marker,base_name"]
    for hf_id in rows:
        marker = _is_derivative(hf_id)
        base = _base_name(hf_id)
        if marker:
            derivs += 1
            families[base] += 1
        csv_lines.append(f"{hf_id},{bool(marker)},{marker or ''},{base}")

    if as_csv:
        print("\n".join(csv_lines))
        return

    print(f"Models total:        {total}")
    print(f"Derivative variants: {derivs}  ({round(100*derivs/max(total,1),1)}%)")
    print(f"Distinct base names among derivatives: {len(families)}")
    print("\nTop base families by variant count:")
    for base, cnt in sorted(families.items(), key=lambda x: -x[1])[:20]:
        print(f"   {cnt:4d}  {base}")
    print("\nNote: report only, nothing changed. Re-run with --csv to export the full mapping.")


if __name__ == "__main__":
    main()
