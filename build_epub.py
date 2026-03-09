#!/usr/bin/env python3
"""Build EPUB from A Arte do Prompt HTML (Portuguese only)."""

import re
import base64
import html as html_mod
from pathlib import Path
from ebooklib import epub
from html.parser import HTMLParser

SRC = Path(__file__).parent / "prompt-livro-v3 final pre code.html"
OUT = Path(__file__).parent / "A Arte do Prompt - Ryo Penna.epub"

raw = SRC.read_text(encoding="utf-8")

# ── Step 1: Extract ALL base64 images from the full HTML first ────
images = {}   # filename -> bytes
counter = [0]

def replace_b64(m):
    """Replace a single base64 data URI with a local path."""
    mime = m.group(1)
    b64 = m.group(2)
    ext = "png" if "png" in mime else "jpg"
    counter[0] += 1
    fname = f"img_{counter[0]:03d}.{ext}"
    try:
        images[fname] = base64.b64decode(b64)
    except Exception:
        pass
    return f"images/{fname}"

# Process ENTIRE HTML at once — this replaces all data URIs with images/img_NNN.ext
html_clean = re.sub(
    r'data:(image/(?:png|jpeg|jpg));base64,([A-Za-z0-9+/=\s]+)',
    replace_b64,
    raw
)

print(f"📸 Imagens extraídas: {len(images)}")
for fname, data in images.items():
    print(f"   {fname}: {len(data)/1024:.0f} KB")

# ── Step 2: Extract chapters from the cleaned HTML ────────────────
# Now all base64 are replaced with short paths, so regex works reliably

# Cover
cover_match = re.search(
    r'class="page\s+page-cover-main"[^>]*>(.*?)</div>\s*<div\s+class="page',
    html_clean, re.DOTALL
)

# Extract all chapters using a more robust approach:
# Find each page-chapter div and capture everything until the next page div
chapter_starts = list(re.finditer(
    r'<div\s+class="page\s+page-chapter"[^>]*>',
    html_clean
))

# Find all page div starts (for boundaries)
all_page_starts = list(re.finditer(
    r'<div\s+class="page\s+(?:page-[\w-]+)"[^>]*>',
    html_clean
))

# Also find other major sections as boundaries
other_boundaries = list(re.finditer(
    r'<div\s+id="(?:tocSidebar|notebookPanel)"',
    html_clean
))
script_starts = list(re.finditer(r'<script', html_clean))

# Combine all boundary positions
boundary_positions = sorted(
    [m.start() for m in all_page_starts] +
    [m.start() for m in other_boundaries] +
    [m.start() for m in script_starts]
)

chapters_raw = []
for ch_start in chapter_starts:
    start_pos = ch_start.end()  # after the opening tag
    # Find the next boundary AFTER this chapter's start
    next_boundary = len(html_clean)
    for bp in boundary_positions:
        if bp > ch_start.start() + 10:  # skip self
            next_boundary = bp
            break
    chapters_raw.append(html_clean[start_pos:next_boundary])

print(f"📖 Capítulos encontrados: {len(chapters_raw)}")

# Parse chapter components
def parse_chapter(ch_html):
    """Extract number, title, epigraph, content, reflection from chapter HTML."""
    num = ""
    title = ""
    epigraph = ""
    epigraph_author = ""
    content = ""
    reflection = ""
    opener_img = ""

    # Number (h2 tag)
    m = re.search(r'class="opener-number"[^>]*>(.*?)</h2>', ch_html, re.DOTALL)
    if m: num = re.sub(r'<[^>]+>', '', m.group(1)).strip()

    # Title (h3 tag)
    m = re.search(r'class="opener-title"[^>]*>(.*?)</h3>', ch_html, re.DOTALL)
    if m: title = re.sub(r'<[^>]+>', '', m.group(1)).strip()

    # Image — class is "opener-illustration", not "opener-img"
    m = re.search(r'class="opener-illustration"[^>]*>\s*<img[^>]+src="([^"]+)"', ch_html, re.DOTALL)
    if m: opener_img = m.group(1)

    # Epigraph (blockquote tag)
    m = re.search(r'class="epigraph"[^>]*>\s*<p>(.*?)</p>', ch_html, re.DOTALL)
    if m: epigraph = m.group(1).strip()
    m = re.search(r'class="epigraph-author"[^>]*>(.*?)</(?:div|span)>', ch_html, re.DOTALL)
    if m: epigraph_author = re.sub(r'<[^>]+>', '', m.group(1)).strip()

    # Content — grab everything inside chapter-content div
    m = re.search(r'class="chapter-content"[^>]*>(.*)', ch_html, re.DOTALL)
    if m:
        raw_content = m.group(1)
        # Find the matching closing div by counting nesting
        depth = 1
        pos = 0
        while depth > 0 and pos < len(raw_content):
            next_open = raw_content.find('<div', pos)
            next_close = raw_content.find('</div>', pos)
            if next_close == -1:
                break
            if next_open != -1 and next_open < next_close:
                depth += 1
                pos = next_open + 4
            else:
                depth -= 1
                if depth == 0:
                    content = raw_content[:next_close].strip()
                pos = next_close + 6

    # Reflection
    m = re.search(r'class="reflection-question"[^>]*>(.*?)</div>', ch_html, re.DOTALL)
    if m: reflection = re.sub(r'<[^>]+>', '', m.group(1)).strip()

    return {
        'num': num, 'title': title, 'epigraph': epigraph,
        'epigraph_author': epigraph_author, 'content': content,
        'reflection': reflection, 'opener_img': opener_img
    }

