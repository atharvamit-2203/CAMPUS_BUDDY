"""Utilities to extract and parse canteen menu content from uploaded assets."""

from __future__ import annotations

import io
import logging
import re
from dataclasses import dataclass
from typing import Iterable, List, Optional

from PIL import Image

# Attempt to import pdfplumber lazily
try:  # pragma: no cover - optional dependency pattern
    import pdfplumber  # type: ignore
except Exception:  # pragma: no cover
    pdfplumber = None  # type: ignore

# Optional pytesseract import is handled via existing ocr_fallback helper
try:  # pragma: no cover
    from ocr_fallback import ocr_image_to_text
except Exception:  # pragma: no cover
    ocr_image_to_text = None  # type: ignore

LOGGER = logging.getLogger(__name__)

# Regular expression to capture "Item name - price" or "Item name Rs. 120" patterns.
PRICE_PATTERNS = [
    re.compile(r"^(?P<name>.+?)\s*[-–]\s*₹?(?P<price>\d+[\d.,]*)", re.IGNORECASE),
    re.compile(r"^(?P<name>.+?)\s+₹\s*(?P<price>\d+[\d.,]*)", re.IGNORECASE),
    re.compile(r"^(?P<name>.+?)\s+Rs\.?\s*(?P<price>\d+[\d.,]*)", re.IGNORECASE),
]

CATEGORY_KEYWORDS = {
    "breakfast": ["breakfast", "morning"],
    "lunch": ["lunch", "noon", "meal"],
    "dinner": ["dinner", "evening"],
    "snacks": ["snack", "starter", "quick bite", "chaat", "sandwich", "roll"],
    "beverages": ["drink", "juice", "coffee", "tea", "milkshake", "beverage"]
}


@dataclass
class ParsedMenuItem:
    name: str
    price: float
    description: str = ""
    category: str = "General"
    is_vegetarian: bool = True


class MenuParsingError(RuntimeError):
    """Raised when we fail to parse menu text into items."""


def extract_text_from_pdf_bytes(data: bytes) -> str:
    """Extract text from PDF bytes using pdfplumber.

    Returns an empty string if pdfplumber is unavailable or no text is found.
    """
    if not data:
        return ""

    if pdfplumber is None:  # pragma: no cover - dependency missing at runtime
        raise RuntimeError(
            "pdfplumber is not installed. Please ensure pdfplumber is available to extract PDF text."
        )

    try:
        with pdfplumber.open(io.BytesIO(data)) as pdf:
            text_parts: List[str] = []
            for page in pdf.pages:
                page_text = page.extract_text() or ""
                if page_text:
                    text_parts.append(page_text)
            return "\n".join(text_parts)
    except Exception as exc:  # pragma: no cover
        raise RuntimeError(f"Failed to extract text from PDF: {exc}") from exc


def extract_text_from_image_bytes(data: bytes, mime_type: Optional[str] = None) -> str:
    """Extract text from image bytes using the OCR helper."""
    if not data:
        return ""

    if ocr_image_to_text is None:
        raise RuntimeError(
            "OCR is not configured. Install Tesseract and ensure pytesseract is available."
        )

    return ocr_image_to_text(data, mime_type)


def normalize_price(value: str) -> float:
    """Convert textual price to float."""
    cleaned = value.replace(",", "").strip()
    try:
        return float(cleaned)
    except ValueError:
        LOGGER.debug("Unable to parse price '%s'", value)
        raise


def guess_category(name: str) -> str:
    """Infer a category based on keywords in the item name."""
    lowered = name.lower()
    for category, keywords in CATEGORY_KEYWORDS.items():
        if any(keyword in lowered for keyword in keywords):
            return category
    return "snacks" if any(word in lowered for word in ["puff", "vada", "pakora", "samosa", "fries"]) else "General"


def parse_menu_lines(lines: Iterable[str]) -> List[ParsedMenuItem]:
    """Parse lines of menu text into structured items."""
    items: List[ParsedMenuItem] = []
    for raw_line in lines:
        line = raw_line.strip()
        if not line:
            continue

        match = None
        for pattern in PRICE_PATTERNS:
            match = pattern.match(line)
            if match:
                break

        if not match:
            # Try pattern like "Item name 120" (no symbol)
            tokens = line.split()
            if tokens and tokens[-1].replace(".", "", 1).isdigit():
                name = " ".join(tokens[:-1])
                price_str = tokens[-1]
                try:
                    price = normalize_price(price_str)
                except ValueError:
                    continue
                items.append(
                    ParsedMenuItem(
                        name=name.strip().title(),
                        price=price,
                        category=guess_category(name)
                    )
                )
            continue

        name = (match.group("name") or "").strip()
        price_str = (match.group("price") or "").strip()
        if not name or not price_str:
            continue

        try:
            price = normalize_price(price_str)
        except ValueError:
            continue

        items.append(
            ParsedMenuItem(
                name=name.title(),
                price=price,
                category=guess_category(name)
            )
        )

    return items


def parse_menu_text_to_items(text: str) -> List[ParsedMenuItem]:
    """Convert raw menu text into structured menu items."""
    if not text:
        return []

    lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
    return parse_menu_lines(lines)


def parse_menu_asset(data: bytes, mime_type: str | None) -> List[ParsedMenuItem]:
    """Extract text from the uploaded asset and parse into menu items."""
    if not data:
        return []

    mime = (mime_type or "").lower()
    text = ""

    try:
        if "pdf" in mime:
            text = extract_text_from_pdf_bytes(data)
        elif any(keyword in mime for keyword in ["png", "jpg", "jpeg", "bmp", "gif"]):
            text = extract_text_from_image_bytes(data, mime)
        else:
            # Attempt PDF first as fallback
            try:
                text = extract_text_from_pdf_bytes(data)
            except Exception:
                text = extract_text_from_image_bytes(data, mime)
    except Exception as exc:
        raise MenuParsingError(str(exc)) from exc

    if not text:
        raise MenuParsingError("No text could be extracted from the uploaded menu")

    items = parse_menu_text_to_items(text)
    if not items:
        raise MenuParsingError("Unable to detect menu items in the uploaded file")

    return items