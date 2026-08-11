from pathlib import Path

from reportlab.lib.colors import HexColor
from reportlab.lib.enums import TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase import pdfmetrics
from reportlab.platypus import HRFlowable, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "output" / "pdf" / "khalid-mohamed-rabe-resume.pdf"
OUTPUT.parent.mkdir(parents=True, exist_ok=True)

BLACK = HexColor("#0D0D0D")
ESPRESSO = HexColor("#2B1F1A")
WALNUT = HexColor("#4A3527")
BRONZE = HexColor("#8B7355")
GOLD = HexColor("#C8A96B")
IVORY = HexColor("#E8DCC0")
SOFT_IVORY = HexColor("#CFC1A5")

styles = getSampleStyleSheet()
name = ParagraphStyle("Name", parent=styles["Title"], fontName="Helvetica-Bold", fontSize=25, leading=27, textColor=IVORY, spaceAfter=3)
role = ParagraphStyle("Role", parent=styles["Normal"], fontName="Helvetica", fontSize=9.5, leading=12, textColor=GOLD)
contact = ParagraphStyle("Contact", parent=styles["Normal"], fontName="Helvetica", fontSize=7.7, leading=11, textColor=SOFT_IVORY, alignment=TA_RIGHT)
heading = ParagraphStyle("Heading", parent=styles["Heading2"], fontName="Helvetica-Bold", fontSize=8.1, leading=10, textColor=GOLD, spaceBefore=6.5, spaceAfter=4, uppercase=True, letterSpacing=.7)
item_title = ParagraphStyle("ItemTitle", parent=styles["Normal"], fontName="Helvetica-Bold", fontSize=9, leading=11.5, textColor=IVORY, spaceAfter=1)
meta = ParagraphStyle("Meta", parent=styles["Normal"], fontName="Helvetica", fontSize=7.5, leading=9.5, textColor=GOLD, spaceAfter=2)
body = ParagraphStyle("Body", parent=styles["Normal"], fontName="Helvetica", fontSize=7.9, leading=10.7, textColor=SOFT_IVORY, spaceAfter=3.5)
small = ParagraphStyle("Small", parent=body, fontSize=7.55, leading=10.2)
skill_title = ParagraphStyle("SkillTitle", parent=item_title, fontSize=8.2, leading=10.5, textColor=IVORY)
skill_body = ParagraphStyle("SkillBody", parent=small, textColor=SOFT_IVORY)


def draw_page(canvas, doc):
    width, height = A4
    canvas.saveState()
    canvas.setFillColor(BLACK)
    canvas.rect(0, 0, width, height, fill=1, stroke=0)
    canvas.setFillColor(ESPRESSO)
    canvas.rect(0, height - 49 * mm, width, 49 * mm, fill=1, stroke=0)
    canvas.setFillColor(GOLD)
    canvas.rect(0, height - 49 * mm, 4 * mm, 49 * mm, fill=1, stroke=0)
    canvas.setFillColor(WALNUT)
    canvas.rect(0, 0, width, 7 * mm, fill=1, stroke=0)
    canvas.setFillColor(GOLD)
    canvas.setFont("Helvetica", 6.5)
    canvas.drawRightString(width - 15 * mm, 3.1 * mm, "KHALID MOHAMED RABE  /  SOFTWARE + AI ENGINEER")
    canvas.restoreState()


doc = SimpleDocTemplate(
    str(OUTPUT), pagesize=A4, rightMargin=15 * mm, leftMargin=15 * mm,
    topMargin=13 * mm, bottomMargin=10 * mm, title="Khalid Mohamed Rabe - Resume",
    author="Khalid Mohamed Rabe", subject="Software and AI engineering resume",
)

