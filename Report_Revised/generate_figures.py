"""
Generates the four figures kept for the LaTeX report.

Rules applied:
  * No commercial model names (Whisper, GPT-4o-mini, ElevenLabs, Uplift AI)
    anywhere in the figures. Generic stage names only.
  * No em dashes anywhere on the canvas.
  * Use case figure tightened so the text below the user icon does not
    overlap the icon's legs.
  * Activity diagram redrawn with bigger boxes, cleaner branches and a
    consistent vertical rhythm so it is easy to read at print scale.
"""

import os
import matplotlib.pyplot as plt
from matplotlib.patches import (
    FancyBboxPatch, FancyArrowPatch, Rectangle, Ellipse, Polygon, Circle,
)
from matplotlib.lines import Line2D

OUT_DIR = os.path.join(os.path.dirname(__file__), "figures")
os.makedirs(OUT_DIR, exist_ok=True)

# Palette
C_NODE = "#E0E7FF"
C_NODE_DARK = "#4F46E5"
C_NODE2 = "#FEF3C7"
C_NODE2_DARK = "#B45309"
C_NODE3 = "#D1FAE5"
C_NODE3_DARK = "#047857"
C_TEXT = "#111827"
C_LINE = "#374151"


def _new_axes(figsize=(10, 6)):
    fig, ax = plt.subplots(figsize=figsize)
    ax.set_facecolor("white")
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis("off")
    return fig, ax


def _box(ax, x, y, w, h, label, fc=C_NODE, ec=C_NODE_DARK, fontsize=9, weight="normal"):
    box = FancyBboxPatch(
        (x, y), w, h,
        boxstyle="round,pad=0.4,rounding_size=1.2",
        linewidth=1.4, edgecolor=ec, facecolor=fc,
    )
    ax.add_patch(box)
    ax.text(x + w / 2, y + h / 2, label,
            ha="center", va="center", fontsize=fontsize, color=C_TEXT, wrap=True, weight=weight)


def _arrow(ax, x1, y1, x2, y2, label="", style="-|>", color=C_LINE, ls="-", rad=0.0,
           fontsize=8):
    arr = FancyArrowPatch(
        (x1, y1), (x2, y2),
        arrowstyle=style, mutation_scale=14,
        linewidth=1.4, color=color, linestyle=ls,
        connectionstyle=f"arc3,rad={rad}",
    )
    ax.add_patch(arr)
    if label:
        ax.text((x1 + x2) / 2, (y1 + y2) / 2 + 1.2, label,
                ha="center", va="bottom", fontsize=fontsize, color=C_TEXT,
                bbox=dict(facecolor="white", edgecolor="none", pad=1.0))


def save(fig, name):
    path = os.path.join(OUT_DIR, name)
    fig.savefig(path, dpi=220, bbox_inches="tight", facecolor="white")
    plt.close(fig)
    print(f"  wrote {path}")


# ---------------------------------------------------------------------------
# Figure 1. Pipeline architecture (no model names, no em dashes)
# ---------------------------------------------------------------------------
def fig_pipeline():
    fig, ax = _new_axes(figsize=(14, 2.8))
    # Wider canvas + tight vertical crop
    ax.set_xlim(0, 120)
    ax.set_ylim(36, 68)

    stages = [
        ("User\n(Browser Mic)", C_NODE2, C_NODE2_DARK),
        ("Speech to\nText", C_NODE, C_NODE_DARK),
        ("Language\nDetection", C_NODE, C_NODE_DARK),
        ("Knowledge\nRetrieval", C_NODE3, C_NODE3_DARK),
        ("Answer\nGeneration", C_NODE3, C_NODE3_DARK),
        ("Text to\nSpeech", C_NODE, C_NODE_DARK),
        ("Audio + Text\nto User", C_NODE2, C_NODE2_DARK),
    ]
    n = len(stages)

    # Bigger gap between boxes so the arrows have room to breathe.
    box_w, box_h = 12, 14
    gap = 4.5
    total = n * box_w + (n - 1) * gap
    start = (120 - total) / 2
    y = 45
    cy = y + box_h / 2

    centers = []
    for i, (label, fc, ec) in enumerate(stages):
        x = start + i * (box_w + gap)
        # Match the activity-diagram styling: linewidth 1.8, rounding 1.8.
        ax.add_patch(FancyBboxPatch(
            (x, y), box_w, box_h,
            boxstyle="round,pad=0.5,rounding_size=1.8",
            linewidth=1.8, edgecolor=ec, facecolor=fc,
        ))
        ax.text(x + box_w / 2, cy, label,
                ha="center", va="center",
                fontsize=10, weight="bold", color=C_TEXT)
        centers.append((x + box_w / 2, cy))

    # Polished arrows between adjacent boxes (mutation_scale 18, linewidth 1.6)
    for i in range(n - 1):
        x1 = centers[i][0] + box_w / 2
        x2 = centers[i + 1][0] - box_w / 2
        ax.add_patch(FancyArrowPatch(
            (x1, cy), (x2, cy),
            arrowstyle="-|>", mutation_scale=18,
            linewidth=1.6, color=C_LINE,
        ))

    save(fig, "fig1_pipeline_architecture.png")


