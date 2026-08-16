from __future__ import annotations

import hashlib
import importlib.util
import sys
import tempfile
import unittest
from pathlib import Path

import numpy as np
from PIL import Image

sys.dont_write_bytecode = True
converter_path = Path(__file__).with_name("process-generated-monster-art.py")
converter_spec = importlib.util.spec_from_file_location("monster_art_converter", converter_path)
assert converter_spec is not None and converter_spec.loader is not None
converter = importlib.util.module_from_spec(converter_spec)
converter_spec.loader.exec_module(converter)
extract_foreground = converter.extract_foreground
normalize_margin = converter.normalize_margin
save_webp = converter.save_webp


class MonsterArtConverterTest(unittest.TestCase):
    def test_existing_alpha_is_preserved(self) -> None:
        pixels = np.zeros((32, 32, 4), dtype=np.uint8)
        pixels[:, :, :3] = (30, 90, 180)
        pixels[8:24, 8:24, 3] = 173
        source = Image.fromarray(pixels, "RGBA")

        actual = np.asarray(extract_foreground(source))

        np.testing.assert_array_equal(actual, pixels)

    def test_checkerboard_background_is_removed_and_margin_normalized(self) -> None:
        size = 128
        yy, xx = np.indices((size, size))
        checker = np.where(((xx // 8 + yy // 8) % 2)[..., None] == 0, 238, 248)
        pixels = np.repeat(checker.astype(np.uint8), 3, axis=2)
        pixels[28:100, 38:90] = (220, 50, 80)
        source = Image.fromarray(pixels, "RGB")

        extracted = extract_foreground(source)
        alpha = np.asarray(extracted.getchannel("A"))
        self.assertEqual(int(alpha[0, 0]), 0)
        self.assertGreater(int(alpha[64, 64]), 245)

        normalized = normalize_margin(extracted)
        alpha = np.asarray(normalized.getchannel("A"))
        ys, xs = np.nonzero(alpha > 8)
        margins = (xs.min(), ys.min(), size - 1 - xs.max(), size - 1 - ys.max())
        self.assertTrue(all(margin / size >= 0.115 for margin in margins), margins)

    def test_webp_output_is_decodable_and_byte_deterministic(self) -> None:
        image = Image.new("RGBA", (128, 128), (0, 0, 0, 0))
        pixels = np.asarray(image).copy()
        pixels[24:104, 32:96] = (40, 160, 220, 255)
        image = Image.fromarray(pixels, "RGBA")
        temporary_root = Path(__file__).resolve().parents[1] / "tmp"
        temporary_root.mkdir(parents=True, exist_ok=True)

        with tempfile.TemporaryDirectory(dir=temporary_root) as directory:
            first = Path(directory) / "first.webp"
            second = Path(directory) / "second.webp"
            save_webp(image, first, 64, 30_000, 82)
            save_webp(image, second, 64, 30_000, 82)

            first_bytes = first.read_bytes()
            second_bytes = second.read_bytes()
            self.assertEqual(hashlib.sha256(first_bytes).digest(), hashlib.sha256(second_bytes).digest())
            with Image.open(first) as decoded:
                decoded.load()
                self.assertEqual(decoded.size, (64, 64))
                self.assertEqual(decoded.mode, "RGBA")


if __name__ == "__main__":
    unittest.main()