chapters = [parse_chapter(ch) for ch in chapters_raw]

# Debug: print chapter titles and image status
for i, ch in enumerate(chapters):
    has_img = "🖼" if ch['opener_img'] else "  "
    print(f"   {has_img} {i:2d}. {ch['num']} — {ch['title'][:50] if ch['title'] else '(sem título)'}")

# ── Build EPUB ─────────────────────────────────────────────────────
book = epub.EpubBook()
book.set_identifier('arte-do-prompt-ryo-penna-2026')
book.set_title('A Arte do Prompt')
book.set_language('pt')
book.add_author('Ryo Penna')

# Metadata
book.add_metadata('DC', 'publisher', 'Ryo Penna')
book.add_metadata('DC', 'date', '2026')
book.add_metadata('DC', 'description', 'Como fazer as perguntas certas para IA, pessoas e si mesmo.')

# CSS
css_content = """
body { font-family: Georgia, serif; line-height: 1.8; color: #1a1a18; margin: 0; padding: 0; }
h1 { font-size: 2em; font-weight: 700; margin: 0.5em 0; letter-spacing: -0.02em; line-height: 1.15; }
h2 { font-size: 1.5em; font-weight: 600; margin: 1.5em 0 0.5em; letter-spacing: -0.01em; }
h3 { font-size: 1.2em; font-weight: 600; margin: 1.2em 0 0.4em; }
p { margin: 0.8em 0; text-align: justify; }
.chapter-num { font-size: 0.75em; letter-spacing: 2px; text-transform: uppercase; color: #888; margin-bottom: 0.3em; }
.chapter-title { font-size: 1.8em; font-weight: 700; line-height: 1.15; margin-bottom: 1em; letter-spacing: -0.02em; }
.epigraph { font-style: italic; color: #666; margin: 1.5em 0; padding-left: 1em; border-left: 2px solid #ccc; }
.epigraph-author { font-size: 0.85em; color: #999; margin-top: 0.3em; }
.reflection { background: #f5f5f0; padding: 1.2em; border-radius: 8px; margin: 2em 0; font-style: italic; color: #555; }
.reflection::before { content: "💭 "; }
.opener-img { text-align: center; margin: 1.5em 0; }
.opener-img img { max-width: 80%; height: auto; }
.opener-illustration { text-align: center; margin: 1.5em 0; }
.opener-illustration img { max-width: 80%; height: auto; }
.divider { text-align: center; margin: 3em 0; page-break-before: always; }
.divider h1 { font-size: 1.6em; letter-spacing: 3px; text-transform: uppercase; color: #333; }
.cover { text-align: center; margin: 0; padding: 0; }
.cover img { max-width: 100%; height: auto; }
img { max-width: 100%; height: auto; }
blockquote { margin: 1em 0; padding: 0.8em 1.2em; border-left: 3px solid #ddd; color: #555; font-style: italic; }
strong { font-weight: 600; }
em { font-style: italic; }
.comparison { margin: 1.5em 0; }
.comparison-card { background: #f8f8f5; padding: 1em; border-radius: 6px; margin: 0.5em 0; }
.prompt-box { background: #f0f0ea; padding: 1em; border-radius: 6px; margin: 1em 0; font-family: monospace; font-size: 0.9em; }
"""

