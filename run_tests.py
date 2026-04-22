# Test runner for MahirConnect.

from __future__ import annotations

import argparse
import io
import json
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Callable

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))

from fastapi.testclient import TestClient

from backend.main import app, SUPPORTED_EXTENSIONS
from backend.settings import ADMIN_USERNAME, _k4
from backend.stt import transcribe_audio
from backend.transliterate import urdu_to_roman
from backend.tts import _indian_number_words, preprocess_for_tts


EVAL_PATH = ROOT / "frontend" / "public" / "test_results" / "evaluation.json"
AUDIO_DIR = ROOT / "tests" / "audio"

# Canonical refusal substrings: checked case-insensitively
REFUSAL_MARKERS = (
    "don't have information about that",
    "maloomat nahi hai",
)

# Terminal colors (ANSI : works on Windows 10+ and all modern shells)
C = {
    "green":  "\033[92m",
    "red":    "\033[91m",
    "yellow": "\033[93m",
    "blue":   "\033[94m",
    "gray":   "\033[90m",
    "bold":   "\033[1m",
    "reset":  "\033[0m",
}


client = TestClient(app)
ADMIN_AUTH = (ADMIN_USERNAME, _k4)


# IO helpers
def load_eval() -> dict:
    return json.loads(EVAL_PATH.read_text(encoding="utf-8"))


