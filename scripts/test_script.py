import json
import re

with open('all_post_targets.json', 'r', encoding='utf-8') as f:
    targets = json.load(f)

print(f"Loaded {len(targets)} targets.")
