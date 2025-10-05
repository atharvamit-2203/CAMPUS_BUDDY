import os
import io
import re
from typing import List, Dict
from PIL import Image

# Optional import: keep runtime safe if not installed
try:
    import pytesseract
except Exception:  # pragma: no cover
    pytesseract = None  # type: ignore

DAY_NAMES = [
    "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
]

TIME_RE = re.compile(r"(?P<start>\d{1,2}[:.]\d{2})\s*[-–]\s*(?P<end>\d{1,2}[:.]\d{2})")
DAY_RE = re.compile(r"^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\b", re.IGNORECASE)


def ocr_image_to_text(image_bytes: bytes, mime_type: str | None = None) -> str:
    """Run OCR locally using Tesseract, if available. Returns recognized text.
    Raises RuntimeError if pytesseract or tesseract binary is not available.
    """
    if pytesseract is None:
        raise RuntimeError("pytesseract not installed. Please add pytesseract to requirements and install Tesseract OCR.")

    t_cmd = os.getenv("TESSERACT_CMD") or os.getenv("TESSERACT_PATH")
    if t_cmd:
        pytesseract.pytesseract.tesseract_cmd = t_cmd  # type: ignore[attr-defined]

    try:
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    except Exception as e:  # pragma: no cover
        raise RuntimeError(f"Unable to open image for OCR: {e}")

    try:
        text = pytesseract.image_to_string(img, lang=os.getenv("TESSERACT_LANG", "eng"))
        return text or ""
    except Exception as e:  # pragma: no cover
        raise RuntimeError(f"Tesseract OCR failed: {e}")


def is_lunch_or_break(subject: str) -> bool:
    """Check if the subject is a lunch break or recess"""
    if not subject:
        return False
    subject_lower = subject.lower().strip()
    break_keywords = ['lunch', 'break', 'recess', 'interval', 'free', 'gap', 'tiffin', 'meal']
    return any(keyword in subject_lower for keyword in break_keywords)

def parse_timetable_text(text: str) -> List[Dict]:
    """Very simple heuristic parser for timetable text.
    Looks for day headings and time ranges on the same or subsequent lines.
    Returns list of rows with keys: day_of_week, start_time, end_time, subject
    """
    rows: List[Dict] = []
    if not text:
        return rows

    # Normalize line endings and collapse multiple spaces
    lines = [re.sub(r"\s+", " ", ln.strip()) for ln in text.splitlines()]

    current_day: str | None = None
    for i, ln in enumerate(lines):
        if not ln:
            continue
        mday = DAY_RE.match(ln)
        if mday:
            # Normalize day capitalization
            d = mday.group(1).capitalize()
            if d in DAY_NAMES:
                current_day = d
            continue

        # Try to detect time range in line
        mtime = TIME_RE.search(ln)
        if mtime:
            start = mtime.group("start").replace(".", ":")
            end = mtime.group("end").replace(".", ":")
            # Subject is rest of line after the time pattern
            subject = ln[mtime.end():].strip(" -•:\t ") or "Class"
            
            # Skip lunch breaks and recess periods
            if is_lunch_or_break(subject):
                continue
                
            rows.append({
                "day_of_week": current_day or infer_day_from_context(lines, i),
                "start_time": normalize_hhmm(start),
                "end_time": normalize_hhmm(end),
                "subject": subject,
            })
            continue

        # If a line looks like just a subject and previous line had time, it will be paired above.

    # Filter out entries without a day
    rows = [r for r in rows if r.get("day_of_week") in DAY_NAMES]
    return rows


def infer_day_from_context(lines: List[str], idx: int) -> str | None:
    # look backward up to 3 lines for a day name
    for j in range(max(0, idx-3), idx):
        m = DAY_RE.match(lines[j])
        if m:
            return m.group(1).capitalize()
    return None


def normalize_hhmm(s: str) -> str:
    # Ensure HH:MM format and fix common OCR issues
    parts = s.split(":")
    if len(parts) >= 2:
        h = int(parts[0]) % 24
        m = int(parts[1]) % 60
        
        # Fix common OCR misinterpretation where 9 AM becomes 21:00
        if h == 21 and m == 0:  # 9 PM -> 9 AM
            h = 9
        elif h == 22 and m == 0:  # 10 PM -> 10 AM  
            h = 10
        elif h == 23 and m == 0:  # 11 PM -> 11 AM
            h = 11
        elif h > 18 and h <= 23:  # Other evening times that might be morning
            potential_morning = h - 12
            if potential_morning >= 7 and potential_morning <= 11:  # 7-11 AM range
                h = potential_morning
        
        return f"{h:02d}:{m:02d}"
    return s