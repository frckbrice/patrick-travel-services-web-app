const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Icon sizes to generate
const iconSizes = [
  { size: 16, name: 'icon-16x16.png' },
  { size: 32, name: 'icon-32x32.png' },
  { size: 72, name: 'icon-72x72.png' },
  { size: 96, name: 'icon-96x96.png' },
  { size: 128, name: 'icon-128x128.png' },
  { size: 144, name: 'icon-144x144.png' },
  { size: 152, name: 'icon-152x152.png' },
  { size: 192, name: 'icon-192x192.png' },
  { size: 384, name: 'icon-384x384.png' },
  { size: 512, name: 'icon-512x512.png' },
  { size: 180, name: 'apple-touch-icon.png' },
];

// Shortcut icons (smaller sizes for quick actions)
const shortcutIcons = [
  { size: 96, name: 'shortcut-cases.png' },
  { size: 96, name: 'shortcut-messages.png' },
  { size: 96, name: 'shortcut-documents.png' },
];

const sourceLogo = path.join(__dirname, '../public/images/app-logo.png');
const outputDir = path.join(__dirname, '../public/icons');

// Create output directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
  console.log('✅ Created /public/icons directory');
}

async function generateIcons() {
  console.log('🎨 Generating PWA icons from app-logo.png...\n');

  try {
    // Generate main app icons
    for (const { size, name } of iconSizes) {
      await sharp(sourceLogo)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 }, // Transparent background
        })
        .png()
        .toFile(path.join(outputDir, name));

      console.log(`✅ Generated ${name} (${size}x${size})`);
    }

    // Generate shortcut icons (using same logo for now)
    console.log('\n🔗 Generating shortcut icons...\n');
    for (const { size, name } of shortcutIcons) {
      await sharp(sourceLogo)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 },
        })
        .png()
        .toFile(path.join(outputDir, name));

      console.log(`✅ Generated ${name} (${size}x${size})`);
    }

    console.log('\n🎉 All PWA icons generated successfully!');
    console.log(`📁 Location: ${outputDir}`);
    console.log('\n📱 Next steps:');
    console.log('1. Run: pnpm build');
    console.log('2. Run: pnpm start');
    console.log('3. Open: http://localhost:3000');
    console.log('4. Test install prompt (wait 30 seconds)');
    console.log('5. Test offline mode (DevTools > Network > Offline)');
  } catch (error) {
    console.error('❌ Error generating icons:', error);
    process.exit(1);
  }
}

generateIcons();
