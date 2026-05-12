# Build FYP figures from evaluation.json.

from __future__ import annotations

import json
from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np
from matplotlib.patches import Patch

ROOT = Path(__file__).resolve().parent
EVAL_PATH = ROOT / "frontend" / "public" / "test_results" / "evaluation.json"
OUT_DIR = ROOT / "test_cases visuals"
OUT_DIR.mkdir(exist_ok=True)


# Consistent palette (matches the dashboard's Tailwind tones)
COLORS = {
    "pass":    "#22c55e",
    "fail":    "#ef4444",
    "skip":    "#eab308",
    "primary": "#3b82f6",
    "accent":  "#8b5cf6",
    "muted":   "#94a3b8",
    "dark":    "#1e293b",
}


plt.rcParams.update({
    "font.family":        "DejaVu Sans",
    "axes.spines.top":    False,
    "axes.spines.right":  False,
    "axes.titleweight":   "bold",
    "axes.titlesize":     14,
    "axes.labelsize":     11,
    "axes.titlepad":      14,
    "xtick.labelsize":    10,
    "ytick.labelsize":    10,
    "figure.dpi":         110,
    "savefig.dpi":        200,
    "savefig.bbox":       "tight",
})


SECTION_LABELS = {
    "unit_integration":         "Unit & Integration",
    "transliteration_accuracy": "Transliteration",
    "answer_accuracy":          "Answer Accuracy",
    "scope_restriction":        "Scope Restriction",
    "edge_cases":               "Edge Cases",
    "security_validation":      "Security & Validation",
}


# Helpers
def load_data() -> dict:
    return json.loads(EVAL_PATH.read_text(encoding="utf-8"))


def tally(cases: list) -> dict:
    """Return {passed, failed, skipped, pending, total} for a list of cases."""
    t = {"passed": 0, "failed": 0, "skipped": 0, "pending": 0}
    for c in cases:
        r = c.get("result")
        if not r:
            t["pending"] += 1
        elif r.get("skipped") or r.get("passed") is None:
            t["skipped"] += 1
        elif r.get("passed") is True:
            t["passed"] += 1
        else:
            t["failed"] += 1
    t["total"] = sum(t.values())
    return t


def save(fig, name: str) -> None:
    path = OUT_DIR / name
    fig.savefig(path, facecolor="white")
    plt.close(fig)
    print(f"  saved -> {path.name}")


# 1. Overall donut: pass / fail
def chart_overall_donut(data: dict) -> None:
    total = {"passed": 0, "failed": 0}
    for s in SECTION_LABELS:
        t = tally(data.get(s, {}).get("cases", []))
        for k in total:
            total[k] += t[k]

    sizes = [total["passed"], total["failed"]]
    labels = [f"Passed ({total['passed']})",
              f"Failed ({total['failed']})"]
    colors = [COLORS["pass"], COLORS["fail"]]

    fig, ax = plt.subplots(figsize=(7.5, 7.5))
    wedges, texts, autotexts = ax.pie(
        sizes, labels=labels, colors=colors, startangle=90,
        wedgeprops={"width": 0.42, "edgecolor": "white", "linewidth": 3},
        autopct=lambda p: f"{p:.1f}%" if p > 1 else "",
        pctdistance=0.78,
        textprops={"fontsize": 11, "fontweight": "bold"},
    )
    for at in autotexts:
        at.set_color("white")

    grand = sum(sizes)
    pass_pct = total["passed"] / grand * 100 if grand else 0
    ax.text(0, 0.08, f"{pass_pct:.0f}%", ha="center", va="center",
            fontsize=42, fontweight="bold", color=COLORS["pass"])
    ax.text(0, -0.12, "Pass Rate", ha="center", va="center",
            fontsize=12, color=COLORS["dark"])
    save(fig, "01_overall_donut.png")


