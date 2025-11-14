const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');

// Define the splash screen sizes we need for iOS
const splashSizes = [
  { width: 640, height: 1136, name: 'splash-640x1136.png' },
  { width: 750, height: 1334, name: 'splash-750x1334.png' },
  { width: 1242, height: 2208, name: 'splash-1242x2208.png' },
  { width: 1125, height: 2436, name: 'splash-1125x2436.png' },
  { width: 1536, height: 2048, name: 'splash-1536x2048.png' }
];

// Function to generate a single splash screen
async function generateSplashScreen(inputPath, outputPath, width, height) {
  try {
    // Load the source image
    const image = await loadImage(inputPath);
    
    // Create a canvas with the target size
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    // Fill with a dark background (matching the theme color)
    ctx.fillStyle = '#000000';
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

// Main function to generate all splash screens
async function generateAllSplashScreens() {
  const sourceLogoPath = path.join(__dirname, 'src', 'assets', 'BRIX-SPORT-LOGO.png');
  const publicDir = path.join(__dirname, 'public');
  
  console.log('Generating iOS splash screens from BRIX-SPORT-LOGO.png...\n');
  
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
  
  // Generate all splash screens
  try {
    for (const { width, height, name } of splashSizes) {
      const outputPath = path.join(publicDir, name);
      await generateSplashScreen(sourceLogoPath, outputPath, width, height);
    }
    
    console.log('\n✅ All iOS splash screens generated successfully!');
  } catch (error) {
    console.error('\n❌ Failed to generate splash screens:', error.message);
    process.exit(1);
  }
}

// Run the script
generateAllSplashScreens();