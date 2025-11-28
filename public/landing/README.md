# Screenshot Directory

This directory will contain 3 optimized screenshots for the landing page:

1. dashboard-demo.webp - Dashboard with populated dreams and insights
2. reflection-demo.webp - AI-powered reflection analysis
3. evolution-demo.webp - Evolution report showing growth over time

## Requirements:
- Format: WebP
- Max size: 100KB each
- Recommended dimensions: 1920x1080 (full screen)
- Quality: 85%

## Status:
PENDING - Screenshots require populated demo account (Category 1: Demo Content Seeding must be completed first)

## How to capture (once demo content is seeded):
1. Login as demo@mirrorofdreams.com via 'See Demo' button
2. Navigate to /dashboard - Capture full screen screenshot
3. Navigate to any reflection (/reflections/[id]) - Capture screenshot
4. Navigate to any evolution report (/evolution/[id]) - Capture screenshot
5. Convert to WebP: npx sharp-cli -i input.png -o output.webp -f webp -q 85
6. Verify file sizes < 100KB each

