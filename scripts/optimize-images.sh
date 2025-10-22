#!/bin/bash

# Image Optimization Script for Lighthouse Performance
# Compresses images to WebP format for better loading times

echo "  Optimizing images for better Lighthouse scores..."

# Check if imagemagick is installed
if ! command -v convert &> /dev/null; then
    echo "❌ ImageMagick not installed. Please install it:"
    echo "   macOS: brew install imagemagick"
    echo "   Linux: sudo apt-get install imagemagick"
    exit 1
fi

# Navigate to images directory
cd "$(dirname "$0")/../public/images" || exit

echo "📁 Current directory: $(pwd)"
echo ""

# Optimize PNG files
echo "🔄 Converting PNG files to WebP..."
for file in *.png; do
    if [ -f "$file" ]; then
        filename="${file%.*}"
        echo "  Converting: $file"
        convert "$file" -quality 85 -define webp:lossless=false "${filename}.webp"
        echo "  ✅ Created: ${filename}.webp"
    fi
done

# Optimize JPEG files
echo ""
echo "🔄 Converting JPEG files to WebP..."
for file in *.jpeg *.jpg; do
    if [ -f "$file" ]; then
        filename="${file%.*}"
        echo "  Converting: $file"
        convert "$file" -quality 85 -define webp:lossless=false "${filename}.webp"
        echo "  ✅ Created: ${filename}.webp"
    fi
done

# Show file sizes
echo ""
echo "📊 Image sizes comparison:"
echo "----------------------------------------"
du -h *.{png,jpg,jpeg,webp} 2>/dev/null | sort -k2

echo ""
echo "✅ Image optimization complete!"
echo ""
echo "💡 Tips:"
echo "   - WebP files are 25-35% smaller than PNG/JPEG"
echo "   - Update your components to use Next/Image"
echo "   - Consider removing original files if not needed"
echo ""
echo "📝 Next steps:"
echo "   1. Update components to prioritize .webp files"
echo "   2. Use Next.js Image component for automatic optimization"
echo "   3. Run Lighthouse audit to verify improvements"
