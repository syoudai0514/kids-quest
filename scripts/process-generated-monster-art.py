from __future__ import annotations

import argparse
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage


def extract_foreground(image: Image.Image) -> Image.Image:
    rgba = image.convert("RGBA")
    data = np.asarray(rgba).copy()
    if np.min(data[:, :, 3]) < 255:
        return rgba

    rgb = data[:, :, :3].astype(np.int16)
    chroma = rgb.max(axis=2) - rgb.min(axis=2)
    # Some image-generation results paint a gray/white checkerboard instead of
    # returning alpha. Only neutral bright pixels connected to the canvas edge
    # are background, so isolated highlights inside a monster remain opaque.
    candidate = (chroma <= 8) & (rgb.min(axis=2) >= 220)
    labels, _ = ndimage.label(candidate, structure=np.ones((3, 3), dtype=np.uint8))
    edge_labels = np.unique(
        np.concatenate((labels[0, :], labels[-1, :], labels[:, 0], labels[:, -1]))
    )
    edge_labels = edge_labels[edge_labels != 0]
    background = np.isin(labels, edge_labels)
    foreground = ~background

    fg_labels, fg_count = ndimage.label(foreground, structure=np.ones((3, 3), dtype=np.uint8))
    sizes = np.bincount(fg_labels.ravel())
    keep = np.zeros(fg_count + 1, dtype=bool)
    keep[1:] = sizes[1:] >= 64
    foreground = keep[fg_labels]

    alpha = Image.fromarray((foreground * 255).astype(np.uint8), mode="L")
    alpha = alpha.filter(ImageFilter.GaussianBlur(radius=0.45))
    rgba.putalpha(alpha)
    return rgba


def normalize_margin(image: Image.Image, margin_ratio: float = 0.12) -> Image.Image:
    alpha = np.asarray(image.getchannel("A"))
    ys, xs = np.nonzero(alpha > 8)
    if len(xs) == 0:
        raise ValueError("foreground is empty after alpha extraction")
    bbox = (int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1)
    subject = image.crop(bbox)
    canvas_size = max(image.size)
    target = int(round(canvas_size * (1 - 2 * margin_ratio)))
    scale = min(1.0, target / max(subject.size))
    if scale < 1.0:
        subject = subject.resize(
            (max(1, round(subject.width * scale)), max(1, round(subject.height * scale))),
            Image.Resampling.LANCZOS,
        )
    canvas = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    canvas.alpha_composite(subject, ((canvas_size - subject.width) // 2, (canvas_size - subject.height) // 2))
    return canvas


def save_webp(image: Image.Image, path: Path, size: int, max_bytes: int, start_quality: int) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    resized = image.resize((size, size), Image.Resampling.LANCZOS)
    for quality in range(start_quality, 49, -4):
        resized.save(path, "WEBP", quality=quality, method=6)
        if path.stat().st_size <= max_bytes:
            return
    raise ValueError(f"{path} exceeds {max_bytes} bytes at minimum allowed quality")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Normalize one approved generated monster and create app assets."
    )
    parser.add_argument("input", type=Path)
    parser.add_argument("monster_id", help="g042 style immutable monster ID")
    parser.add_argument("--form", choices=("awakening", "giga"))
    args = parser.parse_args()

    repo = Path(__file__).resolve().parents[1]
    source_name = args.monster_id if args.form is None else f"{args.monster_id}-{args.form}"
    image = normalize_margin(extract_foreground(Image.open(args.input)))

    source = repo / "design/monsters/source" / f"{source_name}.png"
    source.parent.mkdir(parents=True, exist_ok=True)
    image.save(source, "PNG", optimize=True)

    if args.form is None:
        save_webp(image, repo / "public/monsters/full" / f"{args.monster_id}.webp", 512, 160_000, 82)
        save_webp(image, repo / "public/monsters/thumb" / f"{args.monster_id}.webp", 192, 30_000, 76)
    else:
        save_webp(image, repo / "public/monsters/forms" / f"{source_name}.webp", 512, 160_000, 82)


if __name__ == "__main__":
    main()
