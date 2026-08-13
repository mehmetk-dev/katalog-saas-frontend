#!/usr/bin/env python3
"""Generate a formal, non-financial FogCatalog payment receipt sample."""

from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas
from reportlab.platypus import Paragraph


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "output" / "pdf" / "fogcatalog-payment-receipt-sample.pdf"
FONT_DIR = Path("/usr/share/fonts/TTF")

RED = colors.HexColor("#CF1414")
INK = colors.HexColor("#172033")
BODY = colors.HexColor("#334155")
MUTED = colors.HexColor("#64748B")
LINE = colors.HexColor("#CBD5E1")
LIGHT = colors.HexColor("#F8FAFC")
SECTION = colors.HexColor("#EEF1F5")
GREEN = colors.HexColor("#15803D")


def register_fonts() -> None:
    pdfmetrics.registerFont(TTFont("DejaVu", str(FONT_DIR / "DejaVuSans.ttf")))
    pdfmetrics.registerFont(TTFont("DejaVu-Bold", str(FONT_DIR / "DejaVuSans-Bold.ttf")))


def draw_text(
    c: canvas.Canvas,
    text: str,
    x: float,
    y: float,
    size: float,
    *,
    bold: bool = False,
    color=INK,
    right: bool = False,
) -> None:
    c.setFillColor(color)
    c.setFont("DejaVu-Bold" if bold else "DejaVu", size)
    if right:
        c.drawRightString(x, y, text)
    else:
        c.drawString(x, y, text)


def draw_paragraph(
    c: canvas.Canvas,
    text: str,
    x: float,
    y: float,
    width: float,
    *,
    size: float = 8,
    color=BODY,
    leading: float = 12,
    bold: bool = False,
) -> float:
    style = ParagraphStyle(
        "receipt",
        fontName="DejaVu-Bold" if bold else "DejaVu",
        fontSize=size,
        leading=leading,
        textColor=color,
        alignment=TA_LEFT,
    )
    paragraph = Paragraph(text, style)
    _, height = paragraph.wrap(width, 100 * mm)
    paragraph.drawOn(c, x, y - height)
    return height


def draw_section_header(
    c: canvas.Canvas,
    title: str,
    x: float,
    top: float,
    width: float,
) -> float:
    height = 7 * mm
    c.setFillColor(SECTION)
    c.setStrokeColor(LINE)
    c.setLineWidth(0.6)
    c.rect(x, top - height, width, height, fill=1, stroke=1)
    title_upper = title.replace("i", "İ").upper()
    draw_text(c, title_upper, x + 4 * mm, top - 4.6 * mm, 6.2, bold=True, color=BODY)
    return top - height


def draw_summary_strip(c: canvas.Canvas, x: float, top: float, width: float) -> float:
    height = 16 * mm
    column_widths = [width * 0.4, width * 0.3, width * 0.3]
    items = [
        ("Hizmet", "FogCatalog Pro - Yıllık", False),
        ("Dönem", "Yıllık abonelik", False),
        ("Tahsil edilen tutar", "₺10.000,00", True),
    ]

    c.setStrokeColor(LINE)
    c.setLineWidth(0.6)
    c.rect(x, top - height, width, height, fill=0, stroke=1)

    column_x = x
    for index, ((label, value, amount), column_width) in enumerate(zip(items, column_widths)):
        if index:
            c.line(column_x, top, column_x, top - height)
        draw_text(c, label, column_x + 4 * mm, top - 5 * mm, 6.1, color=MUTED)
        draw_text(
            c,
            value,
            column_x + 4 * mm,
            top - 11.3 * mm,
            9.3 if amount else 6.8,
            bold=True,
            color=INK,
        )
        column_x += column_width

    return top - height


def draw_meta_strip(
    c: canvas.Canvas,
    items: list[tuple[str, str]],
    x: float,
    top: float,
    width: float,
) -> float:
    height = 15 * mm
    column_width = width / len(items)

    c.setStrokeColor(LINE)
    c.setLineWidth(0.6)
    c.rect(x, top - height, width, height, fill=0, stroke=1)

    for index, (label, value) in enumerate(items):
        column_x = x + index * column_width
        if index:
            c.line(column_x, top, column_x, top - height)
        draw_text(c, label, column_x + 4 * mm, top - 5 * mm, 6.2, color=MUTED)
        draw_paragraph(
            c,
            value,
            column_x + 4 * mm,
            top - 7.5 * mm,
            column_width - 8 * mm,
            size=6.7,
            leading=8.5,
            bold=True,
            color=GREEN if label == "Ödeme durumu" else INK,
        )

    return top - height


