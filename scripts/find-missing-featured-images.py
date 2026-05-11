import json
import os
import subprocess

report_file = '/home/steelwagstaff/steelwagstaff/scripts/featured-images-report.json'
media_exports = '/home/steelwagstaff/steelwagstaff/media-exports'
blog_assets = '/home/steelwagstaff/steelwagstaff/src/assets/blog'

with open(report_file) as f:
    report = json.load(f)

# Filter to images that don't exist
missing = [r for r in report if not r['exists']]

print(f"Checking {len(missing)} missing images in media-exports...\n")

found = 0
for item in missing:
    filename = item['image_filename']
    path = os.path.join(media_exports, filename)
    
    if os.path.exists(path):
        print(f"✓ {filename}")
        found += 1
        # Copy to blog assets
        try:
            subprocess.run(['cp', path, os.path.join(blog_assets, filename)], check=True)
        except:
            print(f"  (but failed to copy)")

print(f"\nFound {found}/{len(missing)} in media-exports")