# 2. Stacked bar per section
def chart_stacked_bar(data: dict) -> None:
    sections = list(SECTION_LABELS.keys())
    labels = [SECTION_LABELS[s] for s in sections]
    passed, failed = [], []
    for s in sections:
        t = tally(data.get(s, {}).get("cases", []))
        passed.append(t["passed"])
        failed.append(t["failed"])

    x = np.arange(len(sections))
    fig, ax = plt.subplots(figsize=(11.5, 6))
    ax.bar(x, passed,  label=f"Passed ({sum(passed)})",  color=COLORS["pass"])
    ax.bar(x, failed,  bottom=passed,
           label=f"Failed ({sum(failed)})",  color=COLORS["fail"])

    totals = [p + f for p, f in zip(passed, failed)]
    for i, total in enumerate(totals):
        ax.text(i, total + 0.4, str(total),
                ha="center", fontweight="bold", fontsize=10)

    ax.set_xticks(x)
    ax.set_xticklabels(labels, rotation=18, ha="right")
    ax.set_ylabel("Number of Test Cases")
    ax.legend(loc="upper right", frameon=False)
    ax.grid(axis="y", alpha=0.2)
    save(fig, "02_stacked_bar_per_section.png")


# 3. Pass-rate horizontal bar
def chart_pass_rate(data: dict) -> None:
    labels, rates, denoms = [], [], []
    for s in SECTION_LABELS:
        t = tally(data.get(s, {}).get("cases", []))
        denom = t["passed"] + t["failed"]
        rate = (t["passed"] / denom * 100) if denom else 0
        labels.append(SECTION_LABELS[s])
        rates.append(rate)
        denoms.append(denom)

    fig, ax = plt.subplots(figsize=(10, 5.5))
    bars = ax.barh(labels, rates, color=COLORS["primary"], height=0.6)
    for bar, r, n in zip(bars, rates, denoms):
        ax.text(r + 1.2, bar.get_y() + bar.get_height() / 2,
                f"{r:.0f}%  ({n} executed)",
                va="center", fontweight="bold", color=COLORS["dark"])
    ax.set_xlim(0, 125)
    ax.set_xlabel("Pass Rate (%)")
    ax.invert_yaxis()
    ax.grid(axis="x", alpha=0.2)
    save(fig, "03_pass_rate_per_section.png")


# 4. Response time (mean / p50 / p95)
def chart_response_time(data: dict) -> None:
    rt = (data.get("response_time") or {}).get("result") or {}
    if "avg_seconds" not in rt:
        return
    metrics = ["Mean", "p50 (median)", "p95"]
    values  = [rt["avg_seconds"], rt["p50_seconds"], rt["p95_seconds"]]
    colors  = [COLORS["primary"], COLORS["accent"], COLORS["fail"]]

    fig, ax = plt.subplots(figsize=(9, 5.5))
    bars = ax.bar(metrics, values, color=colors, width=0.55)
    for bar, v in zip(bars, values):
        ax.text(bar.get_x() + bar.get_width() / 2, v + 0.2,
                f"{v:.2f}s", ha="center", fontweight="bold", fontsize=13)
    ax.set_ylabel("Seconds")
    ax.set_ylim(0, max(values) * 1.25)
    ax.grid(axis="y", alpha=0.2)
    save(fig, "04_response_time.png")


# 5. Benchmark queries by category
def chart_benchmark_categories(data: dict) -> None:
    queries = (data.get("benchmark_queries") or {}).get("queries") or []
    if not queries:
        return
    counts: dict = {}
    for q in queries:
        counts[q["category"]] = counts.get(q["category"], 0) + 1

    labels = list(counts.keys())
    values = list(counts.values())
    palette = plt.cm.Set2(np.linspace(0, 1, len(labels)))

    fig, ax = plt.subplots(figsize=(9.5, 5.5))
    bars = ax.barh(labels, values, color=palette)
    for bar, v in zip(bars, values):
        ax.text(v + 0.08, bar.get_y() + bar.get_height() / 2,
                str(v), va="center", fontweight="bold")
    ax.set_xlim(0, max(values) + 1)
    ax.set_xlabel("Number of Queries")
    ax.grid(axis="x", alpha=0.2)
    save(fig, "05_benchmark_by_category.png")