def draw_info_table(
    c: canvas.Canvas,
    rows: list[tuple[str, str]],
    x: float,
    top: float,
    width: float,
    *,
    row_height: float = 7.5 * mm,
    strong_last: bool = False,
) -> float:
    label_width = 49 * mm
    total_height = row_height * len(rows)

    c.setStrokeColor(LINE)
    c.setLineWidth(0.7)
    c.rect(x, top - total_height, width, total_height, fill=0, stroke=1)
    c.line(x + label_width, top, x + label_width, top - total_height)

    for index, (label, value) in enumerate(rows):
        row_top = top - index * row_height
        row_bottom = row_top - row_height

        c.setFillColor(LIGHT)
        c.rect(x, row_bottom, label_width, row_height, fill=1, stroke=0)
        if index:
            c.setStrokeColor(LINE)
            c.line(x, row_top, x + width, row_top)

        draw_text(c, label, x + 4 * mm, row_bottom + 2.6 * mm, 6.6, color=MUTED)
        draw_text(
            c,
            value,
            x + width - 4 * mm,
            row_bottom + 2.6 * mm,
            6.7,
            bold=strong_last and index == len(rows) - 1,
            color=INK,
            right=True,
        )

    return top - total_height


def draw_party_table(c: canvas.Canvas, x: float, top: float, width: float) -> float:
    height = 32 * mm
    column_width = width / 2

    c.setStrokeColor(LINE)
    c.setLineWidth(0.7)
    c.rect(x, top - height, width, height, fill=0, stroke=1)
    c.line(x + column_width, top, x + column_width, top - height)

    parties = [
        (
            "TAHSİLATI YAPAN",
            "Burcu Aldığ",
            [
                "Nilüfer V.D. / 0510559196",
                "23 Nisan Mah. 241. Sk. No: 8 İç Kapı No: 42",
                "Nilüfer / BURSA / TÜRKİYE",
                "+90 545 395 42 03",
                "info@fogcatalog.com",
            ],
        ),
        (
            "ÖDEMEYİ YAPAN",
            "Örnek Teknoloji A.Ş.",
            [
                "muhasebe@example.com",
                "0555 555 55 55",
                "Kadıköy / İstanbul",
            ],
        ),
    ]

    for index, (title, name, lines) in enumerate(parties):
        column_x = x + index * column_width
        draw_text(c, title, column_x + 4 * mm, top - 5.2 * mm, 6, bold=True, color=MUTED)
        draw_text(c, name, column_x + 4 * mm, top - 10.7 * mm, 7.5, bold=True)
        draw_paragraph(
            c,
            "<br/>".join(lines),
            column_x + 4 * mm,
            top - 13.8 * mm,
            column_width - 8 * mm,
            size=5.9,
            leading=7.6,
            color=BODY,
        )

    return top - height


