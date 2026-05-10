#!/bin/bash

# Simple blog frontmatter validation using basic shell commands

echo "🔍 Validating blog post frontmatter..."
echo ""

BLOG_DIR="src/content/blog/en"
ISSUES=0
VALID=0

for file in "$BLOG_DIR"/*.md; do
  BASENAME=$(basename "$file")
  
  # Extract frontmatter (between first --- and second ---)
  FM=$(sed -n '/^---/,/^---/{/^---/!p;}' "$file" | head -20)
  
  # Check for required fields
  HAS_TITLE=$(echo "$FM" | grep -c "^title:")
  HAS_DATE=$(echo "$FM" | grep -c "^publishedAt:")
  HAS_LOCALE=$(echo "$FM" | grep -c "^locale:")
  
  ERRORS=0
  
  if [ "$HAS_TITLE" -eq 0 ]; then
    echo "❌ $BASENAME - missing title"
    ((ERRORS++))
  fi
  
  if [ "$HAS_DATE" -eq 0 ]; then
    echo "❌ $BASENAME - missing publishedAt"
    ((ERRORS++))
  fi
  
  if [ "$HAS_LOCALE" -eq 0 ]; then
    echo "❌ $BASENAME - missing locale"
    ((ERRORS++))
  fi
  
  if [ "$ERRORS" -eq 0 ]; then
    ((VALID++))
  else
    ((ISSUES++))
  fi
done

TOTAL=$((VALID + ISSUES))

echo ""
echo "=================================================="
echo "VALIDATION SUMMARY"
echo "=================================================="
echo "✅ Valid: $VALID/$TOTAL"
echo "❌ Issues found: $ISSUES"
