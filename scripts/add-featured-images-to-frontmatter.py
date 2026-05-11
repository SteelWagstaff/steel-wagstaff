import json
import os
import re

report_file = '/home/steelwagstaff/steelwagstaff/scripts/featured-images-report.json'
blog_dir = '/home/steelwagstaff/steelwagstaff/src/content/blog/en'

with open(report_file) as f:
    report = json.load(f)

# Filter to only images that exist
existing_images = [item for item in report if item['exists']]

print(f"Found {len(existing_images)} images that exist on disk")
print("\nProcessing:")

for item in existing_images:
    filepath = os.path.join(blog_dir, item['file'])
    
    if not os.path.exists(filepath):
        print(f"  ✗ {item['file']} (file not found)")
        continue
    
    with open(filepath, 'r') as f:
        content = f.read()
    
    # Check if already has image field
    if 'image:' in content.split('---')[1]:
        print(f"  ⊘ {item['file']} (already has image field)")
        continue
    
    # Add image field to frontmatter
    # Find the end of frontmatter (second ---)
    match = re.match(r'^(---\n.*?\n)---', content, re.DOTALL)
    if not match:
        print(f"  ✗ {item['file']} (invalid frontmatter)")
        continue
    
    frontmatter_end = match.end(1)
    frontmatter = content[:frontmatter_end]
    rest = content[frontmatter_end:]
    
    # Add image field before the closing ---
    new_frontmatter = frontmatter.rstrip() + f"\nimage: {item['image_filename']}\n"
    new_content = new_frontmatter + rest
    
    with open(filepath, 'w') as f:
        f.write(new_content)
    
    print(f"  ✓ {item['file']} → {item['image_filename']}")

print(f"\n✓ Updated {len(existing_images)} blog posts")