# ---------------------------------------------------------------------------
# Figure 2. Use case diagram
# Styled to match the activity diagram: thicker strokes (1.8), bigger fonts,
# larger ellipses, title at fontsize 15.
# ---------------------------------------------------------------------------
def fig_use_case():
    fig, ax = plt.subplots(figsize=(12, 9))
    ax.set_facecolor("white")
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis("off")

    # System boundary
    ax.add_patch(Rectangle(
        (22, 6), 56, 86,
        fill=False, edgecolor=C_LINE, linewidth=1.8,
    ))
    ax.text(50, 90, "Mahir on Call System",
            ha="center", fontsize=12, weight="bold", color=C_TEXT)

    # Use case ellipses (matching the round-box look of the activity diagram)
    use_cases = [
        (50, 81, "Start Voice\nConversation"),
        (50, 72, "Submit Text\nQuery"),
        (50, 63, "Receive Audio\nand Text Answer"),
        (50, 54, "Interrupt\nPlayback"),
        (50, 45, "Replay Past\nResponse"),
        (50, 36, "View Live\nTranscript"),
        (50, 24, "Login to\nAdmin Panel"),
        (50, 13, "Upload Knowledge\nBase File"),
    ]
    for (x, y, label) in use_cases:
        e = Ellipse(
            (x, y), 30, 7.5,
            facecolor=C_NODE, edgecolor=C_NODE_DARK, linewidth=1.8,
        )
        ax.add_patch(e)
        ax.text(x, y, label,
                ha="center", va="center",
                fontsize=10, weight="bold", color=C_TEXT)

    # Stick-figure actor (UML), rendered with the heavier line weight used in
    # the activity diagram.
    def actor(cx, cy, lines):
        lw = 1.8
        # head
        ax.add_patch(Circle(
            (cx, cy + 4.5), 1.8,
            facecolor="white", edgecolor=C_LINE, linewidth=lw,
        ))
        # body
        ax.add_line(Line2D([cx, cx], [cy + 2.7, cy - 3.5],
                           color=C_LINE, linewidth=lw))
        # arms
        ax.add_line(Line2D([cx - 3.4, cx + 3.4], [cy + 0.5, cy + 0.5],
                           color=C_LINE, linewidth=lw))
        # legs
        ax.add_line(Line2D([cx, cx - 2.6], [cy - 3.5, cy - 8],
                           color=C_LINE, linewidth=lw))
        ax.add_line(Line2D([cx, cx + 2.6], [cy - 3.5, cy - 8],
                           color=C_LINE, linewidth=lw))
        # caption sits well clear of the legs
        line_height = 2.2
        for i, txt in enumerate(lines):
            ax.text(cx, cy - 10 - i * line_height, txt,
                    ha="center", va="top",
                    fontsize=11, weight="bold", color=C_TEXT)

    actor(10, 58, ["User", "(Applicant or", "Parent)"])
    actor(90, 22, ["Administrator"])

    # Polished arrows (matching the activity diagram style: thick stroke,
    # filled arrowhead, mutation_scale 18). Arrows point from each actor
    # into the use case ellipse they invoke.
    def link(x1, y1, x2, y2):
        ax.add_patch(FancyArrowPatch(
            (x1, y1), (x2, y2),
            arrowstyle="-|>", mutation_scale=16,
            linewidth=1.6, color=C_LINE,
        ))

    # User -> top six use cases
    for (ux, uy, _) in use_cases[:6]:
        link(13.0, 58, ux - 15, uy)
    # Administrator -> bottom two use cases
    for (ux, uy, _) in use_cases[6:]:
        link(87.0, 22, ux + 15, uy)

    save(fig, "fig2_use_case_diagram.png")


