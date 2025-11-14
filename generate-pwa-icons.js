const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');

// Define the sizes we need for PWA icons
const iconSizes = [
  { size: 96, name: 'icon-96x96.png' },
  { size: 192, name: 'icon-192x192.png' },
  { size: 256, name: 'icon-256x256.png' },
  { size: 384, name: 'icon-384x384.png' },
  { size: 512, name: 'icon-512x512.png' },
  { size: 180, name: 'apple-touch-icon.png' },
  { size: 152, name: 'apple-touch-icon-152x152.png' },
  { size: 167, name: 'apple-touch-icon-167x167.png' },
  { size: 180, name: 'apple-touch-icon-180x180.png' }
];

// Function to generate a single icon
async function generateIcon(inputPath, outputPath, size) {
  try {
    // Load the source image
    const image = await loadImage(inputPath);
    
    // Create a canvas with the target size
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    
    // Calculate dimensions to maintain aspect ratio and center the image
    const aspectRatio = image.width / image.height;
    let drawWidth, drawHeight, offsetX, offsetY;
    
    if (aspectRatio > 1) {
      // Landscape image
      drawHeight = size;
      drawWidth = size * aspectRatio;
      offsetX = (size - drawWidth) / 2;
      offsetY = 0;
    } else {
      // Portrait or square image
      drawWidth = size;
      drawHeight = size / aspectRatio;
      offsetX = 0;
      offsetY = (size - drawHeight) / 2;
    }
    
    // Draw the image on the canvas
    ctx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
    
    // Write the canvas to a PNG file
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(outputPath, buffer);
    
    console.log(`✓ Generated ${size}x${size} icon: ${path.basename(outputPath)}`);
  } catch (error) {
    console.error(`✗ Error generating ${size}x${size} icon:`, error.message);
    throw error;
  }
}

// Main function to generate all icons
async function generateAllIcons() {
  const sourceLogoPath = path.join(__dirname, 'src', 'assets', 'BRIX-SPORT-LOGO.png');
  const publicDir = path.join(__dirname, 'public');
  
  console.log('Generating PWA icons from BRIX-SPORT-LOGO.png...\n');
  
  // Check if source logo exists
  if (!fs.existsSync(sourceLogoPath)) {
    console.error('❌ Source logo not found at:', sourceLogoPath);
    process.exit(1);
  }
  
  // Ensure public directory exists
  if (!fs.existsSync(publicDir)) {
    console.error('❌ Public directory not found at:', publicDir);
    process.exit(1);
  }
  
  // Generate all icons
  try {
    for (const { size, name } of iconSizes) {
      const outputPath = path.join(publicDir, name);
      await generateIcon(sourceLogoPath, outputPath, size);
    }
    
    console.log('\n✅ All PWA icons generated successfully!');
  } catch (error) {
    console.error('\n❌ Failed to generate icons:', error.message);
    process.exit(1);
  }
}

// Run the script
generateAllIcons();