# 6. Benchmark queries by language
def chart_benchmark_languages(data: dict) -> None:
    queries = (data.get("benchmark_queries") or {}).get("queries") or []
    if not queries:
        return
    counts: dict = {}
    for q in queries:
        counts[q["language"]] = counts.get(q["language"], 0) + 1
    labels = list(counts.keys())
    values = list(counts.values())
    palette = [COLORS["primary"], COLORS["accent"], COLORS["pass"], COLORS["skip"]]

    fig, ax = plt.subplots(figsize=(7.5, 7.5))
    wedges, texts, autotexts = ax.pie(
        values,
        labels=[f"{l}\n{v} queries" for l, v in zip(labels, values)],
        colors=palette[:len(values)],
        startangle=90,
        autopct="%1.1f%%",
        wedgeprops={"edgecolor": "white", "linewidth": 3},
        textprops={"fontsize": 11, "fontweight": "bold"},
    )
    for at in autotexts:
        at.set_color("white")
    save(fig, "06_benchmark_by_language.png")


# 7. Unit & Integration — duration per case (log scale)
def chart_unit_integration_duration(data: dict) -> None:
    cases = (data.get("unit_integration") or {}).get("cases") or []
    if not cases:
        return
    ids, durations, colors = [], [], []
    for c in cases:
        r = c.get("result") or {}
        if r.get("skipped") or r.get("passed") is None:
            continue
        d = r.get("duration_ms", 0) or 0
        ids.append(c["id"])
        durations.append(max(d, 1))
        if r.get("passed") is True:
            colors.append(COLORS["pass"])
        else:
            colors.append(COLORS["fail"])

    fig, ax = plt.subplots(figsize=(11.5, 5.5))
    bars = ax.bar(ids, durations, color=colors)
    for bar, d in zip(bars, durations):
        ax.text(bar.get_x() + bar.get_width() / 2, d * 1.08,
                f"{d}", ha="center", fontsize=9, fontweight="bold")
    ax.set_yscale("log")
    ax.set_ylabel("Duration (ms, log scale)")
    ax.grid(axis="y", alpha=0.2, which="both")
    ax.legend(handles=[
        Patch(color=COLORS["pass"], label="Pass"),
        Patch(color=COLORS["fail"], label="Fail"),
    ], loc="upper right", frameon=False)
    save(fig, "07_unit_integration_duration.png")


# 8. Transliteration: hits vs expected
def chart_transliteration_hits(data: dict) -> None:
    cases = (data.get("transliteration_accuracy") or {}).get("cases") or []
    if not cases:
        return
    ids = [c["id"] for c in cases]
    hits     = [(c.get("result") or {}).get("hits", 0)           for c in cases]
    expected = [(c.get("result") or {}).get("expected_words", 0) for c in cases]
    ratios   = [(h / e * 100) if e else 0 for h, e in zip(hits, expected)]

    x = np.arange(len(ids))
    width = 0.38
    fig, ax = plt.subplots(figsize=(10.5, 5.5))
    ax.bar(x - width / 2, expected, width, label="Expected words", color=COLORS["muted"])
    ax.bar(x + width / 2, hits,     width, label="Words matched",  color=COLORS["pass"])

    for i, r in enumerate(ratios):
        peak = max(expected[i], hits[i])
        ax.text(i, peak + 0.15, f"{r:.0f}%",
                ha="center", fontsize=9, fontweight="bold", color=COLORS["dark"])

    ax.set_xticks(x)
    ax.set_xticklabels(ids)
    ax.set_ylabel("Word count")
    ax.legend(frameon=False)
    ax.grid(axis="y", alpha=0.2)
    save(fig, "08_transliteration_hits.png")


