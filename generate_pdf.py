"""
startup_guide.md -> PDF
"""

import subprocess
import sys
import os

try:
    import markdown
except ImportError:
    subprocess.run([sys.executable, '-m', 'pip', 'install', 'markdown'], check=True)
    import markdown

BASE      = os.path.dirname(os.path.abspath(__file__))
MD_PATH   = os.path.join(BASE, 'startup_guide.md')
HTML_PATH = os.path.join(BASE, 'startup_guide.html')
PDF_PATH  = os.path.join(BASE, 'startup_guide.pdf')

with open(MD_PATH, 'r', encoding='utf-8') as f:
    md_text = f.read()

md   = markdown.Markdown(extensions=['tables', 'fenced_code'])
body = md.convert(md_text)

html = """<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<style>
  @page { margin: 20mm 18mm; }
  body {
    font-family: 'Microsoft JhengHei', 'PingFang TC', 'Noto Sans TC', Arial, sans-serif;
    max-width: 860px; margin: 0 auto; color: #1e293b; line-height: 1.75; font-size: 13px;
  }
  h1 { color: #1e40af; border-bottom: 3px solid #1e40af; padding-bottom: 10px;
       font-size: 22px; margin-bottom: 24px; }
  h2 { color: #1d4ed8; font-size: 16px; margin-top: 32px; margin-bottom: 8px;
       border-left: 4px solid #3b82f6; padding-left: 10px; }
  h3 { color: #2563eb; font-size: 14px; }
  pre { background: #1e293b; color: #e2e8f0; padding: 14px 18px; border-radius: 8px;
        font-family: 'Consolas','Courier New',monospace; font-size: 12px; line-height: 1.5; margin: 10px 0; }
  code { background: #f1f5f9; padding: 2px 6px; border-radius: 4px;
         font-family: 'Consolas','Courier New',monospace; font-size: 12px; color: #0f172a; }
  pre code { background: none; padding: 0; color: inherit; border-radius: 0; }
  table { border-collapse: collapse; width: 100%; margin: 14px 0; font-size: 12px; }
  th { background: #1e40af; color: white; padding: 8px 14px; text-align: left; }
  td { border: 1px solid #cbd5e1; padding: 7px 14px; }
  tr:nth-child(even) td { background: #f8fafc; }
  blockquote { border-left: 4px solid #f59e0b; margin: 12px 0; padding: 8px 16px;
               background: #fffbeb; color: #92400e; border-radius: 0 6px 6px 0; }
  hr { border: none; border-top: 1px solid #e2e8f0; margin: 28px 0; }
  em { color: #64748b; }
</style>
</head>
<body>
""" + body + """
</body>
</html>"""

with open(HTML_PATH, 'w', encoding='utf-8') as f:
    f.write(html)
print('[OK] HTML: ' + HTML_PATH)

browsers = [
    r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe',
    r'C:\Program Files\Microsoft\Edge\Application\msedge.exe',
    r'C:\Program Files\Google\Chrome\Application\chrome.exe',
    r'C:\Program Files (x86)\Google\Chrome\Application\chrome.exe',
]

browser = next((b for b in browsers if os.path.exists(b)), None)

if browser:
    print('Browser: ' + browser)
    subprocess.run([
        browser,
        '--headless', '--disable-gpu', '--no-sandbox',
        '--run-all-compositor-stages-before-draw',
        '--print-to-pdf=' + PDF_PATH,
        '--print-to-pdf-no-header',
        HTML_PATH
    ], capture_output=True, timeout=30)

    if os.path.exists(PDF_PATH):
        size = os.path.getsize(PDF_PATH)
        print('[OK] PDF: ' + PDF_PATH + '  (' + str(size // 1024) + ' KB)')
    else:
        print('[FAIL] PDF not generated. Open HTML and Ctrl+P -> Save as PDF:')
        print('  ' + HTML_PATH)
else:
    print('[FAIL] Edge/Chrome not found. Open HTML and Ctrl+P -> Save as PDF:')
    print('  ' + HTML_PATH)