story = []
header = Table([
    [Paragraph("Khalid Mohamed Rabe", name), Paragraph("Istanbul, Turkey<br/>lidumoha9@gmail.com<br/>+90 505 761 29 20", contact)],
    [Paragraph("SOFTWARE + AI ENGINEER", role), Paragraph("github.com/KhalidM10<br/>linkedin.com/in/khalid-rabe-668216280", contact)],
], colWidths=[110 * mm, 70 * mm])
header.setStyle(TableStyle([
    ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 0),
    ("TOPPADDING", (0, 0), (-1, -1), 0), ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
]))
story += [header, Spacer(1, 7), HRFlowable(width="100%", thickness=.7, color=BRONZE)]

story += [Paragraph("PROFILE", heading), Paragraph("Software and AI engineer building practical products across web, mobile, and machine learning. Grew up in Nairobi and studied in Istanbul, with a focus on software that works under real user, network, device, and operational constraints.", body)]

story += [Paragraph("SELECTED PROJECTS", heading)]
projects = [
    ("AI document platform", "FastAPI, PostgreSQL, RabbitMQ, Redis, Celery, Docker, Kubernetes", "Designed four independently tested services for OCR, background AI processing, semantic search, authentication, events, and observability. Added local fallbacks so core workflows remain usable without external AI services."),
    ("MedAssist AI", "React 19, TypeScript, FastAPI, PostgreSQL, Docker, AWS", "Built a Kenya-first health guidance and clinic operations platform spanning conservative symptom triage, clinic discovery, appointments, medicine ordering, and administration."),
    ("Water potability model", "Python, pandas, NumPy, scikit-learn", "Compared three classification models across 3,276 water samples. Random Forest reached 67.4% test accuracy; documented limitations and the next validation steps."),
    ("SafariGo", "TypeScript - active private development", "Developing a Kenya-focused intercity bus-booking product covering route discovery, live seat state, passenger details, and booking confirmation."),
]
for title, technology, description in projects:
    story += [Paragraph(title, item_title), Paragraph(technology, meta), Paragraph(description, small)]

story += [
    Paragraph("EXPERIENCE", heading),
    Paragraph("Freelance Software Developer", item_title),
    Paragraph("Self-employed - Remote | 2024-present", meta),
    Paragraph("Deliver web and mobile projects from requirements and architecture through implementation, feedback, and deployment.", body),
    Paragraph("Software Development Intern", item_title),
    Paragraph("Istanbul, Turkey | 2023-2024", meta),
    Paragraph("Contributed within active development cycles using collaborative workflows, code review, maintenance, and agile delivery.", body),
]

story += [
    Paragraph("EDUCATION", heading),
    Paragraph("BSc Software Development", item_title),
    Paragraph("Istanbul Aydin University | Graduated June 2026", meta),
    Paragraph("Coursework included artificial intelligence, machine learning, mobile development, cloud computing, testing, algorithms, and system design.", body),
]

story += [Paragraph("TECHNICAL CAPABILITIES", heading)]
skills = Table([
    [Paragraph("Applied AI &amp; data", skill_title), Paragraph("Python, pandas, NumPy, scikit-learn, embeddings, OCR", skill_body)],
    [Paragraph("Product engineering", skill_title), Paragraph("React, TypeScript, JavaScript, FastAPI, REST APIs", skill_body)],
    [Paragraph("Mobile", skill_title), Paragraph("Flutter, Dart, Kotlin, Android Studio", skill_body)],
    [Paragraph("Systems &amp; delivery", skill_title), Paragraph("PostgreSQL, Docker, RabbitMQ, Redis, GitHub Actions, AWS", skill_body)],
], colWidths=[43 * mm, 137 * mm])
skills.setStyle(TableStyle([
    ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ("BACKGROUND", (0, 0), (-1, -1), ESPRESSO),
    ("LINEABOVE", (0, 0), (-1, -1), .35, WALNUT),
    ("LEFTPADDING", (0, 0), (0, -1), 6), ("LEFTPADDING", (1, 0), (1, -1), 3),
    ("RIGHTPADDING", (0, 0), (-1, -1), 5),
    ("TOPPADDING", (0, 0), (-1, -1), 4), ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
]))
story.append(skills)

doc.build(story, onFirstPage=draw_page, onLaterPages=draw_page)
print(OUTPUT)
