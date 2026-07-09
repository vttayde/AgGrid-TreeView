from pathlib import Path
import re
text = Path('src/App.jsx').read_text(encoding='utf-8')
for i, line in enumerate(text.splitlines(), 1):
    if '<div' in line or '</div>' in line:
        print(f'{i:03d}: {line}')