def save_eval(data: dict) -> None:
    EVAL_PATH.write_text(
        json.dumps(data, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


def header(label: str) -> None:
    print(f"\n{C['bold']}{C['blue']}── {label} ──{C['reset']}")


def line(case_id: str, passed: bool | None, detail: str = "") -> None:
    if passed is True:
        mark = f"{C['green']}PASS{C['reset']}"
    elif passed is False:
        mark = f"{C['red']}FAIL{C['reset']}"
    else:
        mark = f"{C['yellow']}SKIP{C['reset']}"
    print(f"  [{mark}] {case_id:<7}  {detail}")


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

# Per-section runners
def run_unit_integration(section: dict, args: argparse.Namespace) -> None:
    header("Unit & Integration")
    for case in section["cases"]:
        cid = case["id"]
        start = time.perf_counter()
        actual: str = ""
        passed: bool | None = False
        try:
            if cid == "UT-01":
                actual = urdu_to_roman("آپ کیسے ہیں")
                lower = actual.lower()
                passed = all(w in lower for w in ("aap", "kaise", "hain"))

            elif cid == "UT-02":
                actual = preprocess_for_tts("Visit FAST-NUCES for admission.")
                passed = "Fast Nuces" in actual

            elif cid == "UT-03":
                actual = preprocess_for_tts("See [site](https://example.com).")
                passed = "Link." in actual and "https" not in actual

            elif cid == "UT-04":
                actual = ", ".join(SUPPORTED_EXTENSIONS)
                passed = {".txt", ".pdf", ".docx"} <= set(SUPPORTED_EXTENSIONS)

            elif cid == "UT-05":
                actual = _indian_number_words(200500)
                passed = actual.strip().lower() == "two lakh five hundred"

            elif cid == "UT-06":
                actual = preprocess_for_tts("Rs. 167,500")
                passed = "one lakh sixty seven thousand five hundred" in actual

            elif cid == "IT-01":
                r = client.post("/text-query", json={"query": "Fast university ki fees kya hai?"})
                keys_ok = r.status_code == 200 and {
                    "transcript", "response_text", "audio_url",
                } <= r.json().keys()
                actual = f"HTTP {r.status_code}"
                passed = keys_ok

            elif cid == "IT-02":
                audio = AUDIO_DIR / "admission_deadline_ur.ogg"
                if not audio.exists():
                    actual = "audio fixture missing (tests/audio/admission_deadline_ur.ogg)"
                    passed = None
                else:
                    with audio.open("rb") as f:
                        r = client.post(
                            "/voice-query",
                            files={"audio": ("a.ogg", f, "audio/ogg")},
                        )
                    actual = f"HTTP {r.status_code}"
                    passed = r.status_code == 200

            elif cid == "IT-03":
                r = client.post("/contact-message", json={
                    "email": "not-an-email",
                    "contact": "03001234567",
                    "message": "hi",
                })
                actual = f"HTTP {r.status_code}"
                passed = r.status_code == 400

            elif cid == "IT-04":
                r = client.get("/admin/stats")
                actual = f"HTTP {r.status_code}"
                passed = r.status_code == 401

            elif cid == "IT-05":
                r = client.post(
                    "/admin/messages/fake-id/action",
                    json={"action": "sms"},
                    auth=ADMIN_AUTH,
                )
                actual = f"HTTP {r.status_code}"
                passed = r.status_code == 400

            elif cid == "IT-06":
                audio = AUDIO_DIR / "admission_deadline_ur.ogg"
                if not audio.exists():
                    actual = "audio fixture missing"
                    passed = None
                else:
                    result = transcribe_audio(audio.read_bytes(), "audio/ogg")
                    actual = f"language={result['language']}"
                    passed = result["language"] == "ur"
            else:
                actual = "unknown case id"
                passed = False

        except Exception as e:
            actual = f"Exception: {e!r}"
            passed = False

        duration_ms = int((time.perf_counter() - start) * 1000)
        case["result"] = {
            "actual": actual,
            "passed": passed,
            "duration_ms": duration_ms,
        }
        line(cid, passed, f"{duration_ms}ms — {actual[:80]}")


def run_transliteration(section: dict, args: argparse.Namespace) -> None:
    header("Transliteration Accuracy")
    if args.quick:
        section["result"] = {"skipped": True, "reason": "--quick"}
        for case in section["cases"]:
            case["result"] = {"skipped": True}
            line(case["id"], None, "skipped (--quick)")
        return

    passed_count = 0
    for case in section["cases"]:
        cid = case["id"]
        try:
            actual = urdu_to_roman(case["urdu"])
            expected_words = [w for w in case["expected"].lower().split() if len(w) > 2]
            actual_lower = actual.lower()
            hits = sum(1 for w in expected_words if w in actual_lower)
            # Accept if >= 60% of significant expected words appear
            passed = hits >= max(1, int(len(expected_words) * 0.6))
            case["result"] = {
                "actual": actual,
                "hits": hits,
                "expected_words": len(expected_words),
                "passed": passed,
            }
            if passed:
                passed_count += 1
            line(cid, passed, f"{hits}/{len(expected_words)} — {actual[:60]}")
        except Exception as e:
            case["result"] = {"actual": f"Error: {e!r}", "passed": False}
            line(cid, False, str(e)[:80])


def run_response_time(section: dict, queries: list[dict], args: argparse.Namespace) -> None:
    header("Response Time")
    if args.quick:
        section["result"] = {"skipped": True, "reason": "--quick"}
        line("RT", None, "skipped (--quick)")
        return

    durations: list[float] = []
    for q in queries:
        try:
            start = time.perf_counter()
            r = client.post("/text-query", json={"query": q["query"]})
            elapsed = time.perf_counter() - start
            if r.status_code == 200:
                durations.append(elapsed)
                line(q["id"], True, f"{elapsed:.2f}s — {q['query'][:60]}")
            else:
                line(q["id"], False, f"HTTP {r.status_code}")
        except Exception as e:
            line(q["id"], False, f"Error: {e!r}")

    if not durations:
        section["result"] = {"error": "no successful queries"}
        return

    durations_sorted = sorted(durations)
    mean = sum(durations) / len(durations)
    p50 = durations_sorted[len(durations_sorted) // 2]
    p95_idx = max(0, int(len(durations_sorted) * 0.95) - 1)
    p95 = durations_sorted[p95_idx]

    section["result"] = {
        "avg_seconds":   round(mean, 2),
        "p50_seconds":   round(p50, 2),
        "p95_seconds":   round(p95, 2),
        "samples":       len(durations),
        "run_at":        _now_iso(),
    }
    print(f"  {C['bold']}mean={mean:.2f}s  p50={p50:.2f}s  p95={p95:.2f}s  (n={len(durations)}){C['reset']}")


def run_answer_accuracy(section: dict, args: argparse.Namespace) -> None:
    header("Answer Accuracy")
    if args.quick:
        section["result"] = {"skipped": True, "reason": "--quick"}
        for case in section["cases"]:
            case["result"] = {"skipped": True}
            line(case["id"], None, "skipped (--quick)")
        return

    for case in section["cases"]:
        cid = case["id"]
        try:
            r = client.post("/text-query", json={"query": case["query"]})
            if r.status_code != 200:
                case["result"] = {"passed": False, "actual_snippet": f"HTTP {r.status_code}"}
                line(cid, False, f"HTTP {r.status_code}")
                continue
            answer = (r.json().get("response_text") or "").lower()
            expected = case.get("expected_contains", [])
            hits = [kw for kw in expected if kw.lower() in answer]
            # Pass if at least half of the expected keywords appear
            threshold = max(1, (len(expected) + 1) // 2)
            passed = len(hits) >= threshold
            case["result"] = {
                "actual_snippet": answer[:120],
                "matched_keywords": hits,
                "passed": passed,
            }
            line(cid, passed, f"{len(hits)}/{len(expected)} keywords — {case['query'][:50]}")
        except Exception as e:
            case["result"] = {"passed": False, "actual_snippet": f"Error: {e!r}"}
            line(cid, False, str(e)[:80])


def run_scope_restriction(section: dict, args: argparse.Namespace) -> None:
    header("Scope Restriction")
    if args.quick:
        section["result"] = {"skipped": True, "reason": "--quick"}
        for case in section["cases"]:
            case["result"] = {"skipped": True}
            line(case["id"], None, "skipped (--quick)")
        return

    for case in section["cases"]:
        cid = case["id"]
        try:
            r = client.post("/text-query", json={"query": case["prompt"]})
            if r.status_code != 200:
                case["result"] = {"refused": False, "passed": False, "response_snippet": f"HTTP {r.status_code}"}
                line(cid, False, f"HTTP {r.status_code}")
                continue
            answer = r.json().get("response_text") or ""
            low = answer.lower()
            refused = any(m in low for m in REFUSAL_MARKERS)
            case["result"] = {
                "refused": refused,
                "passed": refused,
                "response_snippet": answer[:120],
            }
            line(cid, refused, "refused" if refused else "LEAKED — " + answer[:60])
        except Exception as e:
            case["result"] = {"refused": False, "passed": False, "response_snippet": f"Error: {e!r}"}
            line(cid, False, str(e)[:80])


def run_edge_cases(section: dict, args: argparse.Namespace) -> None:
    header("Edge Cases")
    for case in section["cases"]:
        cid = case["id"]
        actual = ""
        passed: bool | None = False
        try:
            if cid == "EC-01":  # empty audio
                r = client.post(
                    "/voice-query",
                    files={"audio": ("empty.webm", b"", "audio/webm")},
                )
                actual = f"HTTP {r.status_code}"
                passed = r.status_code == 400

            elif cid == "EC-07":  # very long query
                long_q = "Admission ke baare mein mujhe detail batao. " * 30
                r = client.post("/text-query", json={"query": long_q})
                actual = f"HTTP {r.status_code}"
                passed = r.status_code == 200

            elif cid == "EC-04":  # follow-up using history
                history = [
                    {"role": "user",      "content": "Admission requirements kya hain?"},
                    {"role": "assistant", "content": "Admission ke liye SSC aur HSSC ki transcripts chahiye, aur admission test dena hota hai."},
                ]
                r = client.post("/text-query", json={
                    "query": "Test kab hota hai?",
                    "history": history,
                })
                actual = f"HTTP {r.status_code}"
                passed = r.status_code == 200 and "test" in r.json().get("response_text", "").lower()

            elif cid in ("EC-02", "EC-03", "EC-05", "EC-06"):
                # Need audio fixtures or manual setup
                actual = "requires audio fixture or manual check"
                passed = None

            else:
                actual = "unknown case id"
                passed = False

        except Exception as e:
            actual = f"Exception: {e!r}"
            passed = False

        case["result"] = {"actual": actual, "passed": passed}
        line(cid, passed, actual[:80])


def run_security_validation(section: dict, args: argparse.Namespace) -> None:
    header("Security Validation")
    for case in section["cases"]:
        cid = case["id"]
        actual = ""
        passed: bool = False
        try:
            if cid == "SV-01":
                r = client.get("/admin/stats")
                actual, passed = f"HTTP {r.status_code}", r.status_code == 401

            elif cid == "SV-02":
                r = client.get("/admin/stats", auth=(ADMIN_USERNAME, "not-the-password"))
                actual, passed = f"HTTP {r.status_code}", r.status_code == 401

            elif cid == "SV-03":
                r = client.post("/contact-message", json={
                    "email": "bad-email", "contact": "123", "message": "x",
                })
                actual, passed = f"HTTP {r.status_code}", r.status_code == 400

            elif cid == "SV-04":
                # Backend just stores what it gets; frontend strips non-digits.
                # Here we verify backend happily accepts pure digits.
                r = client.post("/contact-message", json={
                    "email": "a@b.com", "contact": "03001234567", "message": "test",
                })
                actual, passed = f"HTTP {r.status_code}", r.status_code == 200

            elif cid == "SV-05":
                r = client.post("/contact-message", json={
                    "email": "a@b.com", "contact": "123", "message": "x" * 3000,
                })
                actual, passed = f"HTTP {r.status_code}", r.status_code in (400, 422)

            elif cid == "SV-06":
                r = client.post(
                    "/admin/messages/no-such-id/action",
                    json={"action": "sms"},
                    auth=ADMIN_AUTH,
                )
                actual, passed = f"HTTP {r.status_code}", r.status_code == 400

            elif cid == "SV-07":
                r = client.post(
                    "/admin/ingest",
                    files={"file": ("bad.exe", b"MZ\0\0", "application/octet-stream")},
                    auth=ADMIN_AUTH,
                )
                actual, passed = f"HTTP {r.status_code}", r.status_code == 400
            else:
                actual, passed = "unknown case id", False

        except Exception as e:
            actual, passed = f"Exception: {e!r}", False

        case["result"] = {"actual": actual, "passed": passed}
        line(cid, passed, actual[:80])


# Driver
SECTION_RUNNERS: dict[str, Callable[[dict, argparse.Namespace], None]] = {
    "unit_integration":        run_unit_integration,
    "transliteration_accuracy": run_transliteration,
    "answer_accuracy":          run_answer_accuracy,
    "scope_restriction":        run_scope_restriction,
    "edge_cases":               run_edge_cases,
    "security_validation":      run_security_validation,
}


def summarize(data: dict) -> None:
    """Print a final summary table per section."""
    print(f"\n{C['bold']}── Summary ──{C['reset']}")
    for name in list(SECTION_RUNNERS.keys()) + ["response_time"]:
        sec = data.get(name)
        if not sec:
            continue

        if isinstance(sec, dict) and "cases" in sec:
            total = len(sec["cases"])
            passed = sum(1 for c in sec["cases"] if c.get("result") and c["result"].get("passed") is True)
            skipped = sum(1 for c in sec["cases"] if c.get("result") and c["result"].get("skipped"))
            failed = total - passed - skipped
            status = C["green"] if failed == 0 else C["red"]
            print(f"  {status}{name:<28}{C['reset']}  {passed}/{total} passed  "
                  f"({skipped} skipped, {failed} failed)")
        elif isinstance(sec, dict) and sec.get("result"):
            res = sec["result"]
            if "avg_seconds" in res:
                print(f"  {C['blue']}{name:<28}{C['reset']}  avg={res['avg_seconds']}s "
                      f"p50={res.get('p50_seconds')}s p95={res.get('p95_seconds')}s")
            elif "skipped" in res:
                print(f"  {C['yellow']}{name:<28}{C['reset']}  skipped ({res.get('reason','')})")
            else:
                print(f"  {C['blue']}{name:<28}{C['reset']}  done")


def main() -> int:
    parser = argparse.ArgumentParser(description="MahirConnect test runner")
    parser.add_argument("--quick", action="store_true",
                        help="skip sections that require paid API calls (transliteration, answer_accuracy, scope_restriction, response_time)")
    parser.add_argument("--only", help="run only this section (e.g. 'scope_restriction')")
    args = parser.parse_args()

    print(f"{C['bold']}MahirConnect test runner{C['reset']}  ({_now_iso()})")
    print(f"Reading {EVAL_PATH}")

    data = load_eval()
    queries = data.get("benchmark_queries", {}).get("queries", [])

    targets = [args.only] if args.only else list(SECTION_RUNNERS.keys()) + ["response_time"]

    for name in targets:
        section = data.get(name)
        if not section:
            continue
        if name == "response_time":
            run_response_time(section, queries, args)
        elif name in SECTION_RUNNERS:
            SECTION_RUNNERS[name](section, args)

    data["last_run"] = _now_iso()
    save_eval(data)

    summarize(data)
    print(f"\n{C['green']}{C['bold']}Results written to {EVAL_PATH}{C['reset']}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
