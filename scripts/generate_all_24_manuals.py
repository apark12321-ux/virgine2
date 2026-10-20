# scripts/generate_all_24_manuals.py
import json
import os
import re

def clean_korean_len(text):
    # Remove markdown formatting characters, html tags, and whitespaces
    s = re.sub(r'<[^>]+>', '', text)
    s = re.sub(r'[*#_`|>-]', '', s)
    return len("".join(s.split()))

# We will define each of the 24 articles with complete high-density content.
# All articles follow the strict manual structure:
# 1. 3-line summary blockquote
# 2. <h2> section 1 + <h3> subheadings
# 3. <h2> section 2 + <h3> subheadings
# 4. <h2> section 3 + Markdown Table
# 5. <h2> section 4 + <h3> subheadings
# 6. <h2> 자주 묻는 질문 (FAQ) with 3 Q&A
# 7. <h2> 결론 및 점검 수칙
# No images, No links. Official manual tone.

print("Starting generation of 24 High-Density Appliance Manual Articles...")
