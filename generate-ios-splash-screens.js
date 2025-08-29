/**
 * iOS Splash Screen Generator
 * 
 * This script creates placeholder splash screens for iOS devices.
 * For production, replace these with properly designed splash screens.
 */
const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

// Define splash screen sizes
const splashScreens = [
  { name: 'splash-640x1136.png', width: 640, height: 1136 },
  { name: 'splash-750x1334.png', width: 750, height: 1334 },
  { name: 'splash-1242x2208.png', width: 1242, height: 2208 },
  { name: 'splash-1125x2436.png', width: 1125, height: 2436 },
  { name: 'splash-1536x2048.png', width: 1536, height: 2048 }
];

// Directory to save splash screens
const outputDir = path.join(__dirname, 'public');

// Create output directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Generate splash screens
splashScreens.forEach(screen => {
  const canvas = createCanvas(screen.width, screen.height);
  const ctx = canvas.getContext('2d');
  
  // Fill background
  ctx.fillStyle = '#1e40af'; // Blue-800 from Tailwind
  ctx.fillRect(0, 0, screen.width, screen.height);
  
  // Draw app name
  ctx.fillStyle = '#ffffff';
  const fontSize = Math.min(screen.width, screen.height) * 0.15;
  ctx.font = `bold ${fontSize}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('BrixSports', screen.width / 2, screen.height / 2);
  
  // Save to file
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(outputDir, screen.name), buffer);
  
  console.log(`Created: ${screen.name}`);
});

console.log('iOS splash screens generated successfully!');
console.log('Note: For production, replace these with properly designed splash screens.');