style = epub.EpubItem(uid="style", file_name="style/default.css", media_type="text/css", content=css_content.encode())
book.add_item(style)

spine_items = ['nav']
toc = []

# Part names
parts = {
    0: "Origens do Prompt",
    1: "Anatomia do Prompt",
    2: "Filosofia do Prompt",
    3: "O Que Você (Não) Sabe",
    4: "Prompt na Prática"
}

part_starts = {0: 0, 4: 1, 10: 2, 14: 3, 19: 4}

# ── Cover ──
if cover_match:
    cover_html = cover_match.group(1)
    cover_img_match = re.search(r'<img[^>]+src="(images/[^"]+)"', cover_html)
    if cover_img_match:
        cover_fname = cover_img_match.group(1).replace("images/", "")
        if cover_fname in images:
            book.set_cover("cover.jpg", images[cover_fname])
            print(f"🎨 Capa: {cover_fname}")

# ── Title page ──
title_page = epub.EpubHtml(title='Capa', file_name='title.xhtml', lang='pt')
title_page.content = '''<html><body>
<div class="cover" style="text-align:center;margin-top:2em;">
<h1 style="font-size:2.5em;margin-bottom:0.2em;">A Arte do Prompt</h1>
<p style="font-size:1.1em;color:#666;">Como fazer as perguntas certas para IA, pessoas e si mesmo</p>
<p style="font-size:1.2em;margin-top:1.5em;font-weight:600;">Ryo Penna</p>
</div>
</body></html>'''
title_page.add_item(style)
book.add_item(title_page)
spine_items.append(title_page)

# ── Process chapters ──
for i, ch in enumerate(chapters):
    # Add divider page before the appropriate chapters
    if i in part_starts:
        part_idx = part_starts[i]
        part_name = parts.get(part_idx, f"Parte {part_idx+1}")
        div_page = epub.EpubHtml(
            title=part_name,
            file_name=f'divider_{part_idx}.xhtml',
            lang='pt'
        )
        div_page.content = f'''<html><body>
<div class="divider">
<h1>{part_name.upper()}</h1>
</div>
</body></html>'''
        div_page.add_item(style)
        book.add_item(div_page)
        spine_items.append(div_page)
        toc.append(epub.Section(part_name))

    # Build chapter HTML — images already have clean paths
    opener_img_html = ""
    if ch['opener_img']:
        opener_img_html = f'<div class="opener-img"><img src="{ch["opener_img"]}" alt=""/></div>'

    epigraph_html = ""
    if ch['epigraph']:
        epigraph_html = f'''<div class="epigraph">
<p>{ch["epigraph"]}</p>
<div class="epigraph-author">{ch["epigraph_author"]}</div>
</div>'''

    reflection_html = ""
    if ch['reflection']:
        reflection_html = f'<div class="reflection">{ch["reflection"]}</div>'

    ch_title = ch['title'] or ch['num'] or f"Capítulo {i+1}"

    page = epub.EpubHtml(
        title=ch_title,
        file_name=f'chapter_{i:02d}.xhtml',
        lang='pt'
    )

    page.content = f'''<html><body>
{opener_img_html}
<div class="chapter-num">{ch["num"]}</div>
<div class="chapter-title">{ch["title"]}</div>
{epigraph_html}
<div class="chapter-content">
{ch['content']}
</div>
{reflection_html}
</body></html>'''

    page.add_item(style)
    book.add_item(page)
    spine_items.append(page)
    toc.append(page)

# ── Add images to EPUB ──
for fname, data in images.items():
    media = 'image/png' if fname.endswith('.png') else 'image/jpeg'
    img_item = epub.EpubItem(
        uid=fname.replace('.', '_'),
        file_name=f'images/{fname}',
        media_type=media,
        content=data
    )
    book.add_item(img_item)

# ── Navigation ──
book.toc = toc
book.add_item(epub.EpubNcx())
book.add_item(epub.EpubNav())
book.spine = spine_items

# ── Write ──
epub.write_epub(str(OUT), book)
print(f"\n✅ EPUB gerado: {OUT}")
print(f"   Capítulos: {len(chapters)}")
print(f"   Imagens: {len(images)}")
print(f"   Tamanho: {OUT.stat().st_size / 1024:.0f} KB")
