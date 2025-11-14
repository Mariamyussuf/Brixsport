const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');

// Define the sizes we need for Logger PWA icons
const loggerIconSizes = [
  { size: 180, name: 'logger-apple-touch-icon.png' },
  { size: 152, name: 'logger-apple-touch-icon-152x152.png' },
  { size: 167, name: 'logger-apple-touch-icon-167x167.png' },
  { size: 180, name: 'logger-apple-touch-icon-180x180.png' }
];

// Define the splash screen sizes we need for Logger iOS
const loggerSplashSizes = [
  { width: 640, height: 1136, name: 'logger-splash-640x1136.png' },
  { width: 750, height: 1334, name: 'logger-splash-750x1334.png' },
  { width: 1242, height: 2208, name: 'logger-splash-1242x2208.png' },
  { width: 1125, height: 2436, name: 'logger-splash-1125x2436.png' },
  { width: 1536, height: 2048, name: 'logger-splash-1536x2048.png' }
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

// Function to generate a single splash screen
async function generateSplashScreen(inputPath, outputPath, width, height) {
  try {
    // Load the source image
    const image = await loadImage(inputPath);
    
    // Create a canvas with the target size
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    // Fill with a blue background (matching the logger theme color)
    ctx.fillStyle = '#2563eb';
    ctx.fillRect(0, 0, width, height);
    
    // Calculate dimensions to fit the logo while maintaining aspect ratio
    const maxWidth = width * 0.6;  // Use 60% of the width
    const maxHeight = height * 0.4; // Use 40% of the height
    
    const aspectRatio = image.width / image.height;
    let drawWidth, drawHeight;
    
    if (aspectRatio > maxWidth / maxHeight) {
      // Image is wider relative to its height
      drawWidth = Math.min(maxWidth, image.width);
      drawHeight = drawWidth / aspectRatio;
    } else {
      // Image is taller relative to its width
      drawHeight = Math.min(maxHeight, image.height);
      drawWidth = drawHeight * aspectRatio;
    }
    
    // Center the image
    const offsetX = (width - drawWidth) / 2;
    const offsetY = (height - drawHeight) / 2;
    
    // Draw the image on the canvas
    ctx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
    
    // Write the canvas to a PNG file
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(outputPath, buffer);
    
    console.log(`✓ Generated ${width}x${height} splash screen: ${path.basename(outputPath)}`);
  } catch (error) {
    console.error(`✗ Error generating ${width}x${height} splash screen:`, error.message);
    throw error;
  }
}

// Main function to generate all logger assets
async function generateAllLoggerAssets() {
  const sourceLogoPath = path.join(__dirname, 'src', 'assets', 'BRIX-SPORT-LOGO.png');
  const publicDir = path.join(__dirname, 'public');
  
  console.log('Generating Logger PWA assets from BRIX-SPORT-LOGO.png...\n');
  
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
  
  // Generate all logger icons
  try {
    console.log('Generating Logger icons...\n');
    for (const { size, name } of loggerIconSizes) {
      const outputPath = path.join(publicDir, name);
      await generateIcon(sourceLogoPath, outputPath, size);
    }
    
    console.log('\nGenerating Logger splash screens...\n');
    // Generate all logger splash screens
    for (const { width, height, name } of loggerSplashSizes) {
      const outputPath = path.join(publicDir, name);
      await generateSplashScreen(sourceLogoPath, outputPath, width, height);
    }
    
    console.log('\n✅ All Logger PWA assets generated successfully!');
  } catch (error) {
    console.error('\n❌ Failed to generate Logger assets:', error.message);
    process.exit(1);
  }
}

// Run the script
generateAllLoggerAssets();