# ---------------------------------------------------------------------------
# Figure 3. Activity diagram (enhanced for clarity)
# ---------------------------------------------------------------------------
def fig_activity():
    """Cleaner activity diagram. Uniform horizontal layout, big fonts,
    explicit Yes / No labels on the decision branches, generic stage names."""
    fig, ax = plt.subplots(figsize=(9, 13))
    ax.set_facecolor("white")
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis("off")

    ax.text(50, 98, "Activity Diagram: Voice Query Flow",
            ha="center", fontsize=14, weight="bold", color=C_TEXT)

    # Helpers tuned for this figure
    def round_box(x, y, w, h, label, fc=C_NODE, ec=C_NODE_DARK, fontsize=11, weight="bold"):
        box = FancyBboxPatch(
            (x, y), w, h,
            boxstyle="round,pad=0.5,rounding_size=1.6",
            linewidth=1.6, edgecolor=ec, facecolor=fc,
        )
        ax.add_patch(box)
        ax.text(x + w / 2, y + h / 2, label,
                ha="center", va="center", fontsize=fontsize, weight=weight, color=C_TEXT)

    def diamond(cx, cy, w, h, label, fontsize=10):
        pts = [(cx, cy + h / 2), (cx + w / 2, cy),
               (cx, cy - h / 2), (cx - w / 2, cy)]
        ax.add_patch(Polygon(pts, closed=True, facecolor=C_NODE2,
                             edgecolor=C_NODE2_DARK, linewidth=1.6))
        ax.text(cx, cy, label, ha="center", va="center",
                fontsize=fontsize, weight="bold", color=C_TEXT)

    def arrow(x1, y1, x2, y2, label="", color=C_LINE, ls="-",
              rad=0.0, fontsize=9, label_dx=0, label_dy=0):
        arr = FancyArrowPatch(
            (x1, y1), (x2, y2),
            arrowstyle="-|>", mutation_scale=18,
            linewidth=1.6, color=color, linestyle=ls,
            connectionstyle=f"arc3,rad={rad}",
        )
        ax.add_patch(arr)
        if label:
            mx, my = (x1 + x2) / 2, (y1 + y2) / 2
            ax.text(mx + label_dx, my + label_dy, label,
                    ha="center", va="center", fontsize=fontsize, weight="bold",
                    bbox=dict(facecolor="white", edgecolor="none", pad=1.5))

    # Start node (filled circle)
    ax.add_patch(Circle((50, 93), 1.8, facecolor=C_LINE, edgecolor=C_LINE))

    # Top-of-page activity boxes (centred)
    boxes = [
        (25, 84, 50, 6, "User clicks the microphone"),
        (25, 75, 50, 6, "Browser captures audio"),
        (25, 66, 50, 6, "Frontend sends audio to backend"),
        (25, 57, 50, 6, "Backend transcribes the audio"),
    ]
    for (x, y, w, h, label) in boxes:
        round_box(x, y, w, h, label)

    # Decision diamond
    diamond(50, 47, 46, 12, "Detected language?")

    # Two branches (Urdu left, English right)
    round_box(6, 32, 30, 6, "Use Urdu prompt", fc=C_NODE3, ec=C_NODE3_DARK)
    round_box(64, 32, 30, 6, "Use English prompt", fc=C_NODE3, ec=C_NODE3_DARK)

    # Merge node (small diamond) at y = 24
    merge_pts = [(50, 27), (53, 24), (50, 21), (47, 24)]
    ax.add_patch(Polygon(merge_pts, closed=True, facecolor="white",
                         edgecolor=C_LINE, linewidth=1.4))

    # Common downstream activities
    round_box(20, 13, 60, 6, "Search knowledge base for top matches")
    round_box(20, 4,  60, 6, "Generate the answer using the matches")

    # Lower half of the figure (we use negative-ish y by adjusting limits below)
    # to avoid overlap, tile two more boxes inside the existing space:
    # Actually we will place TTS and Reply outside the 0-100 grid by
    # extending the lower bound. Use a second pass:

    save(fig, "fig3_activity_diagram_partial.png")  # debug placeholder if needed


