#!/bin/bash

# Sisters Salon App Icon Generator
# Usage: ./scripts/generate-icons.sh icon-source.png

SOURCE="${1:-icon-source.png}"

if [ ! -f "$SOURCE" ]; then
    echo "Error: Source file '$SOURCE' not found."
    echo "Usage: ./scripts/generate-icons.sh <source-image.png>"
    echo "Source image should be 1024x1024 pixels."
    exit 1
fi

echo "Generating icons from $SOURCE..."

# Create directories
mkdir -p src-tauri/icons
mkdir -p src-tauri/icons/ios
mkdir -p src-tauri/icons/android/{mipmap-mdpi,mipmap-hdpi,mipmap-xhdpi,mipmap-xxhdpi,mipmap-xxxhdpi}

# macOS/Windows/Linux icons
echo "Generating Desktop icons..."
sips -z 32 32 "$SOURCE" --out src-tauri/icons/32x32.png
sips -z 128 128 "$SOURCE" --out src-tauri/icons/128x128.png
sips -z 256 256 "$SOURCE" --out src-tauri/icons/128x128@2x.png
sips -z 512 512 "$SOURCE" --out src-tauri/icons/icon.png

# macOS .icns
echo "Generating macOS icns..."
mkdir -p icon.iconset
sips -z 16 16 "$SOURCE" --out icon.iconset/icon_16x16.png
sips -z 32 32 "$SOURCE" --out icon.iconset/icon_16x16@2x.png
sips -z 32 32 "$SOURCE" --out icon.iconset/icon_32x32.png
sips -z 64 64 "$SOURCE" --out icon.iconset/icon_32x32@2x.png
sips -z 128 128 "$SOURCE" --out icon.iconset/icon_128x128.png
sips -z 256 256 "$SOURCE" --out icon.iconset/icon_128x128@2x.png
sips -z 256 256 "$SOURCE" --out icon.iconset/icon_256x256.png
sips -z 512 512 "$SOURCE" --out icon.iconset/icon_256x256@2x.png
sips -z 512 512 "$SOURCE" --out icon.iconset/icon_512x512.png
sips -z 1024 1024 "$SOURCE" --out icon.iconset/icon_512x512@2x.png
iconutil -c icns icon.iconset -o src-tauri/icons/icon.icns
rm -rf icon.iconset

# Windows .ico (requires ImageMagick)
echo "Generating Windows ico..."
if command -v convert &> /dev/null; then
    convert "$SOURCE" -define icon:auto-resize=256,128,64,48,32,16 src-tauri/icons/icon.ico
else
    echo "Warning: ImageMagick not found. Skipping .ico generation."
    echo "Install with: brew install imagemagick"
fi

# iOS icons
echo "Generating iOS icons..."
sips -z 20 20 "$SOURCE" --out src-tauri/icons/ios/AppIcon-20x20@1x.png
sips -z 40 40 "$SOURCE" --out src-tauri/icons/ios/AppIcon-20x20@2x.png
sips -z 60 60 "$SOURCE" --out src-tauri/icons/ios/AppIcon-20x20@3x.png
sips -z 29 29 "$SOURCE" --out src-tauri/icons/ios/AppIcon-29x29@1x.png
sips -z 58 58 "$SOURCE" --out src-tauri/icons/ios/AppIcon-29x29@2x.png
sips -z 87 87 "$SOURCE" --out src-tauri/icons/ios/AppIcon-29x29@3x.png
sips -z 40 40 "$SOURCE" --out src-tauri/icons/ios/AppIcon-40x40@1x.png
sips -z 80 80 "$SOURCE" --out src-tauri/icons/ios/AppIcon-40x40@2x.png
sips -z 120 120 "$SOURCE" --out src-tauri/icons/ios/AppIcon-40x40@3x.png
sips -z 120 120 "$SOURCE" --out src-tauri/icons/ios/AppIcon-60x60@2x.png
sips -z 180 180 "$SOURCE" --out src-tauri/icons/ios/AppIcon-60x60@3x.png
sips -z 76 76 "$SOURCE" --out src-tauri/icons/ios/AppIcon-76x76@1x.png
sips -z 152 152 "$SOURCE" --out src-tauri/icons/ios/AppIcon-76x76@2x.png
sips -z 167 167 "$SOURCE" --out src-tauri/icons/ios/AppIcon-83.5x83.5@2x.png
sips -z 1024 1024 "$SOURCE" --out src-tauri/icons/ios/AppIcon-1024x1024@1x.png

# Android icons
echo "Generating Android icons..."
sips -z 48 48 "$SOURCE" --out src-tauri/icons/android/mipmap-mdpi/ic_launcher.png
sips -z 72 72 "$SOURCE" --out src-tauri/icons/android/mipmap-hdpi/ic_launcher.png
sips -z 96 96 "$SOURCE" --out src-tauri/icons/android/mipmap-xhdpi/ic_launcher.png
sips -z 144 144 "$SOURCE" --out src-tauri/icons/android/mipmap-xxhdpi/ic_launcher.png
sips -z 192 192 "$SOURCE" --out src-tauri/icons/android/mipmap-xxxhdpi/ic_launcher.png

echo "Icon generation complete!"
echo ""
echo "Generated icons:"
echo "  - Desktop: src-tauri/icons/"
echo "  - iOS: src-tauri/icons/ios/"
echo "  - Android: src-tauri/icons/android/"
