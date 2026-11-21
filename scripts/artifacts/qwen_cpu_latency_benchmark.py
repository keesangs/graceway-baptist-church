#!/usr/bin/env python3
import json
import os
import platform
import statistics
import time
from pathlib import Path

import psutil
import torch
from qwen_tts import Qwen3TTSModel

MODEL = os.environ.get("QWEN_BENCH_MODEL", "Qwen/Qwen3-TTS-12Hz-1.7B-CustomVoice")
SPEAKER = os.environ.get("QWEN_BENCH_SPEAKER", "Aiden")
THREADS = int(os.environ.get("QWEN_BENCH_THREADS", str(min(os.cpu_count() or 1, 6))))
CACHE = os.environ.setdefault("HF_HOME", str(Path.home() / ".cache" / "graceway-qwen-benchmark"))
OUT = Path(os.environ.get("QWEN_BENCH_OUTPUT", str(Path.home() / "graceway-artifacts" / "qwen_cpu_latency_results.json")))
OUT.parent.mkdir(parents=True, exist_ok=True)

sentences = [
    ("short", "Welcome to Graceway Baptist Church."),
    ("medium", "Please stand together as we worship Jesus Christ and hear God's word."),
    ("long", "Good morning, Graceway Baptist Church. Today we gather as one community to worship God, encourage one another, and receive the hope of the gospel through Jesus Christ."),
]

torch.set_num_threads(THREADS)
try:
    torch.set_num_interop_threads(1)
except RuntimeError:
    pass

print(json.dumps({
    "phase": "environment",
    "model": MODEL,
    "python": platform.python_version(),
    "torch": torch.__version__,
    "cpu_count": os.cpu_count(),
    "threads": torch.get_num_threads(),
    "cuda_available": torch.cuda.is_available(),
    "ram_gb": round(psutil.virtual_memory().total / (1024**3), 2),
    "cache": CACHE,
}, ensure_ascii=False), flush=True)

load_start = time.perf_counter()
tts = Qwen3TTSModel.from_pretrained(
    MODEL,
    device_map="cpu",
    dtype=torch.float32,
    attn_implementation=None,
)
load_seconds = time.perf_counter() - load_start
print(json.dumps({"phase": "model_loaded", "load_seconds": round(load_seconds, 3)}, ensure_ascii=False), flush=True)

results = []
for label, text in sentences:
    for run in (1, 2):
        start = time.perf_counter()
        wavs, sample_rate = tts.generate_custom_voice(
            text=[text],
            speaker=[SPEAKER],
            language=["English"],
            instruct=["Speak clearly and warmly, suitable for a church announcement."],
            non_streaming_mode=True,
        )
        elapsed = time.perf_counter() - start
        samples = int(wavs[0].shape[-1]) if wavs else 0
        audio_seconds = samples / sample_rate if sample_rate else 0
        item = {
            "label": label,
            "run": run,
            "characters": len(text),
            "seconds": round(elapsed, 3),
            "sample_rate": sample_rate,
            "audio_seconds": round(audio_seconds, 3),
            "real_time_factor": round(elapsed / audio_seconds, 2) if audio_seconds else None,
            "pcm_nonempty": samples > 0,
        }
        results.append(item)
        print(json.dumps({"phase": "synthesis", **item}, ensure_ascii=False), flush=True)

summary = {}
for label, _ in sentences:
    rows = [r for r in results if r["label"] == label]
    summary[label] = {
        "first_run_seconds": rows[0]["seconds"],
        "warm_run_seconds": rows[1]["seconds"],
        "warm_rtf": rows[1]["real_time_factor"],
        "characters": rows[0]["characters"],
    }

payload = {
    "model": MODEL,
    "device": "cpu",
    "threads": torch.get_num_threads(),
    "load_seconds": round(load_seconds, 3),
    "results": results,
    "summary": summary,
    "notes": [
        "This measures the current 6-vCPU sandbox CPU, not a 2-vCPU Cloud Computer.",
        "First run includes model warm-up effects; warm run is the relevant steady-state comparison.",
        "real_time_factor > 1 means synthesis is slower than real-time playback.",
    ],
}
OUT.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n")
print(json.dumps({"phase": "complete", "output": str(OUT)}, ensure_ascii=False), flush=True)