# Re-implement with extended canvas so all eight steps fit cleanly.
def fig_activity():  # noqa: F811
    fig, ax = plt.subplots(figsize=(9, 14.5))
    ax.set_facecolor("white")
    # Use a taller virtual canvas so we have room for 9 vertical positions.
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 130)
    ax.axis("off")

    def round_box(x, y, w, h, label, fc=C_NODE, ec=C_NODE_DARK, fontsize=11, weight="bold"):
        ax.add_patch(FancyBboxPatch(
            (x, y), w, h,
            boxstyle="round,pad=0.5,rounding_size=1.8",
            linewidth=1.8, edgecolor=ec, facecolor=fc,
        ))
        ax.text(x + w / 2, y + h / 2, label,
                ha="center", va="center", fontsize=fontsize, weight=weight, color=C_TEXT)

    def diamond(cx, cy, w, h, label, fontsize=11):
        pts = [(cx, cy + h / 2), (cx + w / 2, cy),
               (cx, cy - h / 2), (cx - w / 2, cy)]
        ax.add_patch(Polygon(pts, closed=True, facecolor=C_NODE2,
                             edgecolor=C_NODE2_DARK, linewidth=1.8))
        ax.text(cx, cy, label, ha="center", va="center",
                fontsize=fontsize, weight="bold", color=C_TEXT)

    def arrow(x1, y1, x2, y2, label="", color=C_LINE, ls="-",
              rad=0.0, fontsize=10, label_dx=0, label_dy=0):
        arr = FancyArrowPatch(
            (x1, y1), (x2, y2),
            arrowstyle="-|>", mutation_scale=18,
            linewidth=1.6, color=color, linestyle=ls,
            connectionstyle=f"arc3,rad={rad}",
        )
        ax.add_patch(arr)
        if label:
            mx, my = (x1 + x2) / 2, (y1 + y2) / 2
            ax.text(mx + label_dx, my + label_dy, label,
                    ha="center", va="center", fontsize=fontsize, weight="bold",
                    color="#1F2937",
                    bbox=dict(facecolor="white", edgecolor="none", pad=1.5))

    # Layout on the 0-130 vertical canvas
    # y values from top to bottom
    BOX_W = 56
    BOX_H = 7
    BOX_X = (100 - BOX_W) / 2

    # Start node
    ax.add_patch(Circle((50, 121), 2.0, facecolor=C_LINE, edgecolor=C_LINE))

    # Top stack
    steps_top = [
        (113, "User clicks the microphone"),
        (104, "Browser captures audio"),
        ( 95, "Frontend sends audio to backend"),
        ( 86, "Backend transcribes the audio"),
    ]
    for (y, label) in steps_top:
        round_box(BOX_X, y, BOX_W, BOX_H, label)

    # Decision diamond
    diamond(50, 75, 50, 12, "Detected language?")

    # Branches
    round_box(8, 60, 32, BOX_H, "Use Urdu prompt", fc=C_NODE3, ec=C_NODE3_DARK)
    round_box(60, 60, 32, BOX_H, "Use English prompt", fc=C_NODE3, ec=C_NODE3_DARK)

    # Merge node
    merge_y = 51
    merge_pts = [(50, merge_y + 3), (53, merge_y), (50, merge_y - 3), (47, merge_y)]
    ax.add_patch(Polygon(merge_pts, closed=True, facecolor="white",
                         edgecolor=C_LINE, linewidth=1.5))

    # Bottom stack
    steps_bottom = [
        (40, "Search knowledge base for the top matches"),
        (29, "Generate the answer using the matches"),
        (18, "Convert the answer text into speech"),
        (7,  "Frontend plays the audio and shows the bubble"),
    ]
    for (y, label) in steps_bottom:
        round_box(BOX_X, y, BOX_W, BOX_H, label)

    # End node (concentric circle)
    ax.add_patch(Circle((50, -1), 2.4, facecolor="white", edgecolor=C_LINE, linewidth=1.8))
    ax.add_patch(Circle((50, -1), 1.2, facecolor=C_LINE, edgecolor=C_LINE))

    # ---- arrows ----
    # Helper for vertical arrow inside the central column
    def vdown(y_top_box, y_bot_box, top_h=BOX_H):
        x = 50
        arrow(x, y_top_box, x, y_bot_box + top_h)

    # start -> first
    arrow(50, 119, 50, 113 + BOX_H)
    # first -> second -> third -> fourth
    arrow(50, 113, 50, 104 + BOX_H)
    arrow(50, 104, 50, 95 + BOX_H)
    arrow(50, 95, 50, 86 + BOX_H)
    # fourth -> diamond
    arrow(50, 86, 50, 81)

    # diamond -> Urdu (left) labelled Urdu
    arrow(36, 75, 24, 67, label="Urdu", label_dx=-2, label_dy=2, rad=-0.15)
    # diamond -> English (right) labelled English
    arrow(64, 75, 76, 67, label="English", label_dx=2, label_dy=2, rad=0.15)

    # Urdu / English -> merge node
    arrow(24, 60, 47, merge_y, rad=-0.2)
    arrow(76, 60, 53, merge_y, rad=0.2)

    # merge -> bottom stack
    arrow(50, merge_y - 3, 50, 40 + BOX_H)
    arrow(50, 40, 50, 29 + BOX_H)
    arrow(50, 29, 50, 18 + BOX_H)
    arrow(50, 18, 50, 7 + BOX_H)
    # last -> end
    arrow(50, 7, 50, 1.4)

    save(fig, "fig3_activity_diagram.png")