# 9. Answer accuracy: matched vs expected keywords
def chart_answer_accuracy_keywords(data: dict) -> None:
    cases = (data.get("answer_accuracy") or {}).get("cases") or []
    if not cases:
        return
    ids, matched, total_exp, bar_colors = [], [], [], []
    for c in cases:
        r = c.get("result") or {}
        expected_kws = c.get("expected_contains") or []
        matched_kws  = r.get("matched_keywords") or []
        ids.append(c["id"])
        matched.append(len(matched_kws))
        total_exp.append(len(expected_kws))
        bar_colors.append(COLORS["pass"] if r.get("passed") else COLORS["fail"])

    x = np.arange(len(ids))
    width = 0.38
    fig, ax = plt.subplots(figsize=(12, 5.5))
    ax.bar(x - width / 2, total_exp, width, label="Expected keywords", color=COLORS["muted"])
    ax.bar(x + width / 2, matched,  width, label="Matched keywords",  color=bar_colors)

    ax.set_xticks(x)
    ax.set_xticklabels(ids, rotation=45, ha="right")
    ax.set_ylabel("Keyword count")
    ax.legend(frameon=False)
    ax.grid(axis="y", alpha=0.2)
    save(fig, "09_answer_accuracy_keywords.png")


# 10. Answer accuracy by category (stacked)
def chart_answer_accuracy_by_category(data: dict) -> None:
    cases = (data.get("answer_accuracy") or {}).get("cases") or []
    if not cases:
        return
    by_cat: dict = {}
    for c in cases:
        cat = c.get("category", "Other")
        by_cat.setdefault(cat, {"passed": 0, "failed": 0})
        if (c.get("result") or {}).get("passed"):
            by_cat[cat]["passed"] += 1
        else:
            by_cat[cat]["failed"] += 1

    categories = list(by_cat.keys())
    passed = [by_cat[c]["passed"] for c in categories]
    failed = [by_cat[c]["failed"] for c in categories]

    x = np.arange(len(categories))
    fig, ax = plt.subplots(figsize=(10, 5.5))
    ax.bar(x, passed, 0.55, label="Passed", color=COLORS["pass"])
    ax.bar(x, failed, 0.55, bottom=passed, label="Failed", color=COLORS["fail"])

    for i, (p, f) in enumerate(zip(passed, failed)):
        ax.text(i, p + f + 0.1, f"{p}/{p + f}",
                ha="center", fontweight="bold")

    ax.set_xticks(x)
    ax.set_xticklabels(categories, rotation=12, ha="right")
    ax.set_ylabel("Number of test cases")
    ax.legend(frameon=False)
    ax.grid(axis="y", alpha=0.2)
    save(fig, "10_answer_accuracy_by_category.png")


# 11. Scope restriction — refused vs leaked by language
def chart_scope_by_language(data: dict) -> None:
    cases = (data.get("scope_restriction") or {}).get("cases") or []
    if not cases:
        return
    by_lang: dict = {}
    for c in cases:
        lang = c.get("language", "unknown")
        by_lang.setdefault(lang, {"refused": 0, "leaked": 0})
        r = c.get("result") or {}
        if r.get("refused"):
            by_lang[lang]["refused"] += 1
        else:
            by_lang[lang]["leaked"] += 1

    langs   = list(by_lang.keys())
    refused = [by_lang[l]["refused"] for l in langs]
    leaked  = [by_lang[l]["leaked"]  for l in langs]

    x = np.arange(len(langs))
    fig, ax = plt.subplots(figsize=(8.5, 5.5))
    ax.bar(x, refused, 0.5, label="Correctly refused", color=COLORS["pass"])
    ax.bar(x, leaked,  0.5, bottom=refused, label="Leaked", color=COLORS["fail"])
    for i, (r, l) in enumerate(zip(refused, leaked)):
        ax.text(i, r + l + 0.2, f"{r + l}", ha="center", fontweight="bold")
    ax.set_xticks(x)
    ax.set_xticklabels(langs)
    ax.set_ylabel("Number of off-topic prompts")
    ax.legend(frameon=False)
    ax.grid(axis="y", alpha=0.2)
    save(fig, "11_scope_by_language.png")


