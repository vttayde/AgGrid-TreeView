from pathlib import Path
from collections import Counter
import re
text = Path('src/App.jsx').read_text(encoding='utf-8')
open_div = len(re.findall(r'<div\b', text))
close_div = len(re.findall(r'</div>', text))
open_header = len(re.findall(r'<header\b', text))
close_header = len(re.findall(r'</header>', text))
open_main = len(re.findall(r'<main\b', text))
close_main = len(re.findall(r'</main>', text))
print('div', open_div, close_div)
print('header', open_header, close_header)
print('main', open_main, close_main)
for tag in ['section','aside','span','button','footer','article','form']:
    print(tag, len(re.findall(fr'<{tag}\b', text)), len(re.findall(fr'</{tag}>', text)))