def build_pdf() -> None:
    register_fonts()
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    c = canvas.Canvas(str(OUTPUT), pagesize=A4, pageCompression=1)
    width, height = A4

    c.setTitle("FogCatalog Ödeme Dekontu - Örnek")
    c.setAuthor("FogCatalog")
    c.setSubject("Elektronik tahsilat kayıt belgesi")
    c.setCreator("FogCatalog Billing")
    c.setFillColor(colors.white)
    c.rect(0, 0, width, height, fill=1, stroke=0)

    c.setFillColor(INK)
    c.rect(0, height - 1.6 * mm, width, 1.6 * mm, fill=1, stroke=0)
    c.setFillColor(RED)
    c.rect(width - 38 * mm, height - 2.2 * mm, 38 * mm, 0.6 * mm, fill=1, stroke=0)

    left = 22 * mm
    right = 188 * mm
    content_width = right - left
    top = height - 22 * mm

    draw_text(c, "FOGCATALOG", left, top, 7.2, bold=True, color=RED)
    draw_text(c, "Burcu Aldığ", left, top - 6 * mm, 6.5, bold=True)
    draw_text(c, "Nilüfer V.D. / 0510559196", left, top - 10.5 * mm, 5.8, color=MUTED)
    draw_text(c, "info@fogcatalog.com · www.fogcatalog.com", left, top - 15 * mm, 5.8, color=MUTED)

    draw_text(c, "ÖDEME DEKONTU", right, top, 13.5, bold=True, right=True)
    draw_text(c, "Elektronik tahsilat kayıt belgesi", right, top - 5 * mm, 6, color=MUTED, right=True)
    draw_text(c, "BELGE NO", right - 56 * mm, top - 10.5 * mm, 5.6, color=MUTED)
    draw_text(c, "FC-DK-20260804-ABCDEF1234", right, top - 10.5 * mm, 5.9, bold=True, right=True)
    draw_text(c, "DÜZENLENME", right - 56 * mm, top - 15 * mm, 5.6, color=MUTED)
    draw_text(c, "4 Ağustos 2026 15:30", right, top - 15 * mm, 5.9, bold=True, right=True)
    draw_text(c, "ÖRNEK / MALİ DEĞERİ YOKTUR", right, top - 20.5 * mm, 5.8, bold=True, color=RED, right=True)

    header_line = top - 24 * mm
    c.setStrokeColor(INK)
    c.setLineWidth(1)
    c.line(left, header_line, right, header_line)

    section_y = header_line - 7 * mm
    section_body_top = draw_section_header(c, "Belge Bilgileri", left, section_y, content_width)
    info_bottom = draw_meta_strip(
        c,
        [
            ("Ödeme tarihi", "4 Ağustos 2026 15:30"),
            ("Sipariş numarası", "0b985d28-a27d-4017-bfb7-4e819decd899"),
            ("Ödeme durumu", "Tamamlandı"),
        ],
        left,
        section_body_top,
        content_width,
    )

    section_y = info_bottom - 6 * mm
    section_body_top = draw_section_header(c, "Tahsilat Özeti", left, section_y, content_width)
    summary_bottom = draw_summary_strip(c, left, section_body_top, content_width)

    section_y = summary_bottom - 6 * mm
    section_body_top = draw_section_header(c, "Taraf Bilgileri", left, section_y, content_width)
    parties_bottom = draw_party_table(c, left, section_body_top, content_width)

    section_y = parties_bottom - 6 * mm
    section_body_top = draw_section_header(c, "Ödeme Bilgileri", left, section_y, content_width)
    details_bottom = draw_info_table(
        c,
        [
            ("Ödeme yöntemi", "Kartlı ödeme"),
            ("Ödeme kuruluşu", "Banka Sanal POS"),
            ("Banka işlem referansı", "PAY-123456789"),
        ],
        left,
        section_body_top,
        content_width,
    )

    notice_y = details_bottom - 5 * mm
    notice_height = 15 * mm
    c.setFillColor(LIGHT)
    c.setStrokeColor(LINE)
    c.rect(left, notice_y - notice_height, content_width, notice_height, fill=1, stroke=1)
    draw_paragraph(
        c,
        "<b>Bu belge ödeme kaydını gösterir; fatura veya e-Arşiv fatura yerine geçmez.</b><br/>"
        "Kart numarası, son kullanma tarihi ve güvenlik kodu FogCatalog sistemlerine iletilmez veya kaydedilmez.",
        left + 4 * mm,
        notice_y - 3.5 * mm,
        content_width - 8 * mm,
        size=5.9,
        color=BODY,
        leading=8.2,
    )

    footer_y = 10 * mm
    c.setStrokeColor(LINE)
    c.line(left, footer_y + 7 * mm, right, footer_y + 7 * mm)
    draw_text(
        c,
        "Bu belge doğrulanmış ödeme kaydından elektronik olarak oluşturulmuştur.",
        left,
        footer_y + 1 * mm,
        5.9,
        color=MUTED,
    )
    draw_text(c, "www.fogcatalog.com", right, footer_y + 1 * mm, 6.1, bold=True, right=True)
    draw_text(c, "Sayfa 1 / 1", right, footer_y - 3 * mm, 5.6, color=MUTED, right=True)

    c.showPage()
    c.save()


if __name__ == "__main__":
    build_pdf()
    print(OUTPUT)
