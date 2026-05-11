import xml.etree.ElementTree as ET
import os
import json

xml_file = '/home/steelwagstaff/steelwagstaff/steelwagstaff.WordPress.2026-04-24.xml'
blog_dir = '/home/steelwagstaff/steelwagstaff/src/content/blog/en'
assets_dir = '/home/steelwagstaff/steelwagstaff/src/assets/blog'

# Parse XML
tree = ET.parse(xml_file)
root = tree.getroot()

# Define namespaces
namespaces = {
    'wp': 'http://wordpress.org/export/1.2/',
    'content': 'http://purl.org/rss/1.0/modules/content/'
}

# Maps
attachments = {}  # attachment_id -> url
post_featured_images = {}  # post_id -> thumbnail_id
post_info = {}  # post_id -> {title, slug}

# Extract all items
for item in root.findall('.//item'):
    post_type_elem = item.find('wp:post_type', namespaces)
    if post_type_elem is None:
        continue
    
    post_type = post_type_elem.text
    post_id = item.find('wp:post_id', namespaces).text
    
    if post_type == 'attachment':
        url_elem = item.find('wp:attachment_url', namespaces)
        if url_elem is not None and url_elem.text:
            attachments[post_id] = url_elem.text
    
    elif post_type == 'post':
        title_elem = item.find('title')
        slug_elem = item.find('wp:post_name', namespaces)
        
        title = title_elem.text if title_elem is not None else ''
        slug = slug_elem.text if slug_elem is not None else ''
        
        post_info[post_id] = {'title': title, 'slug': slug}
        
        # Find thumbnail meta
        for postmeta in item.findall('wp:postmeta', namespaces):
            key_elem = postmeta.find('wp:meta_key', namespaces)
            value_elem = postmeta.find('wp:meta_value', namespaces)
            
            if key_elem is not None and key_elem.text == '_thumbnail_id':
                if value_elem is not None and value_elem.text:
                    post_featured_images[post_id] = value_elem.text

# Now match with blog files
report = []
for filename in os.listdir(blog_dir):
    if not filename.endswith('.md'):
        continue
    
    filepath = os.path.join(blog_dir, filename)
    with open(filepath, 'r') as f:
        content = f.read()
    
    # Parse frontmatter
    if not content.startswith('---'):
        continue
    
    end_fm = content.find('---', 3)
    if end_fm == -1:
        continue
    
    frontmatter = content[3:end_fm]
    
    # Extract title
    title_match = None
    for line in frontmatter.split('\n'):
        if line.startswith('title:'):
            title_match = line.split('"')[1] if '"' in line else line.split("'")[1] if "'" in line else ''
            break
    
    if not title_match:
        continue
    
    has_image = 'image:' in frontmatter
    
    # Find in WordPress
    image_filename = None
    for pid, info in post_info.items():
        if info['title'] == title_match:
            if pid in post_featured_images:
                thumb_id = post_featured_images[pid]
                if thumb_id in attachments:
                    url = attachments[thumb_id]
                    image_filename = url.split('/')[-1].split('?')[0]
                    image_path = os.path.join(assets_dir, image_filename)
                    exists = os.path.exists(image_path)
                    
                    report.append({
                        'file': filename,
                        'title': title_match[:50],
                        'wp_id': pid,
                        'thumb_id': thumb_id,
                        'image_url': url,
                        'image_filename': image_filename,
                        'exists': exists,
                        'has_frontmatter': has_image
                    })
            break

print(f"Found {len([r for r in report if r['image_filename']])} posts with featured images")
print(f"Already on disk: {len([r for r in report if r['exists']])} images")
print(f"\nFirst 10:")
for r in report[:10]:
    print(f"  {r['file']:40} → {r['image_filename']:30} {'✓' if r['exists'] else '✗'}")

# Save report
with open('/home/steelwagstaff/steelwagstaff/scripts/featured-images-report.json', 'w') as f:
    json.dump(report, f, indent=2)

print(f"\n✓ Full report: scripts/featured-images-report.json")