# 12. Edge-case outcome donut
def chart_edge_cases_donut(data: dict) -> None:
    cases = (data.get("edge_cases") or {}).get("cases") or []
    if not cases:
        return
    t = tally(cases)
    sizes = [t["passed"], t["failed"]]
    labels = [f"Passed ({t['passed']})", f"Failed ({t['failed']})"]
    colors = [COLORS["pass"], COLORS["fail"]]

    fig, ax = plt.subplots(figsize=(7.5, 7.5))
    wedges, texts, autotexts = ax.pie(
        sizes, labels=labels, colors=colors, startangle=90,
        wedgeprops={"width": 0.42, "edgecolor": "white", "linewidth": 3},
        autopct=lambda p: f"{p:.0f}%" if p > 1 else "",
        pctdistance=0.78,
        textprops={"fontsize": 11, "fontweight": "bold"},
    )
    for at in autotexts:
        at.set_color("white")
    ax.text(0, 0.05, str(sum(sizes)), ha="center", va="center",
            fontsize=46, fontweight="bold", color=COLORS["dark"])
    ax.text(0, -0.13, "edge cases", ha="center", va="center",
            fontsize=11, color=COLORS["dark"])
    save(fig, "12_edge_cases_donut.png")


# 13. Header infographic with the four headline numbers
def chart_summary_infographic(data: dict) -> None:
    total = {"passed": 0, "failed": 0}
    for s in SECTION_LABELS:
        t = tally(data.get(s, {}).get("cases", []))
        for k in total:
            total[k] += t[k]
    grand = sum(total.values())
    rt = (data.get("response_time") or {}).get("result") or {}

    fig, axes = plt.subplots(1, 4, figsize=(15, 4.5))
    cards = [
        (str(grand),                          "Test Cases",  COLORS["primary"]),
        (str(total["passed"]),                "Passed",      COLORS["pass"]),
        (str(total["failed"]),                "Failed",      COLORS["fail"]),
        (f"{rt.get('avg_seconds', '--')}s",   "Avg Latency", COLORS["accent"]),
    ]
    for ax, (value, label, color) in zip(axes, cards):
        ax.text(0.5, 0.62, value, ha="center", va="center",
                fontsize=52, fontweight="bold", color=color,
                transform=ax.transAxes)
        ax.text(0.5, 0.22, label.upper(), ha="center", va="center",
                fontsize=12, fontweight="bold", color=COLORS["dark"],
                transform=ax.transAxes)
        ax.axis("off")
    save(fig, "13_summary_infographic.png")


# 14. Section-by-section heatmap
def chart_section_heatmap(data: dict) -> None:
    sections = list(SECTION_LABELS.keys())
    metrics  = ["Passed", "Failed"]
    matrix   = []
    labels   = []
    for s in sections:
        t = tally(data.get(s, {}).get("cases", []))
        matrix.append([t["passed"], t["failed"]])
        labels.append(SECTION_LABELS[s])
    matrix = np.array(matrix)

    fig, ax = plt.subplots(figsize=(9, 6))
    im = ax.imshow(matrix, cmap="YlGnBu", aspect="auto")
    ax.set_xticks(range(len(metrics)))
    ax.set_xticklabels(metrics)
    ax.set_yticks(range(len(labels)))
    ax.set_yticklabels(labels)
    for i in range(matrix.shape[0]):
        for j in range(matrix.shape[1]):
            val = matrix[i, j]
            color = "white" if val > matrix.max() * 0.55 else COLORS["dark"]
            ax.text(j, i, str(val), ha="center", va="center",
                    fontweight="bold", fontsize=12, color=color)
    fig.colorbar(im, ax=ax, label="Case count", shrink=0.85)
    save(fig, "14_section_heatmap.png")


# Driver
def main() -> int:
    if not EVAL_PATH.exists():
        print(f"evaluation.json not found at {EVAL_PATH}")
        return 1
    print(f"Reading {EVAL_PATH}")
    data = load_data()
    print(f"Writing figures to {OUT_DIR}\n")

    chart_overall_donut(data)
    chart_stacked_bar(data)
    chart_pass_rate(data)
    chart_response_time(data)
    chart_benchmark_categories(data)
    chart_benchmark_languages(data)
    chart_unit_integration_duration(data)
    chart_transliteration_hits(data)
    chart_answer_accuracy_keywords(data)
    chart_answer_accuracy_by_category(data)
    chart_scope_by_language(data)
    chart_edge_cases_donut(data)
    chart_summary_infographic(data)
    chart_section_heatmap(data)

    pngs = sorted(OUT_DIR.glob("*.png"))
    print(f"\nDone. {len(pngs)} figures saved to {OUT_DIR}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
