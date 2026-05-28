import re
import os
from pathlib import Path

ROOT = Path('docs/functional_specs')
md_files = sorted([p for p in ROOT.rglob('*.md')])
# Sort by folder name ascending, then filename ascending
md_files = sorted(md_files, key=lambda p: (p.parent.name.lower(), p.name.lower()))

br_counter = 1
files_updated = 0
rules_updated = 0

for path in md_files:
    text = path.read_text(encoding='utf-8')
    if '## 4. Business Rules' not in text:
        continue
    files_updated += 1
    lines = text.splitlines()
    out_lines = []
    i = 0
    changed = False
    while i < len(lines):
        out_lines.append(lines[i])
        if lines[i].strip().startswith('## 4. Business Rules'):
            # copy header lines
            i += 1
            # consume until table header
            while i < len(lines) and '| Activity Step | Rule ID |' not in lines[i]:
                out_lines.append(lines[i])
                i += 1
            if i >= len(lines):
                break
            # now lines[i] is table header
            out_lines.append(lines[i])
            i += 1
            # the separator line
            if i < len(lines) and lines[i].strip().startswith('| :---'):
                out_lines.append(lines[i])
                i += 1
            # now table rows
            while i < len(lines) and lines[i].strip().startswith('|'):
                row = lines[i]
                # parse columns
                parts = row.split('|')
                if len(parts) >= 4:
                    activity = parts[1].strip()
                    old_id = parts[2].strip()
                    desc = parts[3].strip()
                    new_id = f'BR{br_counter:02d}'
                    br_counter += 1
                    rules_updated += 1
                    # if description is N/A or generic, try to make minimal improvement
                    if desc.upper() == 'N/A' or desc.strip().lower() in ('n/a', 'standard read operation for a single concession item.', 'standard read operation for a single genre.', 'typically used for general review feeds or admin moderation.', 'general'):
                        desc = f'Business rule for activity {activity}: behavior must follow the defined sequence and validations for this step.'
                    # reconstruct row preserving trailing pipe
                    new_row = f'| {activity} | {new_id} | {desc} |'
                    out_lines.append(new_row)
                    changed = True
                else:
                    out_lines.append(row)
                i += 1
            continue
        i += 1
    if changed:
        path.write_text('\n'.join(out_lines) + '\n', encoding='utf-8')

print(f'Files processed: {len(md_files)}')
print(f'Files updated: {files_updated}')
print(f'Rules updated: {rules_updated}')
print(f'Final BR number: BR{br_counter-1:02d}')
