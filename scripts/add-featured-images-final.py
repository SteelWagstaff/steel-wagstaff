import json
import os
import re

report_file = '/home/steelwagstaff/steelwagstaff/scripts/featured-images-report.json'
blog_dir = '/home/steelwagstaff/steelwagstaff/src/content/blog/en'

with open(report_file) as f:
    report = json.load(f)

updated = 0

for item in report:
    filepath = os.path.join(blog_dir, item['file'])
    
    if not os.path.exists(filepath):
        continue
    
    with open(filepath, 'r') as f:
        content = f.read()
    
    # Check if already has image field
    if 'image:' in content.split('---')[1]:
        continue
    
    # Add image field to frontmatter
    match = re.match(r'^(---\n.*?\n)---', content, re.DOTALL)
    if not match:
        continue
    
    frontmatter_end = match.end(1)
    frontmatter = content[:frontmatter_end]
    rest = content[frontmatter_end:]
    
    # Add image field before the closing ---
    new_frontmatter = frontmatter.rstrip() + f"\nimage: {item['image_filename']}\n"
    new_content = new_frontmatter + rest
    
    with open(filepath, 'w') as f:
        f.write(new_content)
    
    updated += 1

print(f"✓ Updated {updated} blog posts with featured images")
