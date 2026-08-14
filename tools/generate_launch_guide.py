"""Generate the printable CoachIQ launch guide without external dependencies."""

from pathlib import Path
import re
import textwrap


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "docs" / "CoachIQ-New-Program-Launch-Guide.md"
OUTPUT = ROOT / "docs" / "CoachIQ-New-Program-Launch-Guide.pdf"
PAGE_WIDTH, PAGE_HEIGHT = 612, 792
LEFT, TOP, BOTTOM = 54, 56, 50


def pdf_escape(value):
    return value.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")


def guide_lines():
    result = []
    for raw in SOURCE.read_text().splitlines():
        if raw.startswith("# "):
            result.append(("title", raw[2:]))
        elif raw.startswith("## "):
            result.append(("heading", raw[3:]))
        elif raw.startswith("### "):
            result.append(("subheading", raw[4:]))
        elif raw.startswith("- ") or re.match(r"^\d+\. ", raw):
            result.append(("body", raw.replace("`", "")))
        elif raw.strip():
            result.append(("body", raw.replace("`", "")))
        else:
            result.append(("space", ""))
    return result


def build_pages():
    pages, operations = [], []
    y = PAGE_HEIGHT - TOP

    def new_page():
        nonlocal operations, y
        if operations:
            pages.append("\n".join(operations))
        operations = []
        y = PAGE_HEIGHT - TOP

    def add_line(text, size=9.5, bold=False, color=(0.12, 0.16, 0.23), indent=0, leading=13):
        nonlocal y
        if y < BOTTOM + leading:
            new_page()
        font = "F2" if bold else "F1"
        red, green, blue = color
        operations.append(
            f"BT /{font} {size} Tf {red} {green} {blue} rg "
            f"{LEFT + indent} {y} Td ({pdf_escape(text)}) Tj ET"
        )
        y -= leading

    for kind, text in guide_lines():
        if kind == "space":
            y -= 5
        elif kind == "title":
            add_line(text, 22, True, (0.12, 0.23, 0.37), leading=31)
            add_line("Prepared for program owners and coaching staff", 10, color=(0.38, 0.43, 0.51), leading=24)
        elif kind == "heading":
            y -= 8
            add_line(text, 16, True, (0.12, 0.23, 0.37), leading=24)
        elif kind == "subheading":
            y -= 5
            add_line(text, 12, True, (0.75, 0.42, 0.04), leading=19)
        else:
            indent = 8 if text.startswith("- ") else 0
            width = 86 if indent else 91
            for index, wrapped in enumerate(textwrap.wrap(text, width=width, break_long_words=False) or [""]):
                add_line(wrapped, indent=indent if index == 0 else indent + 10)
    new_page()
    return pages


def write_pdf(pages):
    objects = []

    def add_object(data):
        objects.append(data)
        return len(objects)

    regular_font = add_object("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>")
    bold_font = add_object("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>")
    pages_tree_index = len(objects)
    objects.append("")
    page_ids, content_ids = [], []

    for number, content in enumerate(pages, 1):
        footer = (
            f"BT /F1 8 Tf 0.45 0.49 0.56 rg 54 28 Td "
            f"(CoachIQ New Program Launch Guide  |  Page {number} of {len(pages)}) Tj ET"
        )
        stream = (content + "\n" + footer).encode("latin-1", "replace")
        content_ids.append(add_object(
            f"<< /Length {len(stream)} >>\nstream\n{stream.decode('latin-1')}\nendstream"
        ))
        page_ids.append(add_object(""))

    objects[pages_tree_index] = (
        "<< /Type /Pages /Kids [" + " ".join(f"{page} 0 R" for page in page_ids)
        + f"] /Count {len(page_ids)} >>"
    )
    for page_id, content_id in zip(page_ids, content_ids):
        objects[page_id - 1] = (
            f"<< /Type /Page /Parent {pages_tree_index + 1} 0 R "
            f"/MediaBox [0 0 {PAGE_WIDTH} {PAGE_HEIGHT}] /Resources << /Font << "
            f"/F1 {regular_font} 0 R /F2 {bold_font} 0 R >> >> /Contents {content_id} 0 R >>"
        )
    catalog = add_object(f"<< /Type /Catalog /Pages {pages_tree_index + 1} 0 R >>")

    output = bytearray(b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n")
    offsets = [0]
    for number, data in enumerate(objects, 1):
        offsets.append(len(output))
        output.extend(f"{number} 0 obj\n{data}\nendobj\n".encode("latin-1"))
    xref = len(output)
    output.extend(f"xref\n0 {len(objects) + 1}\n".encode())
    output.extend(b"0000000000 65535 f \n")
    for offset in offsets[1:]:
        output.extend(f"{offset:010d} 00000 n \n".encode())
    output.extend(
        f"trailer\n<< /Size {len(objects) + 1} /Root {catalog} 0 R >>\n"
        f"startxref\n{xref}\n%%EOF\n".encode()
    )
    OUTPUT.write_bytes(output)


if __name__ == "__main__":
    write_pdf(build_pages())
    print(OUTPUT)
