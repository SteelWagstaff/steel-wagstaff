import json
import os
import urllib.request
import urllib.error
import time

report_file = '/home/steelwagstaff/steelwagstaff/scripts/featured-images-report.json'
assets_dir = '/home/steelwagstaff/steelwagstaff/src/assets/blog'

with open(report_file) as f:
    report = json.load(f)

downloaded = 0
failed = 0

for item in report:
    if item['exists']:
        continue
    
    image_path = os.path.join(assets_dir, item['image_filename'])
    url = item['image_url']
    
    try:
        print(f"Downloading {item['image_filename']}...", end=' ')
        urllib.request.urlretrieve(url, image_path)
        print("✓")
        downloaded += 1
        time.sleep(0.5)  # Be polite
    except urllib.error.URLError as e:
        print(f"✗ ({type(e).__name__})")
        failed += 1
    except Exception as e:
        print(f"✗ ({str(e)[:50]})")
        failed += 1

print(f"\n✓ Downloaded: {downloaded}")
print(f"✗ Failed: {failed}")
print(f"Already existed: {len([r for r in report if r['exists']])}")