# ---------------------------------------------------------------------------
# Figure 4. Frontend state diagram
# Styled to match the activity diagram: thicker strokes (1.8), bigger fonts,
# larger arrows (mutation_scale 18), white-bg label boxes, title at fontsize
# 15.  Layout is spaced out so labels never collide with state boxes.
# ---------------------------------------------------------------------------
def fig_state_diagram():
    fig, ax = plt.subplots(figsize=(13, 8.5))
    ax.set_facecolor("white")
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis("off")

    BOX_HW = 8     # half width
    BOX_HH = 5     # half height
    states = {
        "idle":       (12, 50),
        "listening":  (35, 82),
        "processing": (75, 82),
        "responding": (92, 50),
        "error":      (52, 14),
    }

    # Draw state boxes
    for name, (x, y) in states.items():
        ax.add_patch(FancyBboxPatch(
            (x - BOX_HW, y - BOX_HH), 2 * BOX_HW, 2 * BOX_HH,
            boxstyle="round,pad=0.5,rounding_size=1.8",
            facecolor=C_NODE, edgecolor=C_NODE_DARK, linewidth=1.8,
        ))
        ax.text(x, y, name,
                ha="center", va="center",
                fontsize=12, weight="bold", color=C_TEXT)

    # Initial state indicator
    ax.add_patch(Circle((3, 50), 1.6, facecolor=C_LINE, edgecolor=C_LINE))
    ax.add_patch(FancyArrowPatch(
        (4.6, 50), (12 - BOX_HW, 50),
        arrowstyle="-|>", mutation_scale=18,
        linewidth=1.6, color=C_LINE,
    ))

    # Helper. Each transition is drawn between explicit start and end points
    # so we can place the label exactly where it reads cleanly.
    def edge(p1, p2, rad=0.0):
        ax.add_patch(FancyArrowPatch(
            p1, p2,
            arrowstyle="-|>", mutation_scale=18,
            linewidth=1.6, color=C_LINE,
            connectionstyle=f"arc3,rad={rad}",
        ))

    def label_at(x, y, text):
        ax.text(x, y, text,
                ha="center", va="center",
                fontsize=10, weight="bold", color=C_TEXT,
                bbox=dict(facecolor="white", edgecolor="none", pad=2.5))

    # ---- 1. idle -> listening (press mic) ----
    edge((20, 53), (28, 78))
    label_at(20.5, 68, "press mic")

    # ---- 2. listening -> processing (release mic or 30 s) ----
    edge((43, 82), (67, 82))
    label_at(55, 86.5, "release mic or 30 s")

    # ---- 3. processing -> responding (API success) ----
    edge((83, 78), (90, 56))
    label_at(91, 70, "API success")

    # ---- 4. responding -> idle (audio finished) ----
    # Big arc above the centre line so it does not collide with the labels
    # used by the listening / processing edges.
    edge((84, 50), (20, 50), rad=-0.1)
    label_at(52, 56, "audio finished")

    # ---- 5. listening -> error (mic denied) ----
    edge((33, 77), (48, 19))
    label_at(33, 45, "mic denied")

    # ---- 6. processing -> error (API timeout) ----
    edge((72, 77), (56, 19))
    label_at(72, 45, "API timeout")

    # ---- 7. error -> idle (user dismiss) ----
    edge((44, 14), (15, 45))
    label_at(28, 26, "user dismiss")

    # ---- 8. responding -> listening (user interrupt) ----
    # Curves under the mid line so it is clearly distinct from "audio
    # finished".  Label sits on the curve.
    edge((90, 56), (40, 78), rad=-0.35)
    label_at(66, 60, "user interrupt")

    save(fig, "fig4_state_diagram.png")


def main():
    print("Generating figures...")
    fig_pipeline()
    fig_use_case()
    fig_activity()
    fig_state_diagram()
    print("Done.")


if __name__ == "__main__":
    